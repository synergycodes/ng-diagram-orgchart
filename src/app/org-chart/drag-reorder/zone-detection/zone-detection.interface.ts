import type { Point, Size } from 'ng-diagram';

/** Possible sides where a node can be dropped relative to a target. */
export type DropZone = 'left' | 'right' | 'bottom';

/** Determines which drop zone the cursor falls into relative to a target node. */
export interface ZoneDetectionStrategy {
  detect(cursor: Point, nodePosition: Point, nodeSize: Size): DropZone;
}

/**
 * Horizontal/vertical padding added to each side of the node bounds when checking
 * alignment for the "child" (bottom/right) drop zone. Makes it easier
 * to hit the child zone without requiring pixel-perfect alignment.
 */
export const ALIGNMENT_PADDING = 40;
