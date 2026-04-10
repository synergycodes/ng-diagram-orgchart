import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from 'ng-diagram';
import { ensureNodeVisible } from './viewport';
import { NodeVisibilityConfigService } from './node-visibility-config.service';

@Injectable()
export class NodeVisibilityService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly configService = inject(NodeVisibilityConfigService, { optional: true });

  ensureVisible(nodeId: string): void {
    const node = this.modelService.getNodeById(nodeId);
    if (!node) return;
    ensureNodeVisible(node, this.viewportService, this.configService?.getViewportInsets());
  }
}
