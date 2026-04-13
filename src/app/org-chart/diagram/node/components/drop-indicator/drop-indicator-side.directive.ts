import { Directive, inject } from '@angular/core';
import { DropIndicatorComponent } from './drop-indicator.component';

@Directive({
  selector: '[appDropIndicatorSide]',
  host: {
    '[class.drop-indicator--left]': "side() === 'left'",
    '[class.drop-indicator--right]': "side() === 'right'",
    '[class.drop-indicator--bottom]': "side() === 'bottom'",
  },
})
export class DropIndicatorSideDirective {
  protected readonly side = inject(DropIndicatorComponent).side;
}
