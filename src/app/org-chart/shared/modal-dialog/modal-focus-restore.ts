import { InjectionToken } from '@angular/core';

export interface ModalFocusRestore {
  /** Changes the focus target to an element that stays in the DOM while the dialog is open. */
  normalize(target: HTMLElement | null): HTMLElement | null;
  /** The dialog calls this function if the focus target is not in the DOM when the dialog closes. */
  recover(): void;
}

export const MODAL_FOCUS_RESTORE = new InjectionToken<ModalFocusRestore>('MODAL_FOCUS_RESTORE');
