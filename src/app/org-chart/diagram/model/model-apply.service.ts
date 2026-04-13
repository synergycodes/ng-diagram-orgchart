import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { LayoutAnimationService } from '../animation/layout-animation.service';
import { LayoutGate } from '../layout/layout-gate';
import { LayoutService, type VisibilityHint } from '../layout/layout.service';
import { ModelChanges, type EdgeUpdate, type NodeUpdate } from './model-changes';

export interface ApplyWithLayoutOptions {
  /** Hint for expand/collapse to determine the future visible set. */
  visibility?: VisibilityHint;
  /** Whether to animate the layout transition. Default: `true`. */
  animate?: boolean;
}

/**
 * Orchestrates model mutations: computes layout, optionally animates,
 * and commits changes to the diagram in a single transaction.
 */
@Injectable()
export class ModelApplyService {
  private readonly config = inject(ORG_CHART_CONFIG);
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
    const animate = this.config.animation.layoutEnabled && options?.animate !== false;

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
   * Structural ops are guarded: skips adds for existing elements and deletes
   * for already-removed elements (safe when the same changes are applied twice
   * across start and final applies).
   *
   * Waits one frame after the transaction instead of awaiting the transaction
   * Promise due to a measurementTracker issue in ng-diagram.
   * TODO: await `diagramService.transaction` directly once the issue is fixed.
   */
  async apply(changes: ModelChanges): Promise<void> {
    this.diagramService.transaction(
      () => {
        if (changes.deleteEdgeIds.length > 0) {
          const toDelete = changes.deleteEdgeIds.filter((id) => this.modelService.getEdgeById(id));
          if (toDelete.length > 0) this.modelService.deleteEdges(toDelete);
        }
        if (changes.deleteNodeIds.length > 0) {
          const toDelete = changes.deleteNodeIds.filter((id) => this.modelService.getNodeById(id));
          if (toDelete.length > 0) this.modelService.deleteNodes(toDelete);
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
          this.modelService.updateNodes(this.resolveNodeUpdates(changes.nodeUpdates));
        }
        if (changes.edgeUpdates.length > 0) {
          this.modelService.updateEdges(this.resolveEdgeUpdates(changes.edgeUpdates));
        }
      },
      { waitForMeasurements: true },
    );

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  /**
   * Prepares accumulated partial patches for `updateNodes` / `updateEdges`:
   *   1. Dedupes by `id`, merging multiple patches for the same entity.
   *   2. Resolves each merged patch's `data` against the entity's current
   *      `data`, so ng-diagram receives a full data object.
   *
   * Merge semantics inside a dedupe:
   * - **Inside `data`**: later keys win; `undefined` values are preserved.
   * - **Top-level**: later non-`undefined` values win; `undefined` is
   *   dropped so a later partial patch can't clobber a concrete value
   *   set by an earlier one. (Asymmetric with `data` on purpose — top-level
   *   `undefined` usually just means "this patch doesn't touch that field".)
   */
  private resolveUpdates<
    TData extends object,
    TPatch extends { id: string; data?: Partial<TData> },
  >(updates: readonly TPatch[], getById: (id: string) => { data?: TData } | null): TPatch[] {
    const byId = new Map<string, TPatch>();

    for (const update of updates) {
      const existing = byId.get(update.id);
      byId.set(update.id, existing ? this.mergePatch(existing, update) : { ...update });
    }

    for (const [id, entry] of byId) {
      if (entry.data) {
        const current = getById(id);
        if (current?.data) {
          entry.data = { ...current.data, ...entry.data };
        }
      }
    }

    return [...byId.values()];
  }

  private mergePatch<TPatch extends { id: string; data?: object }>(a: TPatch, b: TPatch): TPatch {
    const merged: Record<string, unknown> = { ...a };
    for (const [key, value] of Object.entries(b)) {
      if (key === 'id') continue;
      if (key === 'data' && value) {
        merged['data'] = { ...((merged['data'] as object) ?? {}), ...(value as object) };
      } else if (value !== undefined) {
        merged[key] = value;
      }
    }
    return merged as TPatch;
  }

  private resolveNodeUpdates(updates: readonly NodeUpdate[]): NodeUpdate[] {
    return this.resolveUpdates(updates, (id) => this.modelService.getNodeById(id));
  }

  private resolveEdgeUpdates(updates: readonly EdgeUpdate[]): EdgeUpdate[] {
    return this.resolveUpdates(updates, (id) => this.modelService.getEdgeById(id));
  }
}
