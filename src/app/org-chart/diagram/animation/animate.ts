const DURATION_MS = 300;

/**
 * Runs a `requestAnimationFrame` loop with easeOutCubic easing.
 *
 * @param onFrame - Called each frame with eased progress (0 → 1).
 * @returns Promise that resolves when the animation completes.
 */
export function animate(onFrame: (eased: number) => void): Promise<void> {
  return new Promise<void>((resolve) => {
    const startTime = performance.now();

    const frame = (now: number): void => {
      try {
        const t = Math.min((now - startTime) / DURATION_MS, 1);
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
