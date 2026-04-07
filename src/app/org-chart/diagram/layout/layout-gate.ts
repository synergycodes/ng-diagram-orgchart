import { computed, Injectable, signal } from '@angular/core';

/**
 * Controls concurrent access to the layout pipeline and broadcasts the current phase.
 *
 * - `uninitialized` — before first layout; diagram hidden.
 * - `idle`          — ready for input; gate is open.
 * - `layouting`     — pipeline running; gate is closed; buttons disabled.
 */
export type LayoutPhase = 'uninitialized' | 'idle' | 'layouting';

@Injectable()
export class LayoutGate {
  private readonly _phase = signal<LayoutPhase>('uninitialized');
  private _locked = false;

  readonly isInitialized = computed(() => this._phase() !== 'uninitialized');
  readonly isIdle = computed(() => this._phase() === 'idle');

  /**
   * Executes an action while holding the gate closed.
   * Skips if the gate is already locked.
   *
   * When entering from `idle`, transitions to `layouting` (disables buttons).
   * When entering from `uninitialized`, keeps the current phase (UI stays hidden)
   * to avoid flicker. Always transitions to `idle` on completion.
   */
  async execute(action: () => Promise<void>): Promise<void> {
    if (this._locked) return;
    this._locked = true;

    if (this._phase() === 'idle') {
      this._phase.set('layouting');
    }

    try {
      await action();
    } finally {
      this._locked = false;
      this._phase.set('idle');
    }
  }
}
