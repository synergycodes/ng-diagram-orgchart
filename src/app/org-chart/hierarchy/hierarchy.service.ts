import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import { EdgeTemplateType } from '../diagram/interfaces';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { ModelApplyService } from '../diagram/model-apply.service';
import { ModelChanges } from '../diagram/model-changes';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly modelApplyService = inject(ModelApplyService);
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
    if (!this.layoutGate.isIdle()) return;

    const incomingEdge = this.modelService
      .getConnectedEdges(nodeId)
      .find((e) => e.target === nodeId);
    const oldParentId = incomingEdge?.source ?? null;

    if (newParentId === oldParentId) return;

    const changes = new ModelChanges();
    this.computeEdgeMutations(changes, nodeId, newParentId, incomingEdge);
    this.computeParentUpdates(changes, nodeId, oldParentId, newParentId);

    await this.layoutGate.execute(async () => {
      await this.layoutService.computeLayout(changes);
      await this.modelApplyService.apply(changes);
    });

    this.nodeVisibilityService.ensureVisible(nodeId);
  }

  /** Computes edge create/update/delete based on the old and new parent relationship. */
  private computeEdgeMutations(
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

  /** Updates hasChildren flags on old/new parents and appends sort order for the new parent. */
  private computeParentUpdates(
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

      this.sortOrderService.reorderChildren(
        newParentId,
        [{ nodeId, referenceId: null, position: 'after' }],
        changes,
      );
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
