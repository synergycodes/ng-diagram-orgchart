import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DragReorderService } from '../../../../drag-reorder/drag-reorder.service';

@Component({
  selector: 'app-drag-indicators',
  templateUrl: './drag-indicators.component.html',
  styleUrls: ['./drag-indicators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[class.layout-horizontal]': 'isHorizontal()',
  },
})
export class DragIndicatorsComponent {
  private readonly dragReorderService = inject(DragReorderService);

  nodeId = input.required<string>();
  hasChildren = input(false);
  isHorizontal = input(false);

  protected isInDropRange = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      this.dragReorderService.isNodeInDropRange(this.nodeId()),
  );

  protected hiddenSides = computed(() => {
    const id = this.nodeId();
    return {
      left: this.dragReorderService.isSideHidden(id, 'left'),
      right: this.dragReorderService.isSideHidden(id, 'right'),
      bottom: this.dragReorderService.isSideHidden(id, 'bottom'),
    };
  });

  protected highlightedSide = computed(() => {
    const indicator = this.dragReorderService.highlightedIndicator();
    return indicator?.nodeId === this.nodeId() ? indicator.side : null;
  });
}
