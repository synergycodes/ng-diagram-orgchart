import type { Point, Rect, Size } from 'ng-diagram';

export function rectFromNode(position: Point, size: Size): Rect {
  return { x: position.x, y: position.y, width: size.width, height: size.height };
}

export function edgeToEdgeDistance(a: Rect, b: Rect): number {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height)));
  return Math.sqrt(dx * dx + dy * dy);
}
