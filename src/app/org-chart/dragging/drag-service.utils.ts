import type { DropZone } from './zone-detection/index';

export function mergeMaps(...maps: Map<string, Set<DropZone>>[]): Map<string, Set<DropZone>> {
  const result = new Map<string, Set<DropZone>>();
  for (const map of maps) {
    for (const [nodeId, sides] of map) {
      const existing = result.get(nodeId);
      if (existing) {
        for (const side of sides) {
          existing.add(side);
        }
      } else {
        result.set(nodeId, new Set(sides));
      }
    }
  }
  return result;
}
