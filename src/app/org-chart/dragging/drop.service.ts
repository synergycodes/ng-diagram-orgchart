import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { isOrgChartNodeData } from '../diagram/guards';
import { LayoutService } from '../diagram/layout/layout.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { getDropStrategy } from './drop-strategy';
import type { HighlightedIndicator } from './interfaces';

@Injectable()
export class DropService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);
  private readonly hierarchyService = inject(HierarchyService);

  async dropNode(draggedNodeId: string, indicator: HighlightedIndicator): Promise<void> {
    const strategy = getDropStrategy(indicator.side);
    const { newParentId, sortOrder, shouldExpand } = strategy.getDropParams({
      targetNodeId: indicator.nodeId,
      modelService: this.modelService,
      hierarchyService: this.hierarchyService,
    });

    if (shouldExpand) {
      await this.layoutService.toggleCollapsed(indicator.nodeId);
    }

    const oldParentId = this.hierarchyService.getParentId(draggedNodeId);

    if (newParentId !== oldParentId) {
      await this.changeNodeParent(draggedNodeId, newParentId, oldParentId, sortOrder);
    } else {
      await this.reorderNode(draggedNodeId, oldParentId, sortOrder);
    }
  }

  private async changeNodeParent(
    draggedNodeId: string,
    newParentId: string | null,
    oldParentId: string | null,
    sortOrder: number,
  ): Promise<void> {
    const incomingEdge =
      this.modelService.getConnectedEdges(draggedNodeId).find((e) => e.target === draggedNodeId) ??
      null;

    await this.diagramService.transaction(async () => {
      this.hierarchyService.changeParent(draggedNodeId, newParentId, oldParentId, incomingEdge);
      this.updateSortOrder(draggedNodeId, sortOrder);
    });

    if (oldParentId) this.layoutService.rewriteSiblingOrder(oldParentId);
    if (newParentId) this.layoutService.rewriteSiblingOrder(newParentId);

    await this.diagramService.transaction(async () => await this.layoutService.runLayout(), {
      waitForMeasurements: true,
    });
  }

  private async reorderNode(
    draggedNodeId: string,
    parentId: string | null,
    sortOrder: number,
  ): Promise<void> {
    await this.diagramService.transaction(async () => {
      this.updateSortOrder(draggedNodeId, sortOrder);
    });

    if (parentId) this.layoutService.rewriteSiblingOrder(parentId);

    await this.diagramService.transaction(async () => await this.layoutService.runLayout(), {
      waitForMeasurements: true,
    });
  }

  private updateSortOrder(nodeId: string, sortOrder: number): void {
    const node = this.modelService.getNodeById(nodeId);

    if (!node || !isOrgChartNodeData(node.data)) {
      return;
    }

    this.modelService.updateNodeData(nodeId, { ...node.data, sortOrder });
  }
}
