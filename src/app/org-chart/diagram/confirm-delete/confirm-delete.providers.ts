import { type Provider } from '@angular/core';
import { ConfirmDeleteDialogService } from './confirm-delete-dialog.service';
import { ConfirmDeleteFocusService } from './confirm-delete-focus.service';
import { ConfirmDeleteMessageService } from './confirm-delete-message.service';

/** Add these providers at one location only. All the callers must use one instance. */
export function provideConfirmDelete(): Provider[] {
  return [ConfirmDeleteMessageService, ConfirmDeleteFocusService, ConfirmDeleteDialogService];
}
