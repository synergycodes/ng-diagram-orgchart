import { ALIGNMENT_PADDING, type ZoneDetectionStrategy } from '../zone-detection.interface';

export const rightZoneDetection: ZoneDetectionStrategy = {
  detect(cursor, nodePosition, nodeSize) {
    const nodeCenterX = nodePosition.x + nodeSize.width / 2;
    const nodeCenterY = nodePosition.y + nodeSize.height / 2;

    const isRightOfCenter = cursor.x > nodeCenterX;
    const isVerticallyAligned =
      cursor.y >= nodePosition.y - ALIGNMENT_PADDING &&
      cursor.y <= nodePosition.y + nodeSize.height + ALIGNMENT_PADDING;

    if (isRightOfCenter && isVerticallyAligned) {
      return 'bottom';
    }

    return cursor.y < nodeCenterY ? 'left' : 'right';
  },
};
