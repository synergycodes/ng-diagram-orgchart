import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { KEYBOARD_SHORTCUTS_HOTKEY, KEYBOARD_SHORTCUTS_TITLE } from './keyboard-shortcuts';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

export type KeyboardShortcutsTriggerVariant = 'icon' | 'link';

/**
 * Do not add `aria-expanded` or `aria-haspopup`. These attributes are for a disclosure and not
 * for a modal.
 */
@Component({
  selector: 'app-keyboard-shortcuts-trigger',
  templateUrl: './keyboard-shortcuts-trigger.component.html',
  styleUrl: './keyboard-shortcuts-trigger.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class KeyboardShortcutsTriggerComponent {
  private readonly shortcutsService = inject(KeyboardShortcutsService);

  readonly variant = input<KeyboardShortcutsTriggerVariant>('icon');

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly label = KEYBOARD_SHORTCUTS_TITLE;
  protected readonly hotkey = KEYBOARD_SHORTCUTS_HOTKEY;
  protected readonly isIcon = computed(() => this.variant() === 'icon');

  protected onClick(): void {
    this.shortcutsService.open(this.trigger().nativeElement);
  }
}
