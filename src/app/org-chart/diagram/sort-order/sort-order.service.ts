import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  type Edge as DiagramEdge,
  type Node as DiagramNode,
} from 'ng-diagram';
import { isOrgChartEdge, isOrgChartNode } from '../guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';

@Injectable()
export class SortOrderService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  readonly sortNodes = (a: DiagramNode<OrgChartNodeData>, b: DiagramNode<OrgChartNodeData>) =>
    (a.data.sortOrder ?? 0) - (b.data.sortOrder ?? 0);

  sortEdgesByTargetSortOrder(
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
   * based on their current sort order.
   */
  rewriteSiblingOrder(parentId: string): void {
    const children = this.getSortedChildren(parentId);
    const updates: { id: string; data: OrgChartNodeData }[] = [];

    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      if (child.sortOrder === index) continue;
      const node = this.modelService.getNodeById(child.id);
      if (!node || !isOrgChartNode(node)) continue;
      updates.push({ id: child.id, data: { ...node.data, sortOrder: index } });
    }

    if (updates.length > 0) {
      this.modelService.updateNodes(updates);
    }
  }

  /**
   * Compute the sortOrder for a new node and the sibling shifts needed
   * to make room. Does NOT apply shifts to the model — the caller must
   * apply `siblingUpdates` inside its transaction.
   */
  insertSortOrder(
    parentId: string,
    referenceNodeId: string | null,
    position: 'before' | 'after',
  ): { sortOrder: number; siblingUpdates: { id: string; data: OrgChartNodeData }[] } {
    const siblings = this.getSortedChildren(parentId);

    if (referenceNodeId === null) {
      return { sortOrder: siblings.length, siblingUpdates: [] };
    }

    const refIndex = siblings.findIndex((s) => s.id === referenceNodeId);
    const insertIndex = position === 'before' ? refIndex : refIndex + 1;

    const siblingUpdates: { id: string; data: OrgChartNodeData }[] = [];
    for (let i = insertIndex; i < siblings.length; i++) {
      const node = this.modelService.getNodeById(siblings[i].id);
      if (!node || !isOrgChartNode(node)) continue;
      siblingUpdates.push({ id: siblings[i].id, data: { ...node.data, sortOrder: i + 1 } });
    }

    return { sortOrder: insertIndex, siblingUpdates };
  }

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
   * Assign sortOrder to all org-chart nodes if any are missing.
   * Uses current edge topology to determine sibling groups and assigns
   * sequential integers per group. Runs once at init.
   */
  async initSortOrder(): Promise<void> {
    const model = this.modelService.getModel();
    const nodes = model.getNodes();

    const needsInit = nodes.some(
      (n) => isOrgChartNode(n) && n.data.sortOrder === undefined,
    );
    if (!needsInit) return;

    const edges = model.getEdges();
    const parentIds = new Set<string>();
    const targetIds = new Set<string>();

    for (const edge of edges) {
      parentIds.add(edge.source);
      targetIds.add(edge.target);
    }

    const updates: { id: string; data: OrgChartNodeData }[] = [];

    for (const node of nodes) {
      if (!isOrgChartNode(node)) continue;
      if (!targetIds.has(node.id)) {
        updates.push({ id: node.id, data: { ...node.data, sortOrder: 0 } });
      }
    }

    for (const parentId of parentIds) {
      const children = edges
        .filter((e) => e.source === parentId)
        .map((e) => e.target);

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
}
