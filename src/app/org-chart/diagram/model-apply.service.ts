import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { ModelChanges } from './model-changes';

@Injectable()
export class ModelApplyService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  /** Applies accumulated model changes to the diagram in a single transaction. */
  async apply(changes: ModelChanges): Promise<void> {
    await this.diagramService.transaction(
      () => {
        if (changes.deleteEdgeIds.length > 0) {
          this.modelService.deleteEdges(changes.deleteEdgeIds);
        }
        if (changes.nodeUpdates.length > 0) {
          this.modelService.updateNodes(changes.nodeUpdates);
        }
        for (const update of changes.edgeUpdates) {
          if (update.source) this.modelService.updateEdge(update.id, { source: update.source });
          if (update.data) this.modelService.updateEdges([{ id: update.id, data: update.data }]);
        }
        if (changes.newNodes.length > 0) {
          this.modelService.addNodes(changes.newNodes);
        }
        if (changes.newEdges.length > 0) {
          this.modelService.addEdges(changes.newEdges);
        }
      },
      { waitForMeasurements: true },
    );
  }
}
