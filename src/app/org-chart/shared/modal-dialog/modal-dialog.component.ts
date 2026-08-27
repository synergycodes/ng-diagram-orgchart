import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MODAL_FOCUS_RESTORE } from './modal-focus-restore';

/**
 * `showModal()` gives the role, the modal semantics and the focus trap. Do not add them again.
 *
 * The parent must react to `closed`, or `open` and the dialog disagree after the first Escape.
 *
 * Do not put the content in an `@if` block. The `viewChild` signals must stay stable.
 */
@Component({
  selector: 'app-modal-dialog',
  templateUrl: './modal-dialog.component.html',
  styleUrl: './modal-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '(keydown)': 'onKeydown($event)',
    '(click)': 'onBackdropClick($event)',
  },
})
export class ModalDialogComponent {
  private readonly document = inject(DOCUMENT);
  private readonly focusRestore = inject(MODAL_FOCUS_RESTORE, { optional: true });

  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  /** Makes the content the description of the dialog. A closed dialog keeps its id, so the
   * value must be unique on the page. */
  readonly contentId = input<string | null>(null);
  /** Makes the content a tab stop, so that a keyboard user can scroll it. */
  readonly scrollableContent = input(true);
  /** The default is the element with the focus at open time. Safari does not focus a clicked
   * `<button>`, so give the trigger. */
  readonly opener = input<HTMLElement | null>(null);
  /** Not named `role`: a static `role="..."` lands on the `display: contents` host. */
  readonly dialogRole = input<'dialog' | 'alertdialog' | undefined>(undefined);
  /** The default is the heading. */
  readonly initialFocus = input<HTMLElement | null>(null);
  /** Read at close time. Give it if the action removes the element that had the focus. */
  readonly returnFocusTo = input<HTMLElement | null>(null);
  readonly dismissOnBackdrop = input(true);
  readonly closed = output<void>();

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly headingEl = viewChild.required<ElementRef<HTMLElement>>('headingEl');

  private restoreTarget: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      const el = this.dialogEl().nativeElement;
      if (this.open()) {
        if (el.open) return;
        const captured =
          untracked(this.opener) ?? (this.document.activeElement as HTMLElement | null);
        this.restoreTarget = this.focusRestore?.normalize(captured) ?? captured;
        el.showModal();
        const focusTarget = untracked(this.initialFocus) ?? this.headingEl().nativeElement;
        focusTarget.focus({ preventScroll: true });
      } else if (el.open) {
        el.close();
      }
    });
  }

  protected onClose(): void {
    const target = untracked(this.returnFocusTo) ?? this.restoreTarget;
    this.restoreTarget = null;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    } else {
      this.focusRestore?.recover();
    }
    this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') event.stopPropagation();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (!this.dismissOnBackdrop()) return;
    if (event.target === this.dialogEl().nativeElement && event.detail !== 0) {
      this.dialogEl().nativeElement.close();
    }
  }
}
