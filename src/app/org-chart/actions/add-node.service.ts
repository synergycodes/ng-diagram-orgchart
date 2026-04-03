import { inject } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type Edge,
  type Node,
} from 'ng-diagram';
import { isOrgChartNode } from '../diagram/guards';
import {
  EdgeTemplateType,
  NodeTemplateType,
  type OrgChartEdgeData,
  type OrgChartVacantNodeData,
} from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { ensureNodeVisible } from '../diagram/utils/viewport';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type AddNodeConfig } from './provide-add-node';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly hierarchyService = inject(HierarchyService);

  constructor(private readonly config?: AddNodeConfig) {}

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    const { parentId, referenceNodeId, position } = this.resolveParams(nodeId, action);
    if (!parentId) return;

    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode || !isOrgChartNode(parentNode)) return;

    const needsExpand = action === 'child' && !!parentNode.data.isCollapsed;

    const { sortOrder, siblingUpdates } = this.sortOrderService.insertSortOrder(
      parentId,
      referenceNodeId,
      position,
    );
    const newNodeId = crypto.randomUUID();
    const newNode = this.createVacantNode(newNodeId, sortOrder);
    const newEdge = this.createEdge(parentId, newNodeId);

    await this.layoutService.addElementsAndLayout(
      [newNode],
      [newEdge],
      () => {
        if (needsExpand) {
          this.layoutService.expandNode(parentId);
        }
        if (!parentNode.data.hasChildren) {
          this.modelService.updateNodeData(parentId, {
            ...parentNode.data,
            hasChildren: true,
          });
        }
      },
      needsExpand ? parentId : undefined,
      siblingUpdates,
    );

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
    referenceNodeId: string | null;
    position: 'before' | 'after';
  } {
    switch (action) {
      case 'child':
        return { parentId: nodeId, referenceNodeId: null, position: 'after' };
      case 'siblingBefore':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          referenceNodeId: nodeId,
          position: 'before',
        };
      case 'siblingAfter':
        return {
          parentId: this.hierarchyService.getParentId(nodeId),
          referenceNodeId: nodeId,
          position: 'after',
        };
    }
  }

  private createVacantNode(id: string, sortOrder: number): Node<OrgChartVacantNodeData> {
    return {
      id,
      type: NodeTemplateType.OrgChartNode,
      position: { x: 0, y: 0 },
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

  private createEdge(parentId: string, childId: string): Edge<OrgChartEdgeData> {
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
