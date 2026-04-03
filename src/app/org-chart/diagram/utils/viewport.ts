import { type NgDiagramViewportService, type Node, type Viewport } from 'ng-diagram';

const EDGE_PADDING = 60;

export interface ViewportInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

function getViewportRect(viewport: Viewport, insets?: ViewportInsets) {
  const { x: panX, y: panY, width = 0, height = 0, scale } = viewport;
  const insetLeft = (insets?.left ?? 0) / scale;
  const insetTop = (insets?.top ?? 0) / scale;
  const insetRight = (insets?.right ?? 0) / scale;
  const insetBottom = (insets?.bottom ?? 0) / scale;
  const left = -panX / scale + insetLeft;
  const top = -panY / scale + insetTop;
  return {
    left,
    top,
    right: (width - panX) / scale - insetRight,
    bottom: (height - panY) / scale - insetBottom,
    width: width / scale - insetLeft - insetRight,
    height: height / scale - insetTop - insetBottom,
  };
}

function getNodeRect(node: Node) {
  const nodeWidth = node.measuredBounds?.width ?? node.size?.width ?? 0;
  const nodeHeight = node.measuredBounds?.height ?? node.size?.height ?? 0;
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + nodeWidth,
    bottom: node.position.y + nodeHeight,
  };
}

export function isNodeInViewport(node: Node, viewport: Viewport): boolean {
  if (!viewport.width || !viewport.height) return true;

  const viewportRect = getViewportRect(viewport);
  const rect = getNodeRect(node);

  return (
    rect.left >= viewportRect.left &&
    rect.right <= viewportRect.right &&
    rect.top >= viewportRect.top &&
    rect.bottom <= viewportRect.bottom
  );
}

/**
 * If the node is fully visible — do nothing.
 * If it's just offscreen (within half the viewport) — nudge the viewport
 * so the node appears at the edge with padding.
 * If it's far offscreen — center on it.
 */
export function ensureNodeVisible(
  node: Node,
  viewportService: NgDiagramViewportService,
  insets?: ViewportInsets,
): void {
  const viewport = viewportService.viewport();
  if (!viewport.width || !viewport.height) return;

  const viewportRect = getViewportRect(viewport, insets);
  const rect = getNodeRect(node);

  if (
    rect.left >= viewportRect.left &&
    rect.right <= viewportRect.right &&
    rect.top >= viewportRect.top &&
    rect.bottom <= viewportRect.bottom
  ) {
    return;
  }

  let flowDx = 0;
  let flowDy = 0;

  if (rect.left < viewportRect.left) flowDx = rect.left - viewportRect.left - EDGE_PADDING;
  else if (rect.right > viewportRect.right) flowDx = rect.right - viewportRect.right + EDGE_PADDING;

  if (rect.top < viewportRect.top) flowDy = rect.top - viewportRect.top - EDGE_PADDING;
  else if (rect.bottom > viewportRect.bottom)
    flowDy = rect.bottom - viewportRect.bottom + EDGE_PADDING;

  if (Math.abs(flowDx) > viewportRect.width / 2 || Math.abs(flowDy) > viewportRect.height / 2) {
    viewportService.centerOnNode(node.id);
    return;
  }

  viewportService.moveViewportBy(-flowDx * viewport.scale, -flowDy * viewport.scale);
}
