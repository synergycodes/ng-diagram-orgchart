import { inject, Injectable, signal, computed } from '@angular/core';
import {
  NgDiagramModelService,
  type Edge as DiagramEdge,
  type Node as DiagramNode,
} from 'ng-diagram';
import { type OrgChartNodeData } from '../interfaces';
import { ModelChanges } from '../model-changes';
import { findRootNode, getFutureVisibleSet, getVisibleSet } from '../utils/visible-set';
import { performLayout } from './perform-layout';

export type LayoutDirection = 'DOWN' | 'RIGHT';

export interface VisibilityHint {
  subtreeIds: Set<string>;
  collapsing: boolean;
}

/**
 * Computes org-chart node positions and manages layout direction.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a tree
 * hierarchy. Reads accumulated `ModelChanges` to resolve the future
 * visible set, then appends computed positions back into the same instance.
 */
@Injectable()
export class LayoutService {
  private readonly modelService = inject(NgDiagramModelService);

  private readonly _direction = signal<LayoutDirection>('DOWN');
  readonly direction = this._direction.asReadonly();
  readonly isHorizontal = computed(() => this._direction() === 'RIGHT');

  setDirection(value: LayoutDirection): void {
    this._direction.set(value);
  }

  /**
   * Computes layout positions and appends them as nodeUpdates to the given changes.
   *
   * Reads accumulated changes to resolve the future visible set, merges sort order
   * overrides, runs ELK, applies root pinning, and appends position updates.
   *
   * @param changes - Accumulated model changes; position updates are appended to it.
   * @param visibility - Optional hint for expand/collapse to determine the future visible set.
   * @returns The same `changes` instance with position updates appended.
   */
  async computeLayout(changes: ModelChanges, visibility?: VisibilityHint): Promise<ModelChanges> {
    const { nodes, edges } = this.resolveVisibleSet(changes, visibility);
    const sorted = this.sortByOrder(nodes, edges, changes);
    const positions = await this.computePositions(sorted.nodes, sorted.edges);
    changes.addNodeUpdates(...positions);
    return changes;
  }

  /** Resolves the future visible set by applying pending mutations to the current model. */
  private resolveVisibleSet(
    changes: ModelChanges,
    visibility?: VisibilityHint,
  ): { nodes: DiagramNode<OrgChartNodeData>[]; edges: DiagramEdge[] } {
    const model = this.modelService.getModel();
    let { nodes, edges } = visibility
      ? getFutureVisibleSet(
          model.getNodes(),
          model.getEdges(),
          visibility.subtreeIds,
          visibility.collapsing,
        )
      : getVisibleSet(model.getNodes(), model.getEdges());

    if (changes.deleteEdgeIds.length > 0) {
      const deleteSet = new Set(changes.deleteEdgeIds);
      edges = edges.filter((e) => !deleteSet.has(e.id));
    }
    if (changes.deleteNodeIds.length > 0) {
      const deleteSet = new Set(changes.deleteNodeIds);
      nodes = nodes.filter((n) => !deleteSet.has(n.id));
    }

    const edgeSourceOverrides = changes.edgeUpdates.filter((u) => u.source);
    if (edgeSourceOverrides.length > 0) {
      const sourceMap = new Map(edgeSourceOverrides.map((u) => [u.id, u.source!]));
      edges = edges.map((e) => {
        const newSource = sourceMap.get(e.id);
        return newSource ? { ...e, source: newSource } : e;
      });
    }

    return { nodes, edges };
  }

  /** Merges new nodes/edges and sorts everything by sort order (with pending overrides). */
  private sortByOrder(
    visibleNodes: DiagramNode<OrgChartNodeData>[],
    visibleEdges: DiagramEdge[],
    changes: ModelChanges,
  ): { nodes: DiagramNode<OrgChartNodeData>[]; edges: DiagramEdge[] } {
    const orderOverrides = new Map<string, number>();
    for (const update of changes.nodeUpdates) {
      if (update.data?.sortOrder != null) {
        orderOverrides.set(update.id, update.data.sortOrder);
      }
    }
    for (const node of changes.newNodes) {
      orderOverrides.set(node.id, (node.data as OrgChartNodeData).sortOrder ?? 0);
    }

    const getOrder = (id: string, data: OrgChartNodeData) =>
      orderOverrides.get(id) ?? data.sortOrder ?? 0;

    const nodes = ([...visibleNodes, ...changes.newNodes] as DiagramNode<OrgChartNodeData>[]).sort(
      (a, b) => getOrder(a.id, a.data) - getOrder(b.id, b.data),
    );

    const nodeOrderMap = new Map(nodes.map((n) => [n.id, getOrder(n.id, n.data)]));
    const edges = [...visibleEdges, ...changes.newEdges].sort(
      (a, b) => (nodeOrderMap.get(a.target) ?? 0) - (nodeOrderMap.get(b.target) ?? 0),
    );

    return { nodes, edges };
  }

  /**
   * Compute layout positions with the root node pinned so the chart
   * doesn't jump after a re-layout.
   */
  private async computePositions(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
  ): Promise<{ id: string; position: { x: number; y: number } }[]> {
    const laid = await performLayout(nodes, edges, this._direction());
    const model = this.modelService.getModel();
    const root = findRootNode(model.getNodes(), model.getEdges());

    if (!root) {
      return laid.map((n) => ({ id: n.id, position: n.position }));
    }

    const newRoot = laid.find((n) => n.id === root.id);
    if (!newRoot) return [];

    const dx = root.position.x - newRoot.position.x;
    const dy = root.position.y - newRoot.position.y;

    return laid.map((n) => ({
      id: n.id,
      position: { x: n.position.x + dx, y: n.position.y + dy },
    }));
  }
}
