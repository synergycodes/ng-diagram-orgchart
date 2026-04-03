import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge as DiagramEdge,
  type Node as DiagramNode,
} from 'ng-diagram';
import { type ModelMutations, type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { SortOrderService } from '../sort-order/sort-order.service';
import { findRootNode, getFutureVisibleSet, getVisibleSet } from '../utils/visible-set';
import { performLayout } from './perform-layout';

export type LayoutDirection = 'DOWN' | 'RIGHT';

/**
 * - `uninitialized` — before first layout; hides everything.
 * - `idle`          — ready for input.
 * - `layouting`     — layout running; canvas stays visible; buttons disabled.
 * - `rebuilding`    — direction change; canvas hidden; buttons disabled.
 */
export type LayoutState = 'uninitialized' | 'idle' | 'layouting' | 'rebuilding';

export interface VisibilityHint {
  subtreeIds: Set<string>;
  collapsing: boolean;
}

/**
 * Manages org-chart layout, direction, and position computation.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a tree
 * hierarchy. Receives pre-computed model mutations from other services
 * and applies everything in a single transaction.
 */
@Injectable()
export class LayoutService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly sortOrderService = inject(SortOrderService);

  private readonly _direction = signal<LayoutDirection>('DOWN');
  readonly direction = this._direction.asReadonly();
  readonly isHorizontal = computed(() => this._direction() === 'RIGHT');

  private readonly _state = signal<LayoutState>('uninitialized');
  readonly state = this._state.asReadonly();
  readonly isInitialized = computed(() => this._state() !== 'uninitialized');
  readonly isIdle = computed(() => this._state() === 'idle');
  readonly isRebuilding = computed(() => this._state() === 'rebuilding');

  async init(): Promise<void> {
    await this.sortOrderService.initSortOrder();
    await this.applyWithLayoutCore({});
    this._state.set('idle');
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
    this._state.set('rebuilding');
    this._direction.set(value);
    requestAnimationFrame(async () => {
      try {
        await this.applyWithLayoutCore({});
        this.viewportService.zoomToFit();
      } catch (error) {
        console.error('Layout failed during direction change:', error);
      } finally {
        this._state.set('idle');
      }
    });
  }

  async runLayout(): Promise<void> {
    await this.applyWithLayout({});
  }

  /**
   * Apply pre-computed model mutations and re-layout in a single transaction.
   *
   * Manages state: checks isIdle, sets 'layouting', resets to 'idle'.
   * External services (AddNodeService, ExpandCollapseService) call this
   * after computing their mutations as data.
   */
  async applyWithLayout(
    mutations: ModelMutations,
    visibility?: VisibilityHint,
  ): Promise<void> {
    if (!this.isIdle()) return;
    this._state.set('layouting');
    try {
      await this.applyWithLayoutCore(mutations, visibility);
    } catch (error) {
      console.error('Layout failed:', error);
    } finally {
      this._state.set('idle');
    }
  }

  /**
   * Core layout logic without state management.
   *
   * 1. Merges new nodes/edges into the visible set
   * 2. Sorts by sort order (with overrides from pending mutations)
   * 3. Computes ELK positions with root pinning
   * 4. Applies all mutations + positions in a single transaction
   */
  private async applyWithLayoutCore(
    mutations: ModelMutations,
    visibility?: VisibilityHint,
  ): Promise<void> {
    const {
      newNodes = [],
      newEdges = [],
      nodeDataUpdates = [],
      edgeDataUpdates = [],
    } = mutations;

    // Resolve visible set
    const model = this.modelService.getModel();
    const { nodes: visibleNodes, edges: visibleEdges } = visibility
      ? getFutureVisibleSet(model.getNodes(), model.getEdges(), visibility.subtreeIds, visibility.collapsing)
      : getVisibleSet(model.getNodes(), model.getEdges());

    // Build sort-order override map from pending data updates + new nodes
    const orderOverrides = new Map<string, number>();
    for (const update of nodeDataUpdates) {
      if (update.data.sortOrder != null) {
        orderOverrides.set(update.id, update.data.sortOrder);
      }
    }
    for (const node of newNodes) {
      orderOverrides.set(node.id, (node.data as OrgChartNodeData).sortOrder ?? 0);
    }

    // Merge and sort nodes
    const allNodes = (
      [...visibleNodes, ...newNodes] as DiagramNode<OrgChartNodeData>[]
    ).sort((a, b) => {
      const aOrder = orderOverrides.get(a.id) ?? (a.data.sortOrder ?? 0);
      const bOrder = orderOverrides.get(b.id) ?? (b.data.sortOrder ?? 0);
      return aOrder - bOrder;
    });

    // Merge and sort edges by target node sort order
    const nodeOrderMap = new Map(
      allNodes.map((n) => [n.id, orderOverrides.get(n.id) ?? (n.data.sortOrder ?? 0)]),
    );
    const allEdges = [...visibleEdges, ...newEdges].sort(
      (a, b) => (nodeOrderMap.get(a.target) ?? 0) - (nodeOrderMap.get(b.target) ?? 0),
    );

    const positions = await this.computePositions(allNodes, allEdges);

    await this.diagramService.transaction(
      () => {
        if (nodeDataUpdates.length > 0) {
          this.modelService.updateNodes(nodeDataUpdates);
        }
        if (edgeDataUpdates.length > 0) {
          this.modelService.updateEdges(edgeDataUpdates);
        }
        if (newNodes.length > 0) {
          this.modelService.addNodes(newNodes);
        }
        if (newEdges.length > 0) {
          this.modelService.addEdges(newEdges);
        }
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
