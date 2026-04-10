import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import { EdgeTemplateType } from '../diagram/interfaces';
import { ModelChanges } from '../diagram/model-changes';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
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
      const parentId = stack.pop();
      if (parentId === undefined) break;
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

  updateNodeParent(
    nodeId: string,
    newParentId: string | null,
    placement?: { referenceId: string; position: 'before' | 'after' },
    modelChanges: ModelChanges = new ModelChanges(),
  ): ModelChanges {
    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;

    if (oldParentId === newParentId) {
      return modelChanges;
    }

    this.updateParentEdge(modelChanges, nodeId, newParentId, incomingEdge);
    this.updateHasChildrenFlags(modelChanges, nodeId, oldParentId, newParentId);

    if (oldParentId) {
      this.sortOrderService.reorderChildren(oldParentId, [], modelChanges, new Set([nodeId]));
    }

    if (newParentId) {
      this.sortOrderService.reorderChildren(
        newParentId,
        [
          {
            nodeId,
            referenceId: placement?.referenceId ?? null,
            position: placement?.position ?? 'after',
          },
        ],
        modelChanges,
      );
    }

    return modelChanges;
  }

  private updateParentEdge(
    changes: ModelChanges,
    nodeId: string,
    newParentId: string | null,
    incomingEdge: { id: string } | undefined,
  ): void {
    if (incomingEdge && newParentId) {
      changes.addEdgeUpdates({ id: incomingEdge.id, source: newParentId });
    } else if (incomingEdge && !newParentId) {
      changes.addDeleteEdgeIds(incomingEdge.id);
    } else if (!incomingEdge && newParentId) {
      changes.addNewEdges({
        id: crypto.randomUUID(),
        source: newParentId,
        sourcePort: 'port-out',
        target: nodeId,
        targetPort: 'port-in',
        type: EdgeTemplateType.OrgChartEdge,
        data: { type: 'orgChart' },
      });
    }
  }

  private updateHasChildrenFlags(
    changes: ModelChanges,
    nodeId: string,
    oldParentId: string | null,
    newParentId: string | null,
  ): void {
    if (oldParentId) {
      const oldParentWillHaveChildren = this.modelService
        .getConnectedEdges(oldParentId)
        .some((e) => e.source === oldParentId && e.target !== nodeId);

      const oldParent = this.modelService.getNodeById(oldParentId);
      if (
        oldParent &&
        isOrgChartNodeData(oldParent.data) &&
        oldParent.data.hasChildren &&
        !oldParentWillHaveChildren
      ) {
        changes.addNodeUpdates({
          id: oldParentId,
          data: { ...oldParent.data, hasChildren: false },
        });
      }
    }

    if (newParentId) {
      const newParent = this.modelService.getNodeById(newParentId);
      if (newParent && isOrgChartNodeData(newParent.data) && !newParent.data.hasChildren) {
        changes.addNodeUpdates({ id: newParentId, data: { ...newParent.data, hasChildren: true } });
      }
    }
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
