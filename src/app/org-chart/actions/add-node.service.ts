import { inject } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  type Edge,
  type Node,
} from 'ng-diagram';
import { isOrgChartNode } from '../diagram/guards';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartEdgeData,
  type OrgChartNodeData,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { ExpandCollapseService } from '../diagram/expand-collapse/expand-collapse.service';
import { LayoutService } from '../diagram/layout/layout.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type AddNodeConfig } from './provide-add-node';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly layoutService = inject(LayoutService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly hierarchyService = inject(HierarchyService);

  constructor(private readonly config?: AddNodeConfig) {}

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    if (!this.layoutService.isIdle()) return;

    const { parentId, referenceNodeId, position } = this.resolveParams(nodeId, action);
    if (!parentId) return;

    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode || !isOrgChartNode(parentNode)) return;

    const needsExpand = action === 'child' && !!parentNode.data.isCollapsed;

    // 1. Compute sort order
    const { sortOrder, siblingUpdates } = this.sortOrderService.insertSortOrder(
      parentId,
      referenceNodeId,
      position,
    );

    // 2. Create new elements
    const newNodeId = crypto.randomUUID();
    const newNode = this.createVacantNode(newNodeId, sortOrder);
    const newEdge = this.createEdge(parentId, newNodeId);

    // 3. Compute expand mutations (if needed)
    let subtreeNodeUpdates: { id: string; data: OrgChartNodeData }[] = [];
    let subtreeEdgeUpdates: { id: string; data: OrgChartEdgeData }[] = [];
    let expandSubtreeIds: Set<string> | undefined;

    if (needsExpand) {
      const expandResult = this.expandCollapseService.prepareExpand(parentId);
      if (expandResult) {
        subtreeNodeUpdates = expandResult.subtreeNodeUpdates;
        subtreeEdgeUpdates = expandResult.subtreeEdgeUpdates;
        expandSubtreeIds = expandResult.subtreeIds;
      }
    }

    // 4. Build parent data update (merge hasChildren + expand patch)
    const parentData: OrgChartNodeData = {
      ...parentNode.data,
      hasChildren: true,
      ...(needsExpand ? { isCollapsed: false, collapsedChildrenCount: undefined } : {}),
    };
    const parentUpdate = { id: parentId, data: parentData };

    // 5. Apply with layout
    await this.layoutService.applyWithLayout(
      {
        newNodes: [newNode],
        newEdges: [newEdge],
        nodeUpdates: [parentUpdate, ...siblingUpdates, ...subtreeNodeUpdates],
        edgeUpdates: subtreeEdgeUpdates,
      },
      expandSubtreeIds ? { subtreeIds: expandSubtreeIds, collapsing: false } : undefined,
    );

    // 7. Post-layout actions
    this.selectionService.select([newNodeId]);
    this.config?.onNodeAdded?.(newNodeId);
    this.nodeVisibilityService.ensureVisible(newNodeId);
  }

  private resolveParams(
    nodeId: string,
    action: AddNodeAction,
  ): {
    parentId: string | null;
    referenceNodeId: string | null;
    position: 'before' | 'after';
  } {
    switch (action) {
      case 'child':
        return { parentId: nodeId, referenceNodeId: null, position: 'after' };
      case 'siblingBefore':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          referenceNodeId: nodeId,
          position: 'before',
        };
      case 'siblingAfter':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          referenceNodeId: nodeId,
          position: 'after',
        };
    }
  }

  private createVacantNode(id: string, sortOrder: number): Node<OrgChartVacantNodeData> {
    return {
      id,
      type: NodeTemplateType.OrgChartNode,
      position: { x: 0, y: 0 },
      data: {
        type: 'vacant',
        role: undefined,
        reports: Math.floor(Math.random() * 11),
        span: Math.floor(Math.random() * 2001),
        shiftCapacity: Math.floor(Math.random() * 101),
        sortOrder,
        isCollapsed: false,
        hasChildren: false,
      },
    };
  }

  private createEdge(parentId: string, childId: string): Edge<OrgChartEdgeData> {
    return {
      id: crypto.randomUUID(),
      source: parentId,
      sourcePort: 'port-out',
      target: childId,
      targetPort: 'port-in',
      type: EdgeTemplateType.OrgChartEdge,
      data: { type: 'orgChart' },
    };
  }
}
