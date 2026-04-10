import type { Point, Rect, Size } from 'ng-diagram';

/** Builds a rect from a node's position and size. */
export function rectFromNode(position: Point, size: Size): Rect {
  return { x: position.x, y: position.y, width: size.width, height: size.height };
}

/** Shortest distance between the edges of two rects (0 if overlapping). */
export function edgeToEdgeDistance(a: Rect, b: Rect): number {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height)));
  return Math.sqrt(dx * dx + dy * dy);
}
