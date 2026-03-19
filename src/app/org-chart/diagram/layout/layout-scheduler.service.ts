import { DestroyRef, inject, Injectable } from '@angular/core';
import { NgDiagramService } from 'ng-diagram';
import { LayoutService } from './layout.service';

const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Serializes layout transactions so that concurrent direction changes
 * collapse into at most two runs (one in-flight + one pending).
 * Caps automatic retries after repeated failures to avoid infinite loops.
 */
@Injectable()
export class LayoutSchedulerService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly layoutService = inject(LayoutService);
  private readonly destroyRef = inject(DestroyRef);

  private isLayoutPending = false;
  private isLayoutRunning = false;
  private isDestroyed = false;
  private consecutiveErrors = 0;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
    });
  }

  scheduleLayout(): void {
    this.isLayoutPending = true;
  }

  runPendingLayout(): void {
    if (this.isLayoutRunning || !this.isLayoutPending) return;

    this.isLayoutRunning = true;
    this.isLayoutPending = false;

    this.diagramService
      .transaction(
        async () => {
          await this.layoutService.applyLayout();
        },
        { waitForMeasurements: true },
      )
      .then(() => {
        this.consecutiveErrors = 0;
      })
      .catch((err) => {
        this.consecutiveErrors++;
        console.error(err);
      })
      .finally(() => {
        this.isLayoutRunning = false;
        if (
          !this.isDestroyed &&
          this.isLayoutPending &&
          this.consecutiveErrors < MAX_CONSECUTIVE_ERRORS
        ) {
          this.runPendingLayout();
        }
      });
  }
}
