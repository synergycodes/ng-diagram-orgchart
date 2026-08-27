import { Injectable, signal } from '@angular/core';

@Injectable()
export class KeyboardShortcutsService {
  private readonly openState = signal(false);
  private readonly openerElement = signal<HTMLElement | null>(null);

  readonly isOpen = this.openState.asReadonly();
  readonly opener = this.openerElement.asReadonly();

  /** If you do not give an `opener`, the focus goes back to the element that has the focus now. */
  open(opener: HTMLElement | null = null): void {
    this.openerElement.set(opener);
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
