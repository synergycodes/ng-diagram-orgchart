import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { getHasChildren, getIsCollapsed } from './data-getters';
import { ExpandCollapseService } from './expand-collapse.service';
import { isOrgChartNode, isOrgChartNodeData } from './guards';
import { EdgeTemplateType, HAS_CHILDREN } from './interfaces';
import { ModelChanges } from './model-changes';
import { SortOrderService } from './sort-order.service';
import type { VisibilityHint } from '../layout/layout.service';

export interface UpdateNodeParentResult {
  changes: ModelChanges;
  visibilityHint?: VisibilityHint;
}

/** Manages parent–child relationships in the org-chart tree. */
@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly sortOrderService = inject(SortOrderService);

  /** Returns the parent node ID, or `null` if the node is the root. */
  getParentId(nodeId: string): string | null {
    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    return incomingEdge?.source ?? null;
  }

  /** Collects all descendant IDs below the given node (excluding the node itself). */
  getDescendantIds(nodeId: string): Set<string> {
    const childrenMap = this.buildChildrenMap();
    const descendantIds = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop();
      if (parentId === undefined) break;
      const children = childrenMap.get(parentId);
      if (children) {
        for (const childId of children) {
          descendantIds.add(childId);
          stack.push(childId);
        }
      }
    }

    return descendantIds;
  }

  /**
   * Moves a node to a new parent (or reorders it under the same parent when
   * `placement` is given), updating edges, `hasChildren` flags, and sort order
   * on both the old and new parent. Expands the new parent if it is collapsed.
   *
   * @param placement Optional sibling reference for insertion order. Required
   *                  for same-parent reorders; appends at the end otherwise.
   * @param modelChanges Accumulator to append changes to; creates a new one if omitted.
   * @returns `changes` — the accumulated model changes
   *          `visibilityHint` — set when the new parent was collapsed and had
   *          to be expanded, so callers can forward it to the layout pass.
   */
  updateNodeParent(
    nodeId: string,
    newParentId: string | null,
    placement?: { referenceId: string; position: 'before' | 'after' },
    modelChanges: ModelChanges = new ModelChanges(),
  ): UpdateNodeParentResult {
    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;
    const isParentChange = oldParentId !== newParentId;

    // No parent change and no reorder requested — nothing to do.
    if (!isParentChange && !placement) {
      return { changes: modelChanges };
    }

    let visibilityHint: VisibilityHint | undefined;
    if (isParentChange && newParentId) {
      const targetNode = this.modelService.getNodeById(newParentId);
      if (isOrgChartNode(targetNode) && getIsCollapsed(targetNode)) {
        const result = this.expandCollapseService.prepareToggle(newParentId, modelChanges);
        if (result) {
          visibilityHint = { subtreeIds: result.toggledSubtreeIds, collapsing: false };
        }
      }
    }

    if (isParentChange) {
      this.updateParentEdge(modelChanges, nodeId, newParentId, incomingEdge);
      this.updateHasChildrenFlags(modelChanges, nodeId, oldParentId, newParentId);

      if (oldParentId) {
        this.sortOrderService.reorderChildren(oldParentId, [], modelChanges, new Set([nodeId]));
      }
    }

    if (newParentId) {
      // On same-parent reorders `nodeId` is already in the parent's child list,
      // so without this exclusion it would end up twice in the new order —
      // once at its current slot and once at the placement slot. On parent
      // changes the node isn't yet a child of `newParentId` (the edge update
      // is only queued in `modelChanges`), so the exclusion is a no-op.
      this.sortOrderService.reorderChildren(
        newParentId,
        [
          {
            nodeId,
            referenceId: placement?.referenceId ?? null,
            position: placement?.position ?? 'after',
          },
        ],
        modelChanges,
        new Set([nodeId]),
      );
    }

    return { changes: modelChanges, visibilityHint };
  }

  /** Adds, removes, or re-targets the incoming edge to reflect the new parent. */
  private updateParentEdge(
    changes: ModelChanges,
    nodeId: string,
    newParentId: string | null,
    incomingEdge: { id: string } | undefined,
  ): void {
    if (incomingEdge && newParentId) {
      changes.addEdgeUpdates({ id: incomingEdge.id, source: newParentId });
    } else if (incomingEdge && !newParentId) {
      changes.addDeleteEdgeIds(incomingEdge.id);
    } else if (!incomingEdge && newParentId) {
      changes.addNewEdges({
        id: crypto.randomUUID(),
        source: newParentId,
        sourcePort: 'port-out',
        target: nodeId,
        targetPort: 'port-in',
        type: EdgeTemplateType.OrgChartEdge,
        data: { type: 'orgChart' },
      });
    }
  }

  /**
   * Clears `hasChildren` on parent nodes that no longer have outgoing edges.
   * `excludeChildIds` allows ignoring children that are about to be removed.
   */
  clearHasChildrenFlags(
    parentIds: string[],
    changes: ModelChanges,
    excludeChildIds?: Set<string>,
  ): void {
    for (const parentId of parentIds) {
      const stillHasChildren = this.modelService
        .getConnectedEdges(parentId)
        .some((e) => e.source === parentId && (!excludeChildIds || !excludeChildIds.has(e.target)));
      if (stillHasChildren) continue;

      const node = this.modelService.getNodeById(parentId);
      if (node && isOrgChartNodeData(node.data) && getHasChildren(node)) {
        changes.addNodeUpdates({ id: parentId, data: { [HAS_CHILDREN]: false } });
      }
    }
  }

  /** Syncs `hasChildren` on old and new parent after a move. */
  private updateHasChildrenFlags(
    changes: ModelChanges,
    nodeId: string,
    oldParentId: string | null,
    newParentId: string | null,
  ): void {
    if (oldParentId) {
      const oldParentWillHaveChildren = this.modelService
        .getConnectedEdges(oldParentId)
        .some((e) => e.source === oldParentId && e.target !== nodeId);

      const oldParent = this.modelService.getNodeById(oldParentId);
      if (
        oldParent &&
        isOrgChartNodeData(oldParent.data) &&
        getHasChildren(oldParent) &&
        !oldParentWillHaveChildren
      ) {
        changes.addNodeUpdates({
          id: oldParentId,
          data: { [HAS_CHILDREN]: false },
        });
      }
    }

    if (newParentId) {
      const newParent = this.modelService.getNodeById(newParentId);
      if (newParent && isOrgChartNodeData(newParent.data) && !getHasChildren(newParent)) {
        changes.addNodeUpdates({
          id: newParentId,
          data: { [HAS_CHILDREN]: true },
        });
      }
    }
  }

  /** Builds a parentId → childIds[] lookup from the current edge set. */
  private buildChildrenMap(): Map<string, string[]> {
    const childrenMap = new Map<string, string[]>();
    for (const edge of this.modelService.edges()) {
      const children = childrenMap.get(edge.source);
      if (children) {
        children.push(edge.target);
      } else {
        childrenMap.set(edge.source, [edge.target]);
      }
    }
    return childrenMap;
  }
}
