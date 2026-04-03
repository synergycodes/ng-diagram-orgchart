import { type NgDiagramViewportService, type Node, type Viewport } from 'ng-diagram';

const EDGE_PADDING = 40;

function getViewportRect(viewport: Viewport) {
  const { x: panX, y: panY, width = 0, height = 0, scale } = viewport;
  const left = -panX / scale;
  const top = -panY / scale;
  return {
    left,
    top,
    right: (width - panX) / scale,
    bottom: (height - panY) / scale,
    width: width / scale,
    height: height / scale,
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
export function ensureNodeVisible(node: Node, viewportService: NgDiagramViewportService): void {
  const viewport = viewportService.viewport();
  if (!viewport.width || !viewport.height) return;

  const viewportRect = getViewportRect(viewport);
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
