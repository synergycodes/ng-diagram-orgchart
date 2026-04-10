import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-add-button',
  template: `
    <button
      class="add-btn"
      animate.leave="add-btn--leaving"
      [class.add-btn--left]="position() === 'left'"
      [class.add-btn--right]="position() === 'right'"
      [class.add-btn--bottom]="position() === 'bottom'"
      [disabled]="disabled()"
      (pointerdown)="$event.stopPropagation()"
      (click)="onAdd($event)"
      data-no-drag="true"
      data-no-pan="true"
    >
      <span class="add-btn__icon"></span>
    </button>
  `,
  styleUrls: ['./add-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[class.layout-horizontal]': 'horizontal()',
  },
})
export class AddButtonComponent {
  position = input.required<'left' | 'right' | 'bottom'>();
  horizontal = input(false);
  disabled = input(false);
  add = output<MouseEvent>();

  onAdd(event: MouseEvent): void {
    this.add.emit(event);
  }
}
