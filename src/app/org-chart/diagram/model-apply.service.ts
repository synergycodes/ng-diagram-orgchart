import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { LayoutAnimationService } from './animation/layout-animation.service';
import { LayoutGate } from './layout/layout-gate';
import { LayoutService, type VisibilityHint } from './layout/layout.service';
import { ModelChanges } from './model-changes';

export interface ApplyWithLayoutOptions {
  /** Hint for expand/collapse to determine the future visible set. */
  visibility?: VisibilityHint;
  /** Whether to animate the layout transition. Default: `true`. */
  animate?: boolean;
}

@Injectable()
export class ModelApplyService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly animationService = inject(LayoutAnimationService);

  /**
   * Computes layout positions, then applies changes with optional animation.
   */
  async applyWithLayout(
    changes: ModelChanges = new ModelChanges(),
    options?: ApplyWithLayoutOptions,
  ): Promise<void> {
    const animate = false; // TODO: restore: options?.animate !== false;

    await this.layoutGate.execute(async () => {
      await this.layoutService.computeLayout(changes, options?.visibility);

      if (animate) {
        const result = this.animationService.prepare(changes);
        if (result) {
          await this.apply(result.startChanges);
          await this.animationService.run(result.state);
        }
      }

      await this.apply(changes);
    });
  }

  /**
   * Applies accumulated model changes to the diagram in a single transaction.
   *
   * The transaction callback commits synchronously. We don't await the
   * measurement Promise — instead we wait one frame for Angular to render.
   *
   * Structural ops are guarded: skips adds for existing elements and deletes
   * for already-removed elements (safe when the same changes are applied twice
   * across start and final applies).
   */
  async apply(changes: ModelChanges): Promise<void> {
    this.diagramService.transaction(
      () => {
        if (changes.deleteEdgeIds.length > 0) {
          const toDelete = changes.deleteEdgeIds.filter((id) => this.modelService.getEdgeById(id));
          if (toDelete.length > 0) this.modelService.deleteEdges(toDelete);
        }
        if (changes.newNodes.length > 0) {
          const toAdd = changes.newNodes.filter((n) => !this.modelService.getNodeById(n.id));
          if (toAdd.length > 0) this.modelService.addNodes(toAdd);
        }
        if (changes.newEdges.length > 0) {
          const toAdd = changes.newEdges.filter((e) => !this.modelService.getEdgeById(e.id));
          if (toAdd.length > 0) this.modelService.addEdges(toAdd);
        }
        if (changes.nodeUpdates.length > 0) {
          this.modelService.updateNodes(changes.nodeUpdates);
        }
        if (changes.edgeUpdates.length > 0) {
          this.modelService.updateEdges(changes.edgeUpdates);
        }
      },
      { waitForMeasurements: true },
    );

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}
