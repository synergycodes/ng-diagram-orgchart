import { Injectable, signal } from '@angular/core';

export type NodeFocusTarget = 'host' | 'firstAction';

interface NodeFocusRequest {
  readonly id: string;
  readonly target: NodeFocusTarget;
  readonly nonce: number;
}

/**
 * Coordinates programmatic focus for org-chart node hosts and their action buttons.
 *
 * Callers publish a focus request by node id and target; the matching `NodeComponent`
 * reacts via an effect and focuses either its host element or its first action button.
 * A monotonic nonce is included so that repeated requests for the same id and target
 * re-fire the effect (signals only emit on value change).
 */
@Injectable()
export class NodeFocusService {
  private readonly request = signal<NodeFocusRequest | null>(null);
  private counter = 0;
  readonly current = this.request.asReadonly();

  focus(id: string): void {
    this.request.set({ id, target: 'host', nonce: ++this.counter });
  }

  focusFirstAction(id: string): void {
    this.request.set({ id, target: 'firstAction', nonce: ++this.counter });
  }
}
