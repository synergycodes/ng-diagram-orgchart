/**
 * Runs a `requestAnimationFrame` loop with easeOutCubic easing.
 *
 * @param onFrame - Called each frame with eased progress (0 → 1).
 * @param durationMs - Animation duration in milliseconds. Default: `300`.
 * @param signal - Abort to stop the loop. The promise then resolves without a further frame.
 * @returns Promise that resolves when the animation completes or is aborted.
 */
export function animate(
  onFrame: (eased: number) => void,
  durationMs = 300,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const startTime = performance.now();

    const frame = (now: number): void => {
      if (signal?.aborted) {
        resolve();
        return;
      }

      try {
        const t = Math.min((now - startTime) / durationMs, 1);
        onFrame(easeOutCubic(t));

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      } catch (e) {
        console.error('[animate] frame error:', e);
        resolve();
      }
    };

    requestAnimationFrame(frame);
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
