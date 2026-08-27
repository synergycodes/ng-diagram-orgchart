import { DestroyRef, inject } from '@angular/core';
import { DiagramFocusService } from './diagram-focus.service';

/**
 * ng-diagram stops a pointer press at its host, and the diagram keyboard service stops
 * the keys that it handles. Listen in the capture phase to receive these events.
 */
export function trackFocusInputModality(): void {
  const diagramFocus = inject(DiagramFocusService);
  const onPointerDown = (event: Event) => diagramFocus.handlePagePointerDown(event.target);
  const onKeyDown = (event: Event) => diagramFocus.handlePageKeyDown(event.target);

  document.addEventListener('pointerdown', onPointerDown, { capture: true });
  document.addEventListener('keydown', onKeyDown, { capture: true });

  inject(DestroyRef).onDestroy(() => {
    document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    document.removeEventListener('keydown', onKeyDown, { capture: true });
  });
}
