import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

@Directive({
  selector: '[appViewportBounds]',
})
export class ViewportBoundsDirective {
  constructor() {
    const configService = inject(NodeVisibilityConfigService);
    const el = inject(ElementRef<HTMLElement>).nativeElement;
    configService.registerViewport(() => el.getBoundingClientRect());
    inject(DestroyRef).onDestroy(() => configService.unregisterViewport());
  }
}
