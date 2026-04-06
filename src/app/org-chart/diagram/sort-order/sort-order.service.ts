import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { isOrgChartNode } from '../guards';
import { type OrgChartNodeData } from '../interfaces';

export interface ReorderChange {
  nodeId: string;
  referenceId: string | null;
  position: 'before' | 'after';
}

@Injectable()
export class SortOrderService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  /**
   * Returns children of the given parent sorted by their current `sortOrder`.
   *
   * @param parentId - The parent node whose children to retrieve.
   * @returns Children sorted by ascending `sortOrder`, each with its `id` and current `sortOrder`.
   */
  getSortedChildren(parentId: string): { id: string; sortOrder: number }[] {
    return this.modelService
      .getConnectedEdges(parentId)
      .filter((e) => e.source === parentId)
      .map((e) => {
        const node = this.modelService.getNodeById(e.target);
        return {
          id: e.target,
          sortOrder: isOrgChartNode(node) ? (node.data.sortOrder ?? 0) : 0,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Recomputes `sortOrder` for children of the given parent, optionally
   * inserting new nodes at positions defined by `changes`.
   *
   * @param parentId - The parent node whose children to reorder.
   * @param changes - Nodes to insert before/after a reference child, or append at the end.
   * @returns `updates` — model patches for existing nodes whose sortOrder changed;
   *          `sortOrders` — assigned sortOrder for each node listed in `changes`
   *          (useful when the node hasn't been created yet).
   */
  reorderChildren(
    parentId: string,
    changes: ReorderChange[] = [],
  ): { updates: { id: string; data: OrgChartNodeData }[]; sortOrders: Record<string, number> } {
    const orderedChildren = this.getSortedChildren(parentId);
    const finalOrder = this.buildFinalOrder(orderedChildren, changes);

    const sortOrders: Record<string, number> = {};
    const changeNodeIds = new Set(changes.map((c) => c.nodeId));

    for (let i = 0; i < finalOrder.length; i++) {
      if (changeNodeIds.has(finalOrder[i])) {
        sortOrders[finalOrder[i]] = i;
      }
    }

    return { updates: this.buildSortOrderUpdates(finalOrder), sortOrders };
  }

  /**
   * Assigns sequential `sortOrder` (0, 1, 2, ...) to every sibling group
   * based on the current edge topology. Runs once at init and skips if
   * all nodes already have a `sortOrder` defined.
   */
  async initSortOrder(): Promise<void> {
    const model = this.modelService.getModel();
    const nodes = model.getNodes();

    const needsInit = nodes.some((n) => isOrgChartNode(n) && n.data.sortOrder === undefined);
    if (!needsInit) return;

    const edges = model.getEdges();
    const childrenByParent = new Map<string, string[]>();
    const targetIds = new Set<string>();

    for (const edge of edges) {
      const children = childrenByParent.get(edge.source) ?? [];
      children.push(edge.target);
      childrenByParent.set(edge.source, children);
      targetIds.add(edge.target);
    }

    const rootUpdates = nodes
      .filter((n) => isOrgChartNode(n) && !targetIds.has(n.id))
      .map((n) => ({ id: n.id, data: { ...n.data, sortOrder: 0 } }));

    const childUpdates = [...childrenByParent.values()].flatMap((children) =>
      this.buildSortOrderUpdates(children),
    );

    await this.diagramService.transaction(async () => {
      this.modelService.updateNodes([...rootUpdates, ...childUpdates]);
    });
  }

  /** Produces the final node ID sequence by inserting `changes` into the current children order. */
  private buildFinalOrder(orderedChildren: { id: string }[], changes: ReorderChange[]): string[] {
    const changesByRef = new Map<string, ReorderChange[]>();
    const appendChanges: ReorderChange[] = [];

    for (const change of changes) {
      if (change.referenceId === null) {
        appendChanges.push(change);
      } else {
        const list = changesByRef.get(change.referenceId) ?? [];
        list.push(change);
        changesByRef.set(change.referenceId, list);
      }
    }

    const finalOrder: string[] = [];

    for (const child of orderedChildren) {
      const refChanges = changesByRef.get(child.id);
      if (refChanges) {
        for (const c of refChanges) {
          if (c.position === 'before') finalOrder.push(c.nodeId);
        }
      }

      finalOrder.push(child.id);

      if (refChanges) {
        for (const c of refChanges) {
          if (c.position === 'after') finalOrder.push(c.nodeId);
        }
      }
    }

    for (const c of appendChanges) {
      finalOrder.push(c.nodeId);
    }

    return finalOrder;
  }

  /** Returns model patches for nodes whose current `sortOrder` differs from their target index. */
  private buildSortOrderUpdates(nodeIds: string[]): { id: string; data: OrgChartNodeData }[] {
    const updates: { id: string; data: OrgChartNodeData }[] = [];

    for (let i = 0; i < nodeIds.length; i++) {
      const node = this.modelService.getNodeById(nodeIds[i]);
      if (!node || !isOrgChartNode(node)) continue;
      if ((node.data.sortOrder ?? 0) === i) continue;
      updates.push({ id: nodeIds[i], data: { ...node.data, sortOrder: i } });
    }

    return updates;
  }
}
