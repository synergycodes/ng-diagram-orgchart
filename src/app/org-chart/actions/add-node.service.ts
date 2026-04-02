import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type Node,
} from 'ng-diagram';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartNodeData,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';
import { generateKeyBetween } from '../diagram/utils/fractional-indexing';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

@Injectable()
export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly hierarchyService = inject(HierarchyService);

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    const { parentId, positionNodeId, referenceNodeId, position } = this.resolveParams(
      nodeId,
      action,
    );
    if (!parentId) return;

    this.expandIfCollapsed(nodeId, action);

    const newNodeId = await this.insertNode(parentId, positionNodeId, referenceNodeId, position);
    if (!newNodeId) return;

    await this.layoutService.runLayout();
    this.selectionService.select([newNodeId]);
    this.viewportService.centerOnNode(newNodeId);
    this.sidebarService.expandSidebar();
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
    if (node && (node.data as OrgChartNodeData).isCollapsed) {
      this.layoutService.expandNode(nodeId);
    }
  }

  private async insertNode(
    parentId: string,
    positionNodeId: string,
    referenceNodeId: string | null,
    position: 'before' | 'after',
  ): Promise<string | undefined> {
    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode) return;

    const positionNode = this.modelService.getNodeById(positionNodeId) ?? parentNode;
    const sortOrder = this.computeSortOrder(parentId, referenceNodeId, position);
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
    positionNode: Node,
    sortOrder: string,
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
      data: {},
    };
  }
}
