import { computed, Injectable, signal } from '@angular/core';

/**
 * Controls concurrent access to the layout pipeline and broadcasts the current phase.
 *
 * - `uninitialized` — before first layout; diagram hidden.
 * - `idle`          — ready for input; gate is open.
 * - `layouting`     — pipeline running; gate is closed; buttons disabled.
 * - `rebuilding`    — direction change; canvas hidden; gate is closed.
 */
export type LayoutPhase = 'uninitialized' | 'idle' | 'layouting' | 'rebuilding';

@Injectable()
export class LayoutGate {
  private readonly _phase = signal<LayoutPhase>('uninitialized');
  private _locked = false;

  readonly phase = this._phase.asReadonly();
  readonly isInitialized = computed(() => this._phase() !== 'uninitialized');
  readonly isIdle = computed(() => this._phase() === 'idle');
  readonly isRebuilding = computed(() => this._phase() === 'rebuilding');

  /**
   * Sets the gate to `rebuilding` phase (hides canvas to avoid direction-change flash).
   * The next `execute()` call will keep this phase until the action completes.
   */
  setRebuilding(): void {
    this._phase.set('rebuilding');
  }

  /**
   * Executes an action while holding the gate closed.
   * Skips if the gate is already locked.
   *
   * When entering from `idle`, transitions to `layouting` (disables buttons).
   * When entering from `uninitialized` or `rebuilding`, keeps the current phase
   * (UI stays hidden) to avoid flicker. Always transitions to `idle` on completion.
   *
   * @param action - The async pipeline to run (typically compute layout + apply changes).
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
