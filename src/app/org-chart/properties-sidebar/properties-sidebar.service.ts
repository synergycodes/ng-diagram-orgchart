import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Node } from 'ng-diagram';
import { isOccupiedNode, isOrgChartNode, isOrgChartNodeData } from '../diagram/guards';
import {
  OrgChartRole,
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
} from '../diagram/interfaces';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type SelectDropdownOption } from '../shared/select-dropdown/select-dropdown.component';
import {
  formDataToNodeData,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';

@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);

  readonly isExpanded = signal(false);
  readonly selectedOrgChartNodes = computed<Node<OrgChartNodeData>[]>(() =>
    this.selectionService.selection().nodes.filter(isOrgChartNode),
  );
  readonly selectedNode = computed<Node<OrgChartNodeData> | undefined>(() =>
    this.selectedOrgChartNodes().at(0),
  );
  readonly reportsToCandidateNodes = computed<Node<OrgChartOccupiedNodeData>[]>(() => {
    const selectedNode = this.selectedNode();
    if (!selectedNode) return [];
    const descendantIds = this.hierarchyService.getDescendantIds(selectedNode.id);
    return this.modelService
      .nodes()
      .filter(
        (node): node is Node<OrgChartOccupiedNodeData> =>
          node.id !== selectedNode.id && !descendantIds.has(node.id) && isOccupiedNode(node),
      );
  });

  readonly roleOptions: SelectDropdownOption<OrgChartRole>[] = Object.values(OrgChartRole).map(
    (role) => ({ value: role, label: role }),
  );

  readonly selectedNodeParentId = computed<string | null>(() => {
    const node = this.selectedNode();
    return node ? this.hierarchyService.getParentId(node.id) : null;
  });

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const selectedNodes = this.selectedOrgChartNodes();
    if (selectedNodes.length === 0) return 'empty';
    if (selectedNodes.length > 1) return 'multi';
    return 'single';
  });

  // TODO: fix when ng-diagram supports generic updateNodeData. `& Record<string, unknown>` here is fix for `updateNodeData` constrains
  updateNodeData(id: string, data: OrgChartNodeData & Record<string, unknown>): void {
    this.modelService.updateNodeData(id, data);
  }

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }

  handleFieldChange(change: SidebarFieldChange): void {
    const node = this.modelService.getNodeById(change.nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    if (this.hasNodeDataChanges(change)) {
      const updatedNodeData = formDataToNodeData(change.formData, node.data);
      this.updateNodeData(change.nodeId, updatedNodeData);
    }

    if (this.hasHierarchicalChanges(change)) {
      this.hierarchyService.updateNodeParent(change.nodeId, change.formData.reportsTo);
    }
  }

  private hasHierarchicalChanges = (change: SidebarFieldChange) => {
    return change.fields.includes('reportsTo');
  };

  private hasNodeDataChanges = (change: SidebarFieldChange) => {
    return change.fields.some((f) => f !== 'reportsTo');
  };
}
