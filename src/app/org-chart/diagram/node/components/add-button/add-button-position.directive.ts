import { computed, Directive, input } from '@angular/core';
import type { DropZone } from '../../../../drag-reorder/zone-detection/index';

@Directive({
  selector: '[appAddButtonPosition]',
  host: {
    '[class.add-btn--left]': "position() === 'left'",
    '[class.add-btn--right]': "position() === 'right'",
    '[class.add-btn--bottom]': "position() === 'bottom'",
  },
})
export class AddButtonPositionDirective {
  readonly appAddButtonPosition = input.required<DropZone>();

  protected readonly position = computed(() => this.appAddButtonPosition());
}
