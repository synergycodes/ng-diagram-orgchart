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

  private readonly _direction = signal<LayoutDirection>('DOWN');
  readonly direction = this._direction.asReadonly();
  readonly isHorizontal = computed(() => this._direction() === 'RIGHT');

  private readonly _state = signal<LayoutState>('uninitialized');
  readonly state = this._state.asReadonly();
  readonly isInitialized = computed(() => this._state() !== 'uninitialized');
  readonly isIdle = computed(() => this._state() === 'idle');
  readonly isRebuilding = computed(() => this._state() === 'rebuilding');

  async init(): Promise<void> {
    await this.initSortOrder();
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
      .sort(this.sortNodes);
    const edges = model
      .getEdges()
      .filter(
        (edge): edge is DiagramEdge<OrgChartEdgeData> =>
          isOrgChartEdge(edge) && !edge.data.isHidden,
      );
    return { nodes, edges: this.sortEdgesByTargetSortOrder(edges) };
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
        .sort(this.sortNodes),
      edges: this.sortEdgesByTargetSortOrder(
        model
          .getEdges()
          .filter(
            (edge): edge is DiagramEdge<OrgChartEdgeData> =>
              isOrgChartEdge(edge) && willBeVisible(edge.target, !!edge.data.isHidden),
          ),
      ),
    };
  }

  private sortNodes = (a: DiagramNode<OrgChartNodeData>, b: DiagramNode<OrgChartNodeData>) =>
    (a.data.sortOrder ?? 0) - (b.data.sortOrder ?? 0);

  private sortEdgesByTargetSortOrder(
    edges: DiagramEdge<OrgChartEdgeData>[],
  ): DiagramEdge<OrgChartEdgeData>[] {
    return [...edges].sort((a, b) => {
      const aNode = this.modelService.getNodeById(a.target);
      const bNode = this.modelService.getNodeById(b.target);
      const aOrder = isOrgChartNode(aNode) ? (aNode.data.sortOrder ?? 0) : 0;
      const bOrder = isOrgChartNode(bNode) ? (bNode.data.sortOrder ?? 0) : 0;
      return aOrder - bOrder;
    });
  }

  /**
   * Rewrite sortOrder for all children of a parent as 0, 1, 2, ...
   * based on their current sort order. Skips nodes already at the correct index.
   */
  rewriteSiblingOrder(parentId: string): void {
    const children = this.modelService
      .getConnectedEdges(parentId)
      .filter((e) => e.source === parentId)
      .map((e) => {
        const node = this.modelService.getNodeById(e.target);
        return {
          id: e.target,
          currentOrder: isOrgChartNode(node) ? (node.data.sortOrder ?? 0) : 0,
        };
      })
      .sort((a, b) => a.currentOrder - b.currentOrder);

    const updates: { id: string; data: OrgChartNodeData }[] = [];

    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      const node = this.modelService.getNodeById(child.id);
      if (!node || !isOrgChartNode(node) || node.data.sortOrder === index) continue;
      updates.push({ id: child.id, data: { ...node.data, sortOrder: index } });
    }

    if (updates.length > 0) {
      this.modelService.updateNodes(updates);
    }
  }

  /**
   * Assign `sortOrder` to all org-chart nodes if any are missing.
   * Uses current edge topology to determine sibling groups and assigns
   * sequential integers per group. Runs once at init.
   */
  private async initSortOrder(): Promise<void> {
    const model = this.modelService.getModel();
    const nodes = model.getNodes();

    const needsInit = nodes.some((n) => isOrgChartNode(n) && n.data.sortOrder === undefined);
    if (!needsInit) return;

    const edges = model.getEdges();
    const parentIds = new Set<string>();
    const targetIds = new Set<string>();

    for (const edge of edges) {
      parentIds.add(edge.source);
      targetIds.add(edge.target);
    }

    const updates: { id: string; data: OrgChartNodeData }[] = [];

    // Assign sortOrder 0 to root nodes
    for (const node of nodes) {
      if (!isOrgChartNode(node)) continue;
      if (!targetIds.has(node.id)) {
        updates.push({ id: node.id, data: { ...node.data, sortOrder: 0 } });
      }
    }

    // Number children of each parent as 0, 1, 2, ...
    for (const parentId of parentIds) {
      const children = edges.filter((e) => e.source === parentId).map((e) => e.target);

      for (let i = 0; i < children.length; i++) {
        const node = this.modelService.getNodeById(children[i]);
        if (!node || !isOrgChartNode(node)) continue;
        updates.push({ id: children[i], data: { ...node.data, sortOrder: i } });
      }
    }

    await this.diagramService.transaction(async () => {
      this.modelService.updateNodes(updates);
    });
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
