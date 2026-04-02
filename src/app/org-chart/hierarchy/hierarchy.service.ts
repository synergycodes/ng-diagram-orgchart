import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type Node,
} from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartNodeData,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';
import { generateKeyBetween } from '../diagram/utils/fractional-indexing';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly layoutService = inject(LayoutService);

  getParentId(nodeId: string): string | null {
    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    return incomingEdge?.source ?? null;
  }

  getDescendantIds(nodeId: string): Set<string> {
    const childrenMap = this.buildChildrenMap();
    const descendantIds = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
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

  async updateNodeParent(nodeId: string, newParentId: string | null): Promise<void> {
    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;

    if (newParentId === oldParentId) {
      return;
    }

    await this.diagramService.transaction(async () =>
      this.changeParent(nodeId, newParentId, oldParentId, incomingEdge ?? null),
    );

    await this.diagramService.transaction(async () => await this.layoutService.runLayout(), {
      waitForMeasurements: true,
    });

    this.viewportService.centerOnNode(nodeId);
  }

  async addChild(nodeId: string): Promise<void> {
    const parentNode = this.modelService.getNodeById(nodeId);
    if (parentNode && (parentNode.data as OrgChartNodeData).isCollapsed) {
      this.layoutService.expandNode(nodeId);
    }

    const sortOrder = this.computeSortOrder(nodeId, null, 'after');
    const newNodeId = await this.addNode(nodeId, sortOrder, nodeId);
    if (!newNodeId) return;

    await this.layoutService.runLayout();
    this.selectionService.select([newNodeId]);
    this.viewportService.centerOnNode(newNodeId);
  }

  async addSiblingBefore(nodeId: string): Promise<void> {
    const parentId = this.getParentId(nodeId);
    if (!parentId) return;

    const sortOrder = this.computeSortOrder(parentId, nodeId, 'before');
    const newNodeId = await this.addNode(parentId, sortOrder, nodeId);
    if (!newNodeId) return;

    await this.layoutService.runLayout();
    this.selectionService.select([newNodeId]);
    this.viewportService.centerOnNode(newNodeId);
  }

  async addSiblingAfter(nodeId: string): Promise<void> {
    const parentId = this.getParentId(nodeId);
    if (!parentId) return;

    const sortOrder = this.computeSortOrder(parentId, nodeId, 'after');
    const newNodeId = await this.addNode(parentId, sortOrder, nodeId);
    if (!newNodeId) return;

    await this.layoutService.runLayout();
    this.selectionService.select([newNodeId]);
    this.viewportService.centerOnNode(newNodeId);
  }

  changeParent(
    nodeId: string,
    newParentId: string | null,
    oldParentId: string | null,
    incomingEdge: Edge | null,
  ): void {
    // Compute hasChildren BEFORE mutating edges, since model state
    // is not refreshed mid-transaction and modelService.getConnectedEdges would return stale data.
    const oldParentWillHaveChildren = oldParentId
      ? this.modelService
          .getConnectedEdges(oldParentId)
          .some((e) => e.source === oldParentId && e.target !== nodeId)
      : false;

    if (incomingEdge && newParentId) {
      this.modelService.updateEdge(incomingEdge.id, { source: newParentId });
    } else if (incomingEdge && !newParentId) {
      this.modelService.deleteEdges([incomingEdge.id]);
    } else if (!incomingEdge && newParentId) {
      this.modelService.addEdges([
        {
          id: crypto.randomUUID(),
          source: newParentId,
          sourcePort: 'port-out',
          target: nodeId,
          targetPort: 'port-in',
          type: EdgeTemplateType.OrgChartEdge,
          data: {},
        },
      ]);
    }

    if (oldParentId && !oldParentWillHaveChildren) {
      const oldParent = this.modelService.getNodeById(oldParentId);
      if (oldParent && isOrgChartNodeData(oldParent.data) && oldParent.data.hasChildren) {
        this.modelService.updateNodeData(oldParentId, {
          ...oldParent.data,
          hasChildren: false,
        });
      }
    }

    if (newParentId) {
      const newParent = this.modelService.getNodeById(newParentId);
      if (newParent && isOrgChartNodeData(newParent.data) && !newParent.data.hasChildren) {
        this.modelService.updateNodeData(newParentId, {
          ...newParent.data,
          hasChildren: true,
        });
      }
    }
  }

  private async addNode(
    parentId: string,
    sortOrder: string,
    positionNodeId: string,
  ): Promise<string | null> {
    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode) return null;

    const positionNode = this.modelService.getNodeById(positionNodeId) ?? parentNode;
    const newNodeId = crypto.randomUUID();
    const newNode = this.createVacantNode(newNodeId, positionNode, sortOrder);
    const newEdge = this.createEdge(parentId, newNodeId);

    await this.diagramService.transaction(
      async () => {
        this.modelService.addNodes([newNode]);
        this.modelService.addEdges([newEdge]);

        if (!(parentNode.data as OrgChartNodeData).hasChildren) {
          this.modelService.updateNodeData(parentId, {
            ...(parentNode.data as OrgChartNodeData),
            hasChildren: true,
          });
        }
      },
      { waitForMeasurements: true },
    );

    return newNodeId;
  }

  /**
   * Compute a sortOrder key for inserting before/after a reference node among its siblings.
   * If `referenceNodeId` is null, inserts after the last child of `parentId`.
   */
  private computeSortOrder(
    parentId: string,
    referenceNodeId: string | null,
    position: 'before' | 'after',
  ): string {
    const siblings = this.getSortedChildren(parentId);

    if (referenceNodeId === null) {
      const last = siblings.length > 0 ? siblings[siblings.length - 1].sortOrder : null;
      return generateKeyBetween(last, null);
    }

    const index = siblings.findIndex((s) => s.id === referenceNodeId);

    if (position === 'before') {
      const prev = index > 0 ? siblings[index - 1].sortOrder : null;
      return generateKeyBetween(prev, siblings[index].sortOrder);
    }

    const next = index < siblings.length - 1 ? siblings[index + 1].sortOrder : null;
    return generateKeyBetween(siblings[index].sortOrder, next);
  }

  private getSortedChildren(parentId: string): { id: string; sortOrder: string }[] {
    return this.modelService
      .getConnectedEdges(parentId)
      .filter((e) => e.source === parentId)
      .map((e) => {
        const node = this.modelService.getNodeById(e.target);
        return {
          id: e.target,
          sortOrder: (node?.data as OrgChartNodeData)?.sortOrder ?? '',
        };
      })
      .sort((a, b) => a.sortOrder.localeCompare(b.sortOrder));
  }

  private createVacantNode(
    id: string,
    parentNode: Node,
    sortOrder: string,
  ): Node<OrgChartVacantNodeData> {
    return {
      id,
      type: NodeTemplateType.OrgChartNode,
      position: { x: parentNode.position.x, y: parentNode.position.y },
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

  private createEdge(parentId: string, childId: string): Edge {
    return {
      id: crypto.randomUUID(),
      source: parentId,
      sourcePort: 'port-out',
      target: childId,
      targetPort: 'port-in',
      type: EdgeTemplateType.OrgChartEdge,
      data: {},
    };
  }

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
