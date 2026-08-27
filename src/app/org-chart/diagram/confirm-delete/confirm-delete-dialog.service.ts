import { computed, inject, Injectable, signal } from '@angular/core';
import { LayoutGate } from '../layout/layout-gate';
import { RemoveNodeService } from '../model/remove-node.service';
import { ConfirmDeleteFocusService } from './confirm-delete-focus.service';
import { ConfirmDeleteMessageService, type DeleteMessage } from './confirm-delete-message.service';

interface DeleteRequest {
  readonly nodeId: string;
  readonly message: DeleteMessage;
  /** A node host. An action button leaves the DOM while the dialog is open. */
  readonly cancelFocusTarget: HTMLElement | null;
}

type DeletionPhase = 'idle' | 'confirming' | 'resolving';

/**
 * Drives the confirm-delete dialog, and is the one path that deletes a node from inside the app.
 *
 * "Delete" is what the user is asked. "Remove" is what the model does, in `RemoveNodeService`.
 */
@Injectable()
export class ConfirmDeleteDialogService {
  private readonly layoutGate = inject(LayoutGate);
  private readonly removeNodeService = inject(RemoveNodeService);
  private readonly messageService = inject(ConfirmDeleteMessageService);
  private readonly focusService = inject(ConfirmDeleteFocusService);

  private readonly phase = signal<DeletionPhase>('idle');
  private readonly pendingRequest = signal<DeleteRequest | null>(null);
  private readonly returnFocus = signal<HTMLElement | null>(null);

  readonly isOpen = computed(() => this.phase() === 'confirming');
  /** True while a confirmed delete runs. The dialog makes its buttons inert. */
  readonly isActivated = computed(() => this.phase() === 'resolving');
  readonly message = computed<DeleteMessage | null>(() => this.pendingRequest()?.message ?? null);
  readonly returnFocusTarget = this.returnFocus.asReadonly();

  requestDelete(nodeId: string, cancelFocusTarget: HTMLElement | null): void {
    if (!this.canOpen()) return;

    const message = this.messageService.build(nodeId);
    if (!message) return;

    this.openDialog({ nodeId, message, cancelFocusTarget });
  }

  async confirm(): Promise<void> {
    const request = this.takeRequest();
    if (!request) return;

    const successorId = this.focusService.resolveSuccessor(request.nodeId);
    this.returnFocus.set(this.focusService.returnTarget);

    try {
      await this.removeNodeService.removeNode(request.nodeId);
      this.focusService.focusSuccessor(successorId);
    } finally {
      this.closeDialog();
    }
  }

  /** The dialog reports every close, including the one a confirmed delete causes. */
  cancel(): void {
    if (!this.isOpen()) return;

    this.returnFocus.set(this.pendingRequest()?.cancelFocusTarget ?? null);
    this.closeDialog();
  }

  /** No second dialog, and none over a chart that is still laying out. */
  private canOpen(): boolean {
    return this.phase() === 'idle' && this.layoutGate.isIdle();
  }

  private openDialog(request: DeleteRequest): void {
    this.pendingRequest.set(request);
    this.returnFocus.set(null);
    this.phase.set('confirming');
  }

  /** Only the first caller gets the request. A second press on Delete then does nothing. */
  private takeRequest(): DeleteRequest | null {
    const request = this.pendingRequest();
    if (!request || !this.isOpen()) return null;

    this.phase.set('resolving');
    return request;
  }

  private closeDialog(): void {
    this.pendingRequest.set(null);
    this.phase.set('idle');
  }
}
