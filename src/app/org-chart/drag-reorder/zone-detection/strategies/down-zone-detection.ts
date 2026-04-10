import { type ZoneDetectionStrategy } from '../zone-detection.interface';

/** Zone detection for vertical (DOWN) layout: bottom = child, left/right = sibling. */
export const downZoneDetection: ZoneDetectionStrategy = {
  detect(cursor, nodePosition, nodeSize, alignmentPadding) {
    const nodeCenterX = nodePosition.x + nodeSize.width / 2;
    const nodeCenterY = nodePosition.y + nodeSize.height / 2;

    const isBelowCenter = cursor.y > nodeCenterY;
    const isHorizontallyAligned =
      cursor.x >= nodePosition.x - alignmentPadding &&
      cursor.x <= nodePosition.x + nodeSize.width + alignmentPadding;

    if (isBelowCenter && isHorizontallyAligned) {
      return 'bottom';
    }

    return cursor.x < nodeCenterX ? 'left' : 'right';
  },
};
