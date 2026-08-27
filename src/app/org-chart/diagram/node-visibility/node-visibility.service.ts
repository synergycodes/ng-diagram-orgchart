import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { ensureNodeVisible } from './viewport';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

/** Pans the viewport to bring a node into the visible (non-obscured) area. */
@Injectable()
export class NodeVisibilityService {
  private readonly config = inject(ORG_CHART_CONFIG);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly configService = inject(NodeVisibilityConfigService, { optional: true });

  private activePan: AbortController | null = null;

  /**
   * Pans to a node, and stops the pan this method started before.
   *
   * Only one pan can be right at a time: two animations write the viewport position on the same
   * frames and fight. A caller that pans on every keystroke — a held key at the operating
   * system's repeat rate — would otherwise stack a dozen of them.
   */
  ensureVisible(nodeId: string): void {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;

    this.activePan?.abort();
    this.activePan = new AbortController();

    ensureNodeVisible(
      node,
      this.viewportService,
      this.configService?.getViewportInsets(),
      this.config.animation.viewportEnabled,
      this.config.viewport.edgePadding,
      this.config.animation.durationMs,
      this.activePan.signal,
    );
  }
}
