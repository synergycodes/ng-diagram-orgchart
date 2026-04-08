import { DOCUMENT } from '@angular/common';
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
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type SelectDropdownOption } from '../shared/select-dropdown/select-dropdown.component';
import {
  formDataToNodeData,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';

@Injectable()
export class PropertiesSidebarService {
  private readonly document = inject(DOCUMENT);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly sortOrderService = inject(SortOrderService);

  readonly isExpanded = signal(false);

  private cachedWidth: number | null = null;

  get width(): number {
    if (this.cachedWidth === null) {
      const el = this.document.querySelector('app-properties-sidebar');
      this.cachedWidth =
        parseFloat(el ? getComputedStyle(el).getPropertyValue('--sidebar-width') : '') || 0;
    }
    return this.cachedWidth;
  }

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
      this.updateNodeParent(change.nodeId, change.formData.reportsTo);
    }
  }

  private async updateNodeParent(nodeId: string, newParentId: string | null): Promise<void> {
    if (!this.layoutGate.isIdle()) return;

    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;

    if (newParentId === oldParentId) return;

    const changes = new ModelChanges();
    this.hierarchyService.computeEdgeMutations(changes, nodeId, newParentId, incomingEdge);
    this.hierarchyService.computeParentFlagUpdates(changes, nodeId, oldParentId, newParentId);

    if (newParentId) {
      this.sortOrderService.reorderChildren(
        newParentId,
        [{ nodeId, referenceId: null, position: 'after' }],
        changes,
      );
    }

    if (oldParentId) {
      this.sortOrderService.reorderChildren(oldParentId, [], changes, new Set([nodeId]));
    }

    await this.modelApplyService.applyWithLayout(changes);
    this.nodeVisibilityService.ensureVisible(nodeId);
  }

  private hasHierarchicalChanges(change: SidebarFieldChange): boolean {
    return change.fields.includes('reportsTo');
  }

  private hasNodeDataChanges(change: SidebarFieldChange): boolean {
    return change.fields.some((f) => f !== 'reportsTo');
  }
}
