import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { type LayoutDirection } from '../diagram/layout/layout.service';

@Component({
  selector: 'app-toolbar-horizontal',
  templateUrl: './toolbar-horizontal.component.html',
  styleUrl: './toolbar-horizontal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarHorizontalComponent {
  direction = input.required<LayoutDirection>();
  directionChange = output<LayoutDirection>();

  protected readonly isDown = computed(() => this.direction() === 'DOWN');
  protected readonly isRight = computed(() => this.direction() === 'RIGHT');

  protected setVerticalLayout(): void {
    this.directionChange.emit('DOWN');
  }

  protected setHorizontalLayout(): void {
    this.directionChange.emit('RIGHT');
  }
}
