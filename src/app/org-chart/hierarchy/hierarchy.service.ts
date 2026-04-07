import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import { EdgeTemplateType } from '../diagram/interfaces';
import { ModelChanges } from '../diagram/model-changes';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);

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

  /** Computes edge create/update/delete based on the old and new parent relationship. */
  computeEdgeMutations(
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

  /** Updates hasChildren flags on old and new parents. */
  computeParentFlagUpdates(
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
