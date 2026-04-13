import { Injectable } from '@angular/core';
import { type ViewportInsets } from './viewport';

type Side = 'top' | 'right' | 'bottom' | 'left';
type BoundsProvider = () => DOMRect;

/**
 * Tracks the diagram viewport and UI overlays (navbar, sidebar) so that
 * visibility calculations can account for obscured areas.
 *
 * Registered via directives: `ViewportBoundsDirective` and `ViewportOverlayDirective`.
 */
@Injectable()
export class NodeVisibilityConfigService {
  private readonly overlays = new Map<string, BoundsProvider>();
  private viewportBounds?: BoundsProvider;

  registerViewport(boundsProvider: BoundsProvider): void {
    this.viewportBounds = boundsProvider;
  }

  unregisterViewport(): void {
    this.viewportBounds = undefined;
  }

  registerOverlay(key: string, boundsProvider: BoundsProvider): void {
    this.overlays.set(key, boundsProvider);
  }

  unregisterOverlay(key: string): void {
    this.overlays.delete(key);
  }

  /**
   * Computes how far each overlay intrudes into the viewport (in client pixels).
   * Returns per-side insets used by `ensureVisible` and `zoomToFit`.
   */
  getViewportInsets(): ViewportInsets {
    if (!this.viewportBounds) return {};

    const diagramRect = this.viewportBounds();
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };

    for (const getBounds of this.overlays.values()) {
      const overlayRect = getBounds();
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

  /** Determines which viewport side an overlay is closest to (smallest intrusion wins). */
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
