import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalDialogComponent } from '../../shared/modal-dialog/modal-dialog.component';
import { ConfirmDeleteDialogService } from './confirm-delete-dialog.service';

/**
 * Put this component outside `<main>`. Its keydown handler takes the keys of the dialog.
 *
 * Cancel gets the focus, because the app has no working undo.
 */
@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [ModalDialogComponent],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrl: './confirm-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogService = inject(ConfirmDeleteDialogService);

  protected readonly isOpen = this.dialogService.isOpen;
  protected readonly isActivated = this.dialogService.isActivated;
  protected readonly message = this.dialogService.message;
  protected readonly returnFocusTarget = this.dialogService.returnFocusTarget;

  protected onConfirm(): void {
    this.dialogService.confirm();
  }

  protected onCancel(): void {
    this.dialogService.cancel();
  }
}
