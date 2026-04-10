import { inject, Injectable } from '@angular/core';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { getDropStrategy, injectDropStrategies } from './drop-strategy';
import type { HighlightedIndicator } from './interfaces';

/** Executes a drop: applies the appropriate strategy and re-layouts. */
@Injectable()
export class DropService {
  private readonly layoutGate = inject(LayoutGate);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly strategies = injectDropStrategies();

  async dropNode(draggedNodeId: string, indicator: HighlightedIndicator): Promise<void> {
    if (!this.layoutGate.isIdle()) return;

    const dropStrategy = getDropStrategy(this.strategies, indicator.side);
    const { changes, visibilityHint } = dropStrategy.execute({
      draggedNodeId,
      targetNodeId: indicator.nodeId,
      side: indicator.side,
    });

    await this.modelApplyService.applyWithLayout(changes, { visibility: visibilityHint });
    this.nodeVisibilityService.ensureVisible(draggedNodeId);
  }
}
