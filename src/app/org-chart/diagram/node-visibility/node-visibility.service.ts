import { inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { ensureNodeVisible, type ViewportInsets } from '../utils/viewport';

export interface NodeVisibilityConfig {
  getViewportInsets?: () => ViewportInsets;
}

export class NodeVisibilityService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);

  constructor(private readonly config?: NodeVisibilityConfig) {}

  ensureVisible(nodeId: string): void {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;
    ensureNodeVisible(node, this.viewportService, this.config?.getViewportInsets?.());
  }
}
