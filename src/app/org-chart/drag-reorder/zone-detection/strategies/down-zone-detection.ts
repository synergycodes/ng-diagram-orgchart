import { ALIGNMENT_PADDING, type ZoneDetectionStrategy } from '../zone-detection.interface';

/** Zone detection for vertical (DOWN) layout: bottom = child, left/right = sibling. */
export const downZoneDetection: ZoneDetectionStrategy = {
  detect(cursor, nodePosition, nodeSize) {
    const nodeCenterX = nodePosition.x + nodeSize.width / 2;
    const nodeCenterY = nodePosition.y + nodeSize.height / 2;

    const isBelowCenter = cursor.y > nodeCenterY;
    const isHorizontallyAligned =
      cursor.x >= nodePosition.x - ALIGNMENT_PADDING &&
      cursor.x <= nodePosition.x + nodeSize.width + ALIGNMENT_PADDING;

    if (isBelowCenter && isHorizontallyAligned) {
      return 'bottom';
    }

    return cursor.x < nodeCenterX ? 'left' : 'right';
  },
};
