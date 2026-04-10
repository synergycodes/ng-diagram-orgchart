import { type ZoneDetectionStrategy } from '../zone-detection.interface';

/** Zone detection for horizontal (RIGHT) layout: right = child, left/right = sibling (mapped to top/bottom). */
export const rightZoneDetection: ZoneDetectionStrategy = {
  detect(cursor, nodePosition, nodeSize, alignmentPadding) {
    const nodeCenterX = nodePosition.x + nodeSize.width / 2;
    const nodeCenterY = nodePosition.y + nodeSize.height / 2;

    const isRightOfCenter = cursor.x > nodeCenterX;
    const isVerticallyAligned =
      cursor.y >= nodePosition.y - alignmentPadding &&
      cursor.y <= nodePosition.y + nodeSize.height + alignmentPadding;

    if (isRightOfCenter && isVerticallyAligned) {
      return 'bottom';
    }

    return cursor.y < nodeCenterY ? 'left' : 'right';
  },
};
