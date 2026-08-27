import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalDialogComponent } from '../shared/modal-dialog/modal-dialog.component';
import { KEYBOARD_SHORTCUTS_TITLE, SHORTCUTS, spokenKey } from './keyboard-shortcuts';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

/**
 * You must put this component outside the `<main>` element of the diagram. If it is inside, the
 * keydown handler of `<main>` gets the Tab, Enter, Escape and Space keys of the dialog.
 */
@Component({
  selector: 'app-keyboard-shortcuts-dialog',
  imports: [ModalDialogComponent],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class KeyboardShortcutsDialogComponent {
  private readonly shortcutsService = inject(KeyboardShortcutsService);

  protected readonly isOpen = this.shortcutsService.isOpen;
  protected readonly opener = this.shortcutsService.opener;
  protected readonly title = KEYBOARD_SHORTCUTS_TITLE;
  protected readonly rows = SHORTCUTS;
  protected readonly spokenKey = spokenKey;

  protected onClose(): void {
    this.shortcutsService.close();
  }
}
