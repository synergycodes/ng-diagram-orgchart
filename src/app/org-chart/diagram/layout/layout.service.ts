import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type Node as DiagramNode,
} from 'ng-diagram';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { countAllDescendants } from './expand-collapse';
import { performLayout } from './perform-layout';

export type LayoutDirection = 'DOWN' | 'RIGHT';

/**
 * Manages org-chart layout, direction, and expand/collapse behaviour.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a tree
 * hierarchy. Hidden nodes (inside collapsed subtrees) are excluded from
 * the layout pass so the chart stays compact.
 *
 * All public methods guard on `isReady` — which is `false` before
 * `init()` completes and during any layout run.
 */
@Injectable()
export class LayoutService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);

  private readonly _direction = signal<LayoutDirection>('DOWN');
  readonly direction = this._direction.asReadonly();
  readonly isHorizontal = computed(() => this._direction() === 'RIGHT');

  private readonly _isInitialized = signal(false);
  readonly isInitialized = this._isInitialized.asReadonly();

  private readonly _isReady = signal(false);
  readonly isReady = this._isReady.asReadonly();

  async init(): Promise<void> {
    await this.layoutInTransaction();
    this._isInitialized.set(true);
    this._isReady.set(true);
  }

  /**
   * Layout is deferred to the next animation frame so the browser can
   * paint the recreated port components (via `@if` in the node template)
   * before the layout transaction measures their positions.
   *
   * TODO: remove requestAnimationFrame once ng-diagram fixes port
   * dynamic side update.
   */
  setDirection(value: LayoutDirection): void {
    if (this._direction() === value) return;
    this._direction.set(value);
    requestAnimationFrame(async () => {
      await this.runLayout();
      this.viewportService.zoomToFit();
    });
  }

  async runLayout(): Promise<void> {
    if (!this._isReady()) return;
    this._isReady.set(false);
    try {
      await this.layoutInTransaction();
    } finally {
      this._isReady.set(this._isInitialized());
    }
  }

  /**
   * Toggle the collapsed state of a node. Positions are pre-computed
   * for the future visible set so the visibility change and layout
   * are applied in a single transaction (no flash).
   */
  async toggleCollapsed(nodeId: string): Promise<void> {
    if (!this._isReady()) return;

    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;

    const newCollapsed = !(node.data as OrgChartNodeData).isCollapsed;
    const subtreeIds = this.computeSubtreeIds(nodeId);
    const { nodes, edges } = this.getFutureVisibleSet(subtreeIds, newCollapsed);

    this._isReady.set(false);
    const positions = await this.computePositions(nodes, edges);

    try {
      await this.diagramService.transaction(
        async () => {
          this.modelService.updateNodeData(nodeId, {
            ...(node.data as OrgChartNodeData),
            isCollapsed: newCollapsed,
            collapsedChildrenCount: newCollapsed
              ? countAllDescendants(nodeId, this.modelService)
              : undefined,
          });
          this.setSubtreeVisibility(subtreeIds, newCollapsed);
          this.modelService.updateNodes(positions);
        },
        { waitForMeasurements: true },
      );
    } finally {
      this._isReady.set(this._isInitialized());
    }
  }

  private async layoutInTransaction(): Promise<void> {
    await this.diagramService.transaction(
      async () => {
        const { nodes, edges } = this.getVisibleSet();
        const positions = await this.computePositions(nodes, edges);
        this.modelService.updateNodes(positions);
      },
      { waitForMeasurements: true },
    );
  }

  /**
   * Compute layout positions with the root node pinned so the chart
   * doesn't jump after a re-layout.
   */
  private async computePositions(
    nodes: DiagramNode[],
    edges: Edge[],
  ): Promise<{ id: string; position: { x: number; y: number } }[]> {
    const laid = await performLayout(nodes, edges, this._direction());
    const root = this.findRootNode();

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

  private getVisibleSet() {
    const model = this.modelService.getModel();
    return {
      nodes: model.getNodes().filter((n) => !(n.data as OrgChartNodeData).isHidden),
      edges: model.getEdges().filter((e) => !(e.data as OrgChartEdgeData).isHidden),
    };
  }

  private getFutureVisibleSet(subtreeIds: Set<string>, collapsing: boolean) {
    const model = this.modelService.getModel();
    const willBeVisible = (id: string, isHidden: boolean) =>
      collapsing ? !isHidden && !subtreeIds.has(id) : !isHidden || subtreeIds.has(id);

    return {
      nodes: model
        .getNodes()
        .filter((n) => willBeVisible(n.id, !!(n.data as OrgChartNodeData).isHidden)),
      edges: model
        .getEdges()
        .filter((e) => willBeVisible(e.target, !!(e.data as OrgChartEdgeData).isHidden)),
    };
  }

  private findRootNode() {
    const model = this.modelService.getModel();
    const targetIds = new Set(model.getEdges().map((e) => e.target));
    return model.getNodes().find((n) => !targetIds.has(n.id)) ?? null;
  }

  private computeSubtreeIds(nodeId: string): Set<string> {
    const ids = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        if (edge.source !== parentId) continue;
        ids.add(edge.target);

        const child = this.modelService.getNodeById(edge.target)?.data as OrgChartNodeData;
        if (!child?.isCollapsed) stack.push(edge.target);
      }
    }

    return ids;
  }

  private setSubtreeVisibility(subtreeIds: Set<string>, hidden: boolean): void {
    const nodeUpdates = [...subtreeIds].reduce<{ id: string; data: OrgChartNodeData }[]>(
      (acc, id) => {
        const node = this.modelService.getNodeById(id);
        if (node) {
          acc.push({ id, data: { ...(node.data as OrgChartNodeData), isHidden: hidden } });
        }
        return acc;
      },
      [],
    );
    this.modelService.updateNodes(nodeUpdates);

    const edgeUpdates = this.modelService
      .getModel()
      .getEdges()
      .filter((e) => subtreeIds.has(e.target))
      .map((e) => ({ id: e.id, data: { isHidden: hidden } }));
    this.modelService.updateEdges(edgeUpdates);
  }
}
