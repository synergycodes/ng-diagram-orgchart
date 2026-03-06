import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle-expand-button',
  template: `
    <button class="toggle-btn" (pointerdown)="$event.stopPropagation()" (click)="onToggle($event)">
      {{ isCollapsed() ? '+' : '-' }}
    </button>
  `,
  styleUrls: ['./toggle-expand-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class ToggleExpandButtonComponent {
  isCollapsed = input.required<boolean>();
  toggle = output<MouseEvent>();

  onToggle(event: MouseEvent): void {
    this.toggle.emit(event);
  }
}
