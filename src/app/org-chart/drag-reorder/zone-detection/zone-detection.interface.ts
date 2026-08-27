import type { Point, Size } from 'ng-diagram';

/** Possible sides where a node can be dropped relative to a target. */
export const DROP_ZONES = ['left', 'right', 'bottom'] as const;

export type DropZone = (typeof DROP_ZONES)[number];

/** Determines which drop zone the cursor falls into relative to a target node. */
export interface ZoneDetectionStrategy {
  detect(cursor: Point, nodePosition: Point, nodeSize: Size, alignmentPadding: number): DropZone;
}
