import { inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Edge, type Node } from 'ng-diagram';
import { isOrgChartNode } from '../diagram/guards';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartEdgeData,
  type OrgChartNodeData,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { ExpandCollapseService } from '../diagram/expand-collapse/expand-collapse.service';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { ModelApplyService } from '../diagram/model-apply.service';
import { ModelChanges } from '../diagram/model-changes';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type AddNodeConfig } from './provide-add-node';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly hierarchyService = inject(HierarchyService);

  constructor(private readonly config?: AddNodeConfig) {}

  /**
   * Adds a new vacant node as a child or sibling of the given node.
   * Computes sort order, expands the parent if collapsed, re-layouts, and selects the new node.
   *
   * @param nodeId - The reference node to add relative to.
   * @param action - Whether to add as `child`, `siblingBefore`, or `siblingAfter`.
   */
  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    if (!this.layoutGate.isIdle()) return;

    const { parentId, referenceNodeId, position } = this.resolveParams(nodeId, action);
    if (!parentId) return;

    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode || !isOrgChartNode(parentNode)) return;

    const needsExpand = action === 'child' && !!parentNode.data.isCollapsed;
    const newNodeId = crypto.randomUUID();

    const { changes, sortOrders } = this.sortOrderService.reorderChildren(
      parentId,
      [{ nodeId: newNodeId, referenceId: referenceNodeId, position }],
    );

    changes.addNewNodes(this.createVacantNode(newNodeId, sortOrders[newNodeId]));
    changes.addNewEdges(this.createEdge(parentId, newNodeId));

    const expandSubtreeIds = this.updateParentNode(parentNode, needsExpand, changes);

    await this.layoutGate.execute(async () => {
      await this.layoutService.computeLayout(
        changes,
        expandSubtreeIds ? { subtreeIds: expandSubtreeIds, collapsing: false } : undefined,
      );
      await this.modelApplyService.apply(changes);
    });

    this.selectionService.select([newNodeId]);
    this.config?.onNodeAdded?.(newNodeId);
    this.nodeVisibilityService.ensureVisible(newNodeId);
  }

  /** Resolves the parent ID, reference node, and insertion position for the given action. */
  private resolveParams(
    nodeId: string,
    action: AddNodeAction,
  ): {
    parentId: string | null;
    referenceNodeId: string | null;
    position: 'before' | 'after';
  } {
    if (action === 'child') {
      return { parentId: nodeId, referenceNodeId: null, position: 'after' };
    }
    return {
      parentId: this.hierarchyService.getParentId(nodeId),
      referenceNodeId: nodeId,
      position: action === 'siblingBefore' ? 'before' : 'after',
    };
  }

  /**
   * Updates the parent node's data (`hasChildren`) and expands its subtree if needed.
   * Appends expand visibility changes first, then the parent data update (which takes precedence).
   *
   * @returns The set of subtree IDs affected by the expand, or `undefined` if no expand was needed.
   */
  private updateParentNode(
    parentNode: Node<OrgChartNodeData>,
    needsExpand: boolean,
    changes: ModelChanges,
  ): Set<string> | undefined {
    let expandSubtreeIds: Set<string> | undefined;

    if (needsExpand) {
      expandSubtreeIds = this.expandCollapseService.prepareToggle(
        parentNode.id,
        changes,
      )?.toggledSubtreeIds;
    }

    changes.addNodeUpdates({
      id: parentNode.id,
      data: {
        ...parentNode.data,
        hasChildren: true,
        ...(needsExpand ? { isCollapsed: false, collapsedChildrenCount: undefined } : {}),
      },
    });

    return expandSubtreeIds;
  }

  /** Creates a new vacant node with the given sort order. */
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

  /** Creates an org-chart edge connecting a parent to a child node. */
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
