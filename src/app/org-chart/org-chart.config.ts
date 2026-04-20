import { InjectionToken } from '@angular/core';

export interface OrgChartConfig {
  /** Animation duration and timing. */
  animation: {
    /** Duration in ms for layout transitions and viewport pans. */
    durationMs: number;
    /** Whether to animate node position changes during layout transitions. */
    layoutEnabled: boolean;
    /** Whether to animate viewport pans (e.g. ensureVisible). */
    viewportEnabled: boolean;
  };

  /** ELK layout engine parameters. */
  layout: {
    /** Spacing between sibling nodes (ELK `spacing.nodeNode`). */
    nodeSpacing: number;
  };

  /** Viewport and visibility behavior. */
  viewport: {
    /** Scale threshold below which nodes switch to compact variant. */
    compactScaleThreshold: number;
    /** Pixel padding when nudging an offscreen node into view. */
    edgePadding: number;
    /** Extra padding around all sides when fitting all nodes in view. */
    zoomToFitPadding: number;
    /** Scale increment per zoom-in / zoom-out click. */
    zoomStep: number;
  };

  /** Drag-and-drop reorder tuning. */
  drag: {
    /** Pixel padding added to node bounds for child-zone alignment detection. */
    alignmentPadding: number;
    /** Pixel range for showing drop indicators near dragged node. */
    indicatorRange: number;
    /** Throttle interval in ms for move event processing during drag. */
    throttleMs: number;
    /** Max edge-to-edge pixel distance for a drop candidate. */
    detectionRange: number;
    /** Broad-phase pixel range for spatial query during drag. */
    queryRange: number;
  };
}

export const ORG_CHART_DEFAULTS: OrgChartConfig = {
  animation: { durationMs: 300, layoutEnabled: true, viewportEnabled: true },
  layout: { nodeSpacing: 100 },
  viewport: {
    compactScaleThreshold: 0.75,
    edgePadding: 60,
    zoomToFitPadding: 20,
    zoomStep: 0.1,
  },
  drag: {
    alignmentPadding: 40,
    indicatorRange: 400,
    throttleMs: 100,
    detectionRange: 100,
    queryRange: 400,
  },
};

export const ORG_CHART_CONFIG = new InjectionToken<OrgChartConfig>('ORG_CHART_CONFIG', {
  factory: () => ORG_CHART_DEFAULTS,
});

export type PartialOrgChartConfig = {
  [K in keyof OrgChartConfig]?: Partial<OrgChartConfig[K]>;
};

/** Provides a customized org-chart config by deep-merging overrides with defaults. */
export function provideOrgChartConfig(overrides: PartialOrgChartConfig) {
  return {
    provide: ORG_CHART_CONFIG,
    useValue: mergeConfig(ORG_CHART_DEFAULTS, overrides),
  };
}

function mergeConfig(defaults: OrgChartConfig, overrides: PartialOrgChartConfig): OrgChartConfig {
  return {
    animation: { ...defaults.animation, ...overrides.animation },
    layout: { ...defaults.layout, ...overrides.layout },
    viewport: { ...defaults.viewport, ...overrides.viewport },
    drag: { ...defaults.drag, ...overrides.drag },
  };
}
