import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  type Edge,
} from 'ng-diagram';
import { isOrgChartNode, isOrgChartNodeData } from '../diagram/guards';
import {
  EdgeTemplateType,
  type OrgChartEdgeData,
  type OrgChartNodeData,
} from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly sortOrderService = inject(SortOrderService);

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
    if (!this.layoutService.isIdle()) return;

    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;

    if (newParentId === oldParentId) return;

    // 1. Compute edge mutation
    const newEdges: Edge<OrgChartEdgeData>[] = [];
    const deleteEdgeIds: string[] = [];
    const edgeUpdates: { id: string; source: string }[] = [];

    if (incomingEdge && newParentId) {
      edgeUpdates.push({ id: incomingEdge.id, source: newParentId });
    } else if (incomingEdge && !newParentId) {
      deleteEdgeIds.push(incomingEdge.id);
    } else if (!incomingEdge && newParentId) {
      newEdges.push({
        id: crypto.randomUUID(),
        source: newParentId,
        sourcePort: 'port-out',
        target: nodeId,
        targetPort: 'port-in',
        type: EdgeTemplateType.OrgChartEdge,
        data: { type: 'orgChart' },
      });
    }

    // 2. Compute node data updates
    const nodeUpdates: { id: string; data: OrgChartNodeData }[] = [];

    // Old parent: hasChildren update
    if (oldParentId) {
      const oldParentWillHaveChildren = this.modelService
        .getConnectedEdges(oldParentId)
        .some((e) => e.source === oldParentId && e.target !== nodeId);

      const oldParent = this.modelService.getNodeById(oldParentId);
      if (oldParent && isOrgChartNodeData(oldParent.data) && oldParent.data.hasChildren && !oldParentWillHaveChildren) {
        nodeUpdates.push({ id: oldParentId, data: { ...oldParent.data, hasChildren: false } });
      }
    }

    // New parent: hasChildren + sort order (append moved node at end)
    if (newParentId) {
      const newParent = this.modelService.getNodeById(newParentId);
      if (newParent && isOrgChartNodeData(newParent.data) && !newParent.data.hasChildren) {
        nodeUpdates.push({ id: newParentId, data: { ...newParent.data, hasChildren: true } });
      }

      const { updates } = this.sortOrderService.reorderChildren(newParentId, [
        { nodeId, referenceId: null, position: 'after' },
      ]);
      nodeUpdates.push(...updates);
    }

    // 3. Apply with layout
    await this.layoutService.applyWithLayout({
      newEdges,
      edgeUpdates,
      nodeUpdates,
      deleteEdgeIds,
    });

    this.nodeVisibilityService.ensureVisible(nodeId);
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
