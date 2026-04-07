import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { LayoutGate } from './layout/layout-gate';
import { LayoutService, type VisibilityHint } from './layout/layout.service';
import { ModelChanges } from './model-changes';

@Injectable()
export class ModelApplyService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);

  /**
   * Computes layout positions, then applies all accumulated changes in a single transaction.
   * Wraps the full pipeline: gate → compute layout → apply.
   *
   * @param changes - Accumulated model changes; layout positions are appended before applying.
   * @param visibility - Optional hint for expand/collapse to determine the future visible set.
   */
  async applyWithLayout(
    changes: ModelChanges = new ModelChanges(),
    visibility?: VisibilityHint,
  ): Promise<void> {
    await this.layoutGate.execute(async () => {
      await this.layoutService.computeLayout(changes, visibility);
      await this.apply(changes);
    });
  }

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
