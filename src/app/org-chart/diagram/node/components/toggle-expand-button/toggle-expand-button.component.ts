import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Node } from 'ng-diagram';
import { LayoutGate } from '../../../layout/layout-gate';
import {
  getCollapsedChildrenCount,
  getHasChildren,
  getIsCollapsed,
} from '../../../model/data-getters';
import { ExpandCollapseService } from '../../../model/expand-collapse.service';
import type { OrgChartNodeData } from '../../../model/interfaces';
import { ModelApplyService } from '../../../model/model-apply.service';
import { NodeVisibilityService } from '../../../node-visibility/node-visibility.service';

@Component({
  selector: 'app-toggle-expand-button',
  templateUrl: './toggle-expand-button.component.html',
  styleUrls: ['./toggle-expand-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[class.layout-horizontal]': 'isHorizontal()',
  },
})
export class ToggleExpandButtonComponent {
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly layoutGate = inject(LayoutGate);

  node = input.required<Node<OrgChartNodeData>>();
  isHorizontal = input(false);

  protected hasChildren = computed(() => getHasChildren(this.node()));
  protected isCollapsed = computed(() => getIsCollapsed(this.node()));
  protected collapsedChildrenCount = computed(() => getCollapsedChildrenCount(this.node()));
  protected isDisabled = computed(() => !this.layoutGate.isIdle());

  async onToggle(event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const result = this.expandCollapseService.prepareToggle(this.node().id);
    if (!result) return;

    await this.modelApplyService.applyWithLayout(result.changes, {
      visibility: { subtreeIds: result.toggledSubtreeIds, collapsing: result.collapsing },
    });

    this.nodeVisibilityService.ensureVisible(this.node().id);
  }
}
