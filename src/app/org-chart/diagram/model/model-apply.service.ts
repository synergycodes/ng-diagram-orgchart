import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramService, type Edge, type Node } from 'ng-diagram';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { LayoutAnimationService } from '../animation/layout-animation.service';
import { LayoutGate } from '../layout/layout-gate';
import { LayoutService, type VisibilityHint } from '../layout/layout.service';
import { ModelChanges } from './model-changes';

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
   * Deduplicates updates by ID, merges partial data fields,
   * and resolves against current model state so ng-diagram receives full data.
   */
  private resolveUpdates(
    updates: { id: string; data?: unknown; [key: string]: unknown }[],
    getById: (id: string) => { data?: unknown } | null,
  ) {
    const byId = new Map<string, Record<string, unknown>>();

    for (const update of updates) {
      const existing = byId.get(update.id);
      if (existing) {
        for (const [key, value] of Object.entries(update)) {
          if (key === 'id') continue;
          if (key === 'data' && value) {
            existing['data'] = { ...((existing['data'] as object) ?? {}), ...(value as object) };
          } else if (value !== undefined) {
            existing[key] = value;
          }
        }
      } else {
        byId.set(update.id, { ...update });
      }
    }

    const result: { id: string; [key: string]: unknown }[] = [];
    for (const [id, entry] of byId) {
      if (entry['data']) {
        const current = getById(id);
        if (current?.data) {
          entry['data'] = { ...(current.data as object), ...(entry['data'] as object) };
        }
      }
      result.push(entry as { id: string; [key: string]: unknown });
    }

    return result;
  }

  private resolveNodeUpdates(
    updates: { id: string; data?: unknown }[],
  ): (Pick<Node, 'id'> & Partial<Node>)[] {
    return this.resolveUpdates(updates, (id) => this.modelService.getNodeById(id));
  }

  private resolveEdgeUpdates(
    updates: { id: string; data?: unknown; source?: unknown }[],
  ): (Pick<Edge, 'id'> & Partial<Edge>)[] {
    return this.resolveUpdates(updates, (id) => this.modelService.getEdgeById(id));
  }
}
