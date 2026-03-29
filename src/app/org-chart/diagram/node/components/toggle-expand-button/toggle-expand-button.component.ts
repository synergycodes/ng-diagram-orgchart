import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle-expand-button',
  templateUrl: './toggle-expand-button.component.html',
  styleUrls: ['./toggle-expand-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[class.layout-horizontal]': 'horizontal()',
  },
})
export class ToggleExpandButtonComponent {
  horizontal = input(false);
  isCollapsed = input.required<boolean>();
  collapsedChildrenCount = input<number>();
  disabled = input(false);
  toggle = output<MouseEvent>();

  onToggle(event: MouseEvent): void {
    this.toggle.emit(event);
  }
}
