import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

@Directive({
  selector: '[appViewportOverlay]',
})
export class ViewportOverlayDirective {
  constructor() {
    const configService = inject(NodeVisibilityConfigService);
    const elementRef = inject(ElementRef<HTMLElement>);
    configService.registerOverlay(elementRef);
    inject(DestroyRef).onDestroy(() => configService.unregisterOverlay(elementRef));
  }
}
