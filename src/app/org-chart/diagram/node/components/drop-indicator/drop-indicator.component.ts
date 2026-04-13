import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DragReorderService } from '../../../../drag-reorder/drag-reorder.service';
import type { DropZone } from '../../../../drag-reorder/zone-detection/index';
import { LayoutService } from '../../../layout/layout.service';

@Component({
  selector: 'app-drop-indicator',
  template: '',
  styleUrls: ['./drop-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'drop-indicator',
    '[class.drop-indicator--left]': "side() === 'left'",
    '[class.drop-indicator--right]': "side() === 'right'",
    '[class.drop-indicator--bottom]': "side() === 'bottom'",
    '[class.drop-indicator--visible]': '!isHidden()',
    '[class.drop-indicator--highlighted]': 'isHighlighted()',
    '[class.drop-indicator--no-toggle]': "side() === 'bottom' && !hasChildren()",
    '[class.layout-horizontal]': 'layoutService.isHorizontal()',
    'animate.leave': 'drop-indicator--leaving',
  },
})
export class DropIndicatorComponent {
  private readonly dragReorderService = inject(DragReorderService);
  protected readonly layoutService = inject(LayoutService);

  nodeId = input.required<string>();
  side = input.required<DropZone>();
  hasChildren = input(false);

  protected isHidden = computed(() =>
    this.dragReorderService.isSideHidden(this.nodeId(), this.side()),
  );

  protected isHighlighted = computed(() => {
    const indicator = this.dragReorderService.highlightedIndicator();
    return indicator?.nodeId === this.nodeId() && indicator?.side === this.side();
  });
}
