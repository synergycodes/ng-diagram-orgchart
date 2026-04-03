import { inject } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type Node,
} from 'ng-diagram';
import { isOrgChartNode } from '../diagram/guards';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';
import { ensureNodeVisible } from '../diagram/utils/viewport';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type AddNodeConfig } from './provide-add-node';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly hierarchyService = inject(HierarchyService);

  constructor(private readonly config?: AddNodeConfig) {}

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    const { parentId, positionNodeId, referenceNodeId, position } = this.resolveParams(
      nodeId,
      action,
    );
    if (!parentId) return;

    let newNodeId: string | undefined;
    await this.diagramService.transaction(
      () => {
        this.expandIfCollapsed(nodeId, action);
        newNodeId = this.insertNode(parentId, positionNodeId, referenceNodeId, position);
      },
      { waitForMeasurements: true },
    );
    if (!newNodeId) return;

    this.layoutService.rewriteSiblingOrder(parentId);
    await this.layoutService.runLayout();
    this.selectionService.select([newNodeId]);
    this.config?.onNodeAdded?.(newNodeId);

    const addedNode = this.modelService.getNodeById(newNodeId);
    if (addedNode) {
      ensureNodeVisible(addedNode, this.viewportService, this.config?.getViewportInsets?.());
    }
  }

  private resolveParams(
    nodeId: string,
    action: AddNodeAction,
  ): {
    parentId: string | null;
    positionNodeId: string;
    referenceNodeId: string | null;
    position: 'before' | 'after';
  } {
    switch (action) {
      case 'child':
        return {
          parentId: nodeId,
          positionNodeId: nodeId,
          referenceNodeId: null,
          position: 'after',
        };
      case 'siblingBefore':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          positionNodeId: nodeId,
          referenceNodeId: nodeId,
          position: 'before',
        };
      case 'siblingAfter':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          positionNodeId: nodeId,
          referenceNodeId: nodeId,
          position: 'after',
        };
    }
  }

  private expandIfCollapsed(nodeId: string, action: AddNodeAction): void {
    if (action !== 'child') {
      return;
    }
    const node = this.modelService.getNodeById(nodeId);
    if (isOrgChartNode(node) && node.data.isCollapsed) {
      this.layoutService.expandNode(nodeId);
    }
  }

  private insertNode(
    parentId: string,
    positionNodeId: string,
    referenceNodeId: string | null,
    position: 'before' | 'after',
  ): string | undefined {
    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode || !isOrgChartNode(parentNode)) return;

    const positionNode = this.modelService.getNodeById(positionNodeId) ?? parentNode;
    const sortOrder = this.computeSortOrder(parentId, referenceNodeId, position);
    const newNodeId = crypto.randomUUID();
    const newNode = this.createVacantNode(newNodeId, positionNode, sortOrder);
    const newEdge = this.createEdge(parentId, newNodeId);

    this.modelService.addNodes([newNode]);
    this.modelService.addEdges([newEdge]);

    if (!parentNode.data.hasChildren) {
      this.modelService.updateNodeData(parentId, {
        ...parentNode.data,
        hasChildren: true,
      });
    }

    return newNodeId;
  }

  private computeSortOrder(
    parentId: string,
    referenceNodeId: string | null,
    position: 'before' | 'after',
  ): number {
    const siblings = this.getSortedChildren(parentId);

    if (referenceNodeId === null) {
      return siblings.length > 0 ? siblings[siblings.length - 1].sortOrder + 1 : 0;
    }

    const index = siblings.findIndex((s) => s.id === referenceNodeId);

    if (position === 'before') {
      return siblings[index].sortOrder - 0.5;
    }

    return siblings[index].sortOrder + 0.5;
  }

  private getSortedChildren(parentId: string): { id: string; sortOrder: number }[] {
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

  private createVacantNode(
    id: string,
    positionNode: Node,
    sortOrder: number,
  ): Node<OrgChartVacantNodeData> {
    return {
      id,
      type: NodeTemplateType.OrgChartNode,
      position: { x: positionNode.position.x, y: positionNode.position.y },
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
      data: { type: 'orgChart' },
    };
  }
}
