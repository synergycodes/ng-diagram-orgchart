import { type NgDiagramViewportService } from 'ng-diagram';
import { animate } from './animate';

/**
 * Animates the viewport position from its current location to the target.
 * Scale is not changed — only position pans.
 *
 * Abort `signal` to let a later pan supersede this one, or two loops write the viewport position
 * on the same frames and fight.
 */
export function animateViewportTo(
  viewportService: NgDiagramViewportService,
  target: { x: number; y: number },
  durationMs?: number,
  signal?: AbortSignal,
): void {
  const viewport = viewportService.viewport();
  const fromX = viewport.x;
  const fromY = viewport.y;

  animate(
    (eased) => {
      viewportService.moveViewport(
        fromX + (target.x - fromX) * eased,
        fromY + (target.y - fromY) * eased,
      );
    },
    durationMs,
    signal,
  );
}
