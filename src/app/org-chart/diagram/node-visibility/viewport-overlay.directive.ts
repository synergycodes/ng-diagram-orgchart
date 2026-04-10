import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

/** Registers the host element as a UI overlay that obscures part of the viewport. */
@Directive({
  selector: '[appViewportOverlay]',
})
export class ViewportOverlayDirective {
  constructor() {
    const configService = inject(NodeVisibilityConfigService);
    const el = inject(ElementRef<HTMLElement>).nativeElement;
    const key = el.tagName.toLowerCase();
    configService.registerOverlay(key, () => el.getBoundingClientRect());
    inject(DestroyRef).onDestroy(() => configService.unregisterOverlay(key));
  }
}
