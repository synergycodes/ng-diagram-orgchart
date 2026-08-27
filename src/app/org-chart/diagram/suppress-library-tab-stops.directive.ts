import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

/**
 * TEMPORARY WORKAROUND — remove once ng-diagram exposes a focus/tabindex opt-out.
 * Tracking: https://github.com/synergycodes/ng-diagram/issues
 *
 * ng-diagram (1.2.3) hardcodes `tabindex="0"` on its host and watermark link with no
 * config opt-out, creating dead Tab stops. Drop both to `-1` so Tab lands on a node.
 * `-1` keeps them programmatically focusable, so click-to-focus and keyboard shortcuts
 * (a `document:keydown` gated on `host.contains(activeElement)`) still work.
 */
@Directive({
  selector: 'ng-diagram[appSuppressLibraryTabStops]',
  standalone: true,
})
export class SuppressLibraryTabStopsDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => {
      this.host.setAttribute('tabindex', '-1');
      this.host.querySelector('ng-diagram-watermark a')?.setAttribute('tabindex', '-1');
    });
  }
}
