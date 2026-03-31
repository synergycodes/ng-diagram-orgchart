import { inject, Injectable } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
} from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import { EdgeTemplateType } from '../diagram/interfaces';
import { LayoutService } from '../diagram/layout/layout.service';

@Injectable()
export class HierarchyService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);
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

    await this.diagramService.transaction(async () => await this.layoutService.applyLayout(), {
      waitForMeasurements: true,
    });

    this.viewportService.centerOnNode(nodeId);
  }

  private changeParent(
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
          sourcePort: 'port-bottom',
          target: nodeId,
          targetPort: 'port-top',
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
