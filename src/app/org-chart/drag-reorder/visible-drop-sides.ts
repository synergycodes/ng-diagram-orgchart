import { DROP_ZONES, type DropZone } from './zone-detection/index';

/**
 * The sides a node offers, once the sides that are invalid for the moved node are removed.
 *
 * Shared so the pointer path and the keyboard path cannot drift: a position one of them draws is
 * a position the other draws.
 */
export function visibleDropSides(hidden: ReadonlySet<DropZone> | undefined): readonly DropZone[] {
  if (!hidden || hidden.size === 0) return DROP_ZONES;
  return DROP_ZONES.filter((side) => !hidden.has(side));
}
