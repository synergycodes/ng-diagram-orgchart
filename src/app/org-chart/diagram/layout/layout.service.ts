import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge as DiagramEdge,
  type Node as DiagramNode,
} from 'ng-diagram';
import { isOrgChartEdge, isOrgChartNode, isOrgChartNodeData } from '../guards';
import { OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { SortOrderService } from '../sort-order/sort-order.service';
import { countAllDescendants } from './expand-collapse';
import { performLayout } from './perform-layout';

export type LayoutDirection = 'DOWN' | 'RIGHT';

/**
 * - `uninitialized` — before first layout; hides everything.
 * - `idle`          — ready for input.
 * - `layouting`     — layout running; canvas stays visible; buttons disabled.
 * - `rebuilding`    — direction change; canvas hidden; buttons disabled.
 */
export type LayoutState = 'uninitialized' | 'idle' | 'layouting' | 'rebuilding';

/**
 * Manages org-chart layout, direction, and expand/collapse behaviour.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a tree
 * hierarchy. Hidden nodes (inside collapsed subtrees) are excluded from
 * the layout pass so the chart stays compact.
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
    await this.layoutInTransaction();
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
        await this.layoutInTransaction();
        this.viewportService.zoomToFit();
      } catch (error) {
        console.error('Layout failed during direction change:', error);
      } finally {
        this._state.set('idle');
      }
    });
  }

  async runLayout(): Promise<void> {
    if (!this.isIdle()) return;
    this._state.set('layouting');
    try {
      await this.layoutInTransaction();
    } catch (error) {
      console.error('Layout failed:', error);
    } finally {
      this._state.set('idle');
    }
  }

  /**
   * Pre-compute layout with new elements included, then add everything
   * and apply positions in a single transaction — no flicker.
   *
   * @param siblingUpdates Sort-order shifts computed by `insertSortOrder`.
   *   NOT yet applied to the model — they're applied in-memory for layout
   *   computation and committed inside the transaction.
   */
  async addElementsAndLayout(
    newNodes: DiagramNode<OrgChartNodeData>[],
    newEdges: DiagramEdge<OrgChartEdgeData>[],
    mutationFn?: () => void,
    expandNodeId?: string,
    siblingUpdates: { id: string; data: OrgChartNodeData }[] = [],
  ): Promise<void> {
    if (!this.isIdle()) return;
    this._state.set('layouting');

    try {
      let visibleNodes: DiagramNode<OrgChartNodeData>[];
      let visibleEdges: DiagramEdge<OrgChartEdgeData>[];

      if (expandNodeId) {
        const subtreeIds = this.computeSubtreeIds(expandNodeId);
        ({ nodes: visibleNodes, edges: visibleEdges } =
          this.getFutureVisibleSet(subtreeIds, false));
      } else {
        ({ nodes: visibleNodes, edges: visibleEdges } = this.getVisibleSet());
      }

      // Build a sort-order override map from pending sibling shifts + new nodes
      const orderOverrides = new Map<string, number>();
      for (const update of siblingUpdates) {
        orderOverrides.set(update.id, update.data.sortOrder ?? 0);
      }
      for (const node of newNodes) {
        orderOverrides.set(node.id, (node.data as OrgChartNodeData).sortOrder ?? 0);
      }

      // Sort nodes using overrides for shifted siblings, model values for the rest
      const allNodes = (
        [...visibleNodes, ...newNodes] as DiagramNode<OrgChartNodeData>[]
      ).sort((a, b) => {
        const aOrder = orderOverrides.get(a.id) ?? (a.data.sortOrder ?? 0);
        const bOrder = orderOverrides.get(b.id) ?? (b.data.sortOrder ?? 0);
        return aOrder - bOrder;
      });

      const nodeOrderMap = new Map(
        allNodes.map((n) => [n.id, orderOverrides.get(n.id) ?? (n.data.sortOrder ?? 0)]),
      );
      const allEdges = [...visibleEdges, ...newEdges].sort(
        (a, b) => (nodeOrderMap.get(a.target) ?? 0) - (nodeOrderMap.get(b.target) ?? 0),
      );

      const positions = await this.computePositions(allNodes, allEdges);

      await this.diagramService.transaction(
        () => {
          mutationFn?.();
          if (siblingUpdates.length > 0) {
            this.modelService.updateNodes(siblingUpdates);
          }
          this.modelService.addNodes(newNodes);
          this.modelService.addEdges(newEdges);
          this.modelService.updateNodes(positions);
        },
        { waitForMeasurements: true },
      );
    } catch (error) {
      console.error('Layout failed during add:', error);
    } finally {
      this._state.set('idle');
    }
  }

  /**
   * Toggle the collapsed state of a node. Positions are pre-computed
   * for the future visible set so the visibility change and layout
   * are applied in a single transaction (no flash).
   */
  async toggleCollapsed(nodeId: string): Promise<void> {
    if (!this.isIdle()) return;

    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNode(node)) return;

    const newCollapsed = !node.data.isCollapsed;
    const subtreeIds = this.computeSubtreeIds(nodeId);
    const { nodes, edges } = this.getFutureVisibleSet(subtreeIds, newCollapsed);

    this._state.set('layouting');
    const positions = await this.computePositions(nodes, edges);

    try {
      await this.diagramService.transaction(
        async () => {
          this.modelService.updateNodeData(nodeId, {
            ...node.data,
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
    } catch (error) {
      console.error('Layout failed during toggle:', error);
    } finally {
      this._state.set('idle');
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
    edges: DiagramEdge[],
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
    const nodes = model
      .getNodes()
      .filter(
        (node): node is DiagramNode<OrgChartNodeData> =>
          isOrgChartNode(node) && !node.data.isHidden,
      )
      .sort(this.sortOrderService.sortNodes);
    const edges = model
      .getEdges()
      .filter(
        (edge): edge is DiagramEdge<OrgChartEdgeData> =>
          isOrgChartEdge(edge) && !edge.data.isHidden,
      );
    return { nodes, edges: this.sortOrderService.sortEdgesByTargetSortOrder(edges) };
  }

  private getFutureVisibleSet(subtreeIds: Set<string>, collapsing: boolean) {
    const model = this.modelService.getModel();
    const willBeVisible = (id: string, isHidden: boolean) =>
      collapsing ? !isHidden && !subtreeIds.has(id) : !isHidden || subtreeIds.has(id);

    return {
      nodes: model
        .getNodes()
        .filter(
          (n): n is DiagramNode<OrgChartNodeData> =>
            isOrgChartNode(n) && willBeVisible(n.id, !!n.data.isHidden),
        )
        .sort(this.sortOrderService.sortNodes),
      edges: this.sortOrderService.sortEdgesByTargetSortOrder(
        model
          .getEdges()
          .filter(
            (edge): edge is DiagramEdge<OrgChartEdgeData> =>
              isOrgChartEdge(edge) && willBeVisible(edge.target, !!edge.data.isHidden),
          ),
      ),
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

        const childData = this.modelService.getNodeById(edge.target)?.data;
        if (isOrgChartNodeData(childData) && !childData?.isCollapsed) stack.push(edge.target);
      }
    }

    return ids;
  }

  /**
   * Expand a collapsed node by unhiding its subtree.
   * Only performs visibility mutations — does NOT wrap a transaction
   * or trigger layout. Caller is responsible for both.
   */
  expandNode(nodeId: string): void {
    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNode(node)) return;

    const subtreeIds = this.computeSubtreeIds(nodeId);

    this.modelService.updateNodeData(nodeId, {
      ...node.data,
      isCollapsed: false,
      collapsedChildrenCount: undefined,
    });

    this.setSubtreeVisibility(subtreeIds, false);
  }

  private setSubtreeVisibility(subtreeIds: Set<string>, hidden: boolean): void {
    const nodeUpdates = [...subtreeIds].reduce<{ id: string; data: OrgChartNodeData }[]>(
      (acc, id) => {
        const node = this.modelService.getNodeById(id);
        if (node && isOrgChartNode(node)) {
          acc.push({ id, data: { ...node.data, isHidden: hidden } });
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
      .map((e) => ({ id: e.id, data: { type: 'orgChart' as const, isHidden: hidden } }));
    this.modelService.updateEdges(edgeUpdates);
  }
}
