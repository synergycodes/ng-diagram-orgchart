import type { LayoutDirection } from '../../diagram/layout/layout.service';
import { downZoneDetection } from './strategies/down-zone-detection';
import { rightZoneDetection } from './strategies/right-zone-detection';
import type { ZoneDetectionStrategy } from './zone-detection.interface';

export function getZoneDetectionStrategy(direction: LayoutDirection): ZoneDetectionStrategy {
  return direction === 'DOWN' ? downZoneDetection : rightZoneDetection;
}
