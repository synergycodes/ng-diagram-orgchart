import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-add-button',
  template: `
    <button
      class="add-btn"
      [class.add-btn--left]="position() === 'left'"
      [class.add-btn--right]="position() === 'right'"
      [class.add-btn--bottom]="position() === 'bottom'"
      (pointerdown)="$event.stopPropagation()"
      (click)="onAdd($event)"
      data-no-drag="true"
      data-no-pan="true"
    >
      +
    </button>
  `,
  styleUrls: ['./add-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class AddButtonComponent {
  position = input.required<'left' | 'right' | 'bottom'>();
  add = output<MouseEvent>();

  onAdd(event: MouseEvent): void {
    this.add.emit(event);
  }
}
