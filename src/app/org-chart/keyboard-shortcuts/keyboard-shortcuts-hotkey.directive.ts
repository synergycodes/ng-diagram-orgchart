import { Directive, inject } from '@angular/core';
import { isTextEntryTarget } from '../shared/text-entry';
import { KEYBOARD_SHORTCUTS_HOTKEY } from './keyboard-shortcuts';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

/** An event that starts inside a dialog also goes up the DOM tree to the document. */
function isInsideOpenDialog(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('dialog[open]') !== null;
}

/**
 * This directive tests `event.key` only. It does not test `shiftKey`, because some keyboard
 * layouts do not make `?` with `Shift+/`.
 *
 * The listener is on the document, because the key must also operate after a page load, when
 * `<body>` has the focus.
 */
@Directive({
  selector: '[appKeyboardShortcutsHotkey]',
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class KeyboardShortcutsHotkeyDirective {
  private readonly shortcutsService = inject(KeyboardShortcutsService);

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== KEYBOARD_SHORTCUTS_HOTKEY || event.defaultPrevented) return;
    if (isTextEntryTarget(event.target)) return;
    if (isInsideOpenDialog(event.target)) return;
    event.preventDefault();
    this.shortcutsService.open();
  }
}
