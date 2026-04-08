import { ElementRef, Injectable } from '@angular/core';
import { type ViewportInsets } from '../utils/viewport';

type Side = 'top' | 'right' | 'bottom' | 'left';

@Injectable()
export class NodeVisibilityConfigService {
  private readonly overlays = new Map<string, ElementRef<HTMLElement>>();
  private viewportRef?: ElementRef<HTMLElement>;

  registerViewport(elementRef: ElementRef<HTMLElement>): void {
    this.viewportRef = elementRef;
  }

  unregisterViewport(): void {
    this.viewportRef = undefined;
  }

  register(id: string, elementRef: ElementRef<HTMLElement>): void {
    this.overlays.set(id, elementRef);
  }

  unregister(id: string): void {
    this.overlays.delete(id);
  }

  getViewportInsets(): ViewportInsets {
    if (!this.viewportRef) {
      return {};
    }

    const diagramRect = this.viewportRef.nativeElement.getBoundingClientRect();

    const inset = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    for (const elementRef of this.overlays.values()) {
      const overlayRect = elementRef.nativeElement.getBoundingClientRect();
      const side = this.getOverlaySide(overlayRect, diagramRect);

      switch (side) {
        case 'top':
          inset.top = Math.max(inset.top, overlayRect.bottom - diagramRect.top);
          break;
        case 'right':
          inset.right = Math.max(inset.right, diagramRect.right - overlayRect.left);
          break;
        case 'bottom':
          inset.bottom = Math.max(inset.bottom, diagramRect.bottom - overlayRect.top);
          break;
        case 'left':
          inset.left = Math.max(inset.left, overlayRect.right - diagramRect.left);
          break;
      }
    }

    return inset;
  }

  private getOverlaySide(overlayRect: DOMRect, viewportRect: DOMRect): Side | null {
    const intrusions: { side: Side; value: number }[] = [
      { side: 'top' as const, value: overlayRect.bottom - viewportRect.top },
      { side: 'right' as const, value: viewportRect.right - overlayRect.left },
      { side: 'bottom' as const, value: viewportRect.bottom - overlayRect.top },
      { side: 'left' as const, value: overlayRect.right - viewportRect.left },
    ].filter((i) => i.value > 0);

    if (intrusions.length === 0) return null;

    return intrusions.reduce((min, curr) => (curr.value < min.value ? curr : min)).side;
  }
}
