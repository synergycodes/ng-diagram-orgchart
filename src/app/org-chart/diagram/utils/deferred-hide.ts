import { type Signal, effect, signal } from '@angular/core';

/**
 * Creates a signal that mirrors a boolean source but delays the `false` transition.
 *
 * When the source becomes `true`, the returned signal is set to `true` immediately.
 * When the source becomes `false`, the returned signal stays `true` for `delayMs`
 * before switching to `false` — giving CSS exit animations time to complete.
 *
 * Must be called in an injection context (constructor or field initializer).
 */
export function deferredHide(source: Signal<boolean>, delayMs: number): Signal<boolean> {
  const state = signal(source());
  effect((onCleanup) => {
    if (source()) {
      state.set(true);
    } else {
      const timeout = setTimeout(() => state.set(false), delayMs);
      onCleanup(() => clearTimeout(timeout));
    }
  });
  return state.asReadonly();
}
