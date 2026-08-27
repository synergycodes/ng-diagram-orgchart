import { DROP_ZONES, type DropZone } from '../../../../drag-reorder/zone-detection/index';
import type { DropIndicatorState } from './drop-indicator.component';

export type IndicatorStates = Readonly<Record<DropZone, DropIndicatorState>>;

export function buildIndicatorStates(
  visible: ReadonlySet<DropZone>,
  highlighted: DropZone | null,
): IndicatorStates {
  return Object.fromEntries(
    DROP_ZONES.map((side) => [
      side,
      { visible: visible.has(side), highlighted: highlighted === side },
    ]),
  ) as IndicatorStates;
}

/**
 * Without this, every rendered node re-renders on every keystroke: the computed builds fresh
 * objects each time, so a default reference check always reports a change.
 */
export function indicatorStatesEqual(
  a: IndicatorStates | null,
  b: IndicatorStates | null,
): boolean {
  if (a === null || b === null) return a === b;
  return DROP_ZONES.every(
    (side) => a[side].visible === b[side].visible && a[side].highlighted === b[side].highlighted,
  );
}
