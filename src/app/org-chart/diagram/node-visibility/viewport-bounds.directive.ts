import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

@Directive({
  selector: '[appViewportBounds]',
})
export class ViewportBoundsDirective {
  constructor() {
    const configService = inject(NodeVisibilityConfigService);
    configService.registerViewport(inject(ElementRef<HTMLElement>));
    inject(DestroyRef).onDestroy(() => configService.unregisterViewport());
  }
}
