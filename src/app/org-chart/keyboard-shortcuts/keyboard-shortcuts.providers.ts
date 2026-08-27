import { type Provider } from '@angular/core';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

/** Add these providers at one location only. The dialog and its controls must use one instance. */
export function provideKeyboardShortcuts(): Provider[] {
  return [KeyboardShortcutsService];
}
