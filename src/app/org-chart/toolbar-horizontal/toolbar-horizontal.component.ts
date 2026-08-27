import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { type LayoutDirection } from '../diagram/layout/layout.service';

@Component({
  selector: 'app-toolbar-horizontal',
  templateUrl: './toolbar-horizontal.component.html',
  styleUrl: './toolbar-horizontal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarHorizontalComponent {
  direction = input.required<LayoutDirection>();
  disabled = input(false);
  directionChange = output<LayoutDirection>();

  protected readonly isDown = computed(() => this.direction() === 'DOWN');
  protected readonly isRight = computed(() => this.direction() === 'RIGHT');

  /** Index of the button that holds the toolbar's single tab stop (roving tabindex). */
  protected readonly focusedIndex = signal(0);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('btn');

  protected setVerticalLayout(): void {
    if (this.disabled()) {
      return;
    }
    this.directionChange.emit('DOWN');
  }

  protected setHorizontalLayout(): void {
    if (this.disabled()) {
      return;
    }
    this.directionChange.emit('RIGHT');
  }

  protected onKeydown(event: KeyboardEvent): void {
    const buttons = this.buttons();
    const count = buttons.length;
    if (count === 0) {
      return;
    }

    const current = this.focusedIndex();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusedIndex.set(next);
    buttons[next].nativeElement.focus();
  }
}
