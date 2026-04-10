import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Node } from 'ng-diagram';
import { isOccupiedNode, isOrgChartNode, isOrgChartNodeData } from '../diagram/guards';
import {
  OrgChartRole,
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
} from '../diagram/interfaces';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { ModelApplyService } from '../diagram/model-apply.service';
import { ModelChanges } from '../diagram/model-changes';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type ComboboxOption } from '../shared/combobox/combobox.component';
import {
  formDataToNodeData,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';

@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

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

  readonly roleOptions: ComboboxOption<OrgChartRole>[] = Object.values(OrgChartRole)
    .sort((a, b) => a.localeCompare(b))
    .map((role) => ({ value: role, label: role }));

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

  async removeSelectedNode(): Promise<void> {
    const node = this.selectedNode();
    if (!node || !this.layoutGate.isIdle()) return;

    const parentId = this.hierarchyService.getParentId(node.id);

    const changes = new ModelChanges();
    changes.addDeleteNodeIds(node.id);

    if (parentId) {
      this.hierarchyService.clearHasChildrenFlags([parentId], changes, new Set([node.id]));
    }

    await this.modelApplyService.applyWithLayout(changes);
  }

  handleFieldChange(change: SidebarFieldChange): void {
    const node = this.modelService.getNodeById(change.nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    if (this.hasNodeDataChanges(change)) {
      const updatedNodeData = formDataToNodeData(change.formData, node.data);
      this.updateNodeData(change.nodeId, updatedNodeData);
    }

    if (this.hasHierarchicalChanges(change) && this.layoutGate.isIdle()) {
      this.updateNodeParent(change.nodeId, change.formData.reportsTo);
    }
  }

  private async updateNodeParent(nodeId: string, newParentId: string | null): Promise<void> {
    const changes = this.hierarchyService.updateNodeParent(nodeId, newParentId);
    await this.modelApplyService.applyWithLayout(changes);
    this.nodeVisibilityService.ensureVisible(nodeId);
  }

  private hasHierarchicalChanges(change: SidebarFieldChange): boolean {
    const currentParentId = this.hierarchyService.getParentId(change.nodeId);
    return change.fields.includes('reportsTo') && change.formData.reportsTo !== currentParentId;
  }

  private hasNodeDataChanges(change: SidebarFieldChange): boolean {
    return change.fields.some((f) => f !== 'reportsTo');
  }
}
