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
import { ensureNodeVisible } from '../diagram/utils/viewport';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { type AddNodeConfig } from './provide-add-node';

export type AddNodeAction = 'child' | 'siblingBefore' | 'siblingAfter';

export class AddNodeService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly hierarchyService = inject(HierarchyService);

  constructor(private readonly config?: AddNodeConfig) {}

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    const { parentId, referenceNodeId, position } = this.resolveParams(nodeId, action);
    if (!parentId) return;

    const parentNode = this.modelService.getNodeById(parentId);
    if (!parentNode || !isOrgChartNode(parentNode)) return;

    const needsExpand = action === 'child' && !!parentNode.data.isCollapsed;

    // Normalize existing siblings to integers BEFORE computing fractional sort order
    this.layoutService.rewriteSiblingOrder(parentId);

    const sortOrder = this.computeSortOrder(parentId, referenceNodeId, position);
    const newNodeId = crypto.randomUUID();
    const newNode = this.createVacantNode(newNodeId, sortOrder);
    const newEdge = this.createEdge(parentId, newNodeId);

    // Pre-compute layout with new node included, apply everything in one render frame
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
    );

    // Normalize fractional sortOrder (e.g. 1.5 → 2) now that the node is in the model
    this.layoutService.rewriteSiblingOrder(parentId);

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
