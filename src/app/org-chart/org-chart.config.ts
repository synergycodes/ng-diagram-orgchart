import { InjectionToken } from '@angular/core';

export interface OrgChartConfig {
  /** Animation duration and timing. */
  animation: {
    /** Duration in ms for layout transitions and viewport pans. Default: `300` */
    durationMs: number;
    /** Whether to animate node position changes during layout transitions. Default: `true` */
    layoutEnabled: boolean;
    /** Whether to animate viewport pans (e.g. ensureVisible). Default: `true` */
    viewportEnabled: boolean;
  };

  /** ELK layout engine parameters. */
  layout: {
    /** Spacing between sibling nodes (ELK `spacing.nodeNode`). Default: `140` */
    nodeSpacing: number;
  };

  /** Viewport and visibility behavior. */
  viewport: {
    /** Scale threshold below which nodes switch to compact variant. Default: `0.75` */
    compactScaleThreshold: number;
    /** Pixel padding when nudging an offscreen node into view. Default: `60` */
    edgePadding: number;
    /** Extra padding around all sides when fitting all nodes in view. Default: `20` */
    zoomToFitPadding: number;
    /** Scale increment per zoom-in / zoom-out click. Default: `0.1` */
    zoomStep: number;
  };

  /** Drag-and-drop reorder tuning. */
  drag: {
    /** Pixel padding added to node bounds for child-zone alignment detection. Default: `40` */
    alignmentPadding: number;
    /** Pixel range for showing drop indicators near dragged node. Default: `400` */
    indicatorRange: number;
    /** Throttle interval in ms for move event processing during drag. Default: `100` */
    throttleMs: number;
    /** Max edge-to-edge pixel distance for a drop candidate. Default: `100` */
    detectionRange: number;
    /** Broad-phase pixel range for spatial query during drag. Default: `400` */
    queryRange: number;
  };
}

export const ORG_CHART_DEFAULTS: OrgChartConfig = {
  animation: { durationMs: 300, layoutEnabled: true, viewportEnabled: true },
  layout: { nodeSpacing: 140 },
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

function mergeConfig(
  defaults: OrgChartConfig,
  overrides: PartialOrgChartConfig,
): OrgChartConfig {
  return {
    animation: { ...defaults.animation, ...overrides.animation },
    layout: { ...defaults.layout, ...overrides.layout },
    viewport: { ...defaults.viewport, ...overrides.viewport },
    drag: { ...defaults.drag, ...overrides.drag },
  };
}
