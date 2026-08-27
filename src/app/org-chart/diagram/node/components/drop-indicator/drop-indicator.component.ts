import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { DropZone } from '../../../../drag-reorder/zone-detection/index';
import { LayoutService } from '../../../layout/layout.service';
import { DropIndicatorSideDirective } from './drop-indicator-side.directive';

export interface DropIndicatorState {
  readonly visible: boolean;
  /** The position that happens: the zone under the pointer, or the one `Enter` commits. */
  readonly highlighted: boolean;
}

/**
 * The bar that marks where a node would land.
 *
 * Driven entirely by its `state` input, so that both the pointer drag and keyboard move mode can
 * feed it without either knowing about the other.
 */
@Component({
  selector: 'app-drop-indicator',
  template: '',
  styleUrls: ['./drop-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DropIndicatorSideDirective],
  host: {
    class: 'drop-indicator',
    '[class.drop-indicator--visible]': 'state().visible',
    '[class.drop-indicator--highlighted]': 'state().highlighted',
    '[class.drop-indicator--no-toggle]': "side() === 'bottom' && !hasChildren()",
    '[class.layout-horizontal]': 'layoutService.isHorizontal()',
    'animate.leave': 'drop-indicator--leaving',
  },
})
export class DropIndicatorComponent {
  protected readonly layoutService = inject(LayoutService);

  side = input.required<DropZone>();
  state = input.required<DropIndicatorState>();
  hasChildren = input(false);
}
