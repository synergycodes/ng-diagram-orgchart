import { InjectionToken, type Provider } from '@angular/core';

/** The page regions the diagram's focus tracking has to recognise. */
export interface DiagramFocusRegions {
  /** The diagram itself. Focus arriving from inside it is already in the chart. */
  readonly diagram: string;
  /** Regions that keep the diagram's remembered node when the focus moves into them. */
  readonly retaining: readonly string[];
}

export const DIAGRAM_FOCUS_REGIONS = new InjectionToken<DiagramFocusRegions>(
  'DIAGRAM_FOCUS_REGIONS',
);

/**
 * Declare this where the regions are composed. Name the components the page renders rather than
 * their markup, so a component can change its own template without moving the focus.
 */
export function provideDiagramFocusRegions(regions: DiagramFocusRegions): Provider {
  return { provide: DIAGRAM_FOCUS_REGIONS, useValue: regions };
}
