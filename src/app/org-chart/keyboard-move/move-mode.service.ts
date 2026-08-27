import {
  computed,
  effect,
  inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { DragReorderService } from '../drag-reorder/drag-reorder.service';
import { DropService } from '../drag-reorder/drop.service';
import { DiagramFocusService } from '../diagram/keyboard-navigation/focus/diagram-focus.service';
import { NavigationOrderService } from '../diagram/keyboard-navigation/order/navigation-order.service';
import { arrowStep, type ArrowKey } from '../diagram/keyboard-navigation/order/arrow-keys';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { MoveCandidatesService } from './candidates/move-candidates.service';
import { MoveMessageFactory } from './messages/move-message.factory';
import {
  buildNodeHandles,
  stepCandidateIndex,
  type MoveCandidate,
  type MoveCandidates,
  type MoveHandle,
} from './candidates/move-candidates';
import {
  moveBusyAtConfirmMessage,
  moveBusyAtStartMessage,
  moveCancelMessage,
  moveCommitMessage,
  moveFailedMessage,
  moveNodePickedMessage,
  moveNowhereMessage,
  movePreviewMessage,
  moveStaleMessage,
} from './messages/move-messages';

/** How long a finished move stays named on screen. Set it through `provideKeyboardMove`. */
export const MOVE_RESULT_VISIBLE_MS = new InjectionToken<number>('MOVE_RESULT_VISIBLE_MS');

interface MoveState {
  readonly movingId: string;
  readonly candidates: MoveCandidates;
  /** Index into `candidates.nodeIds` — the colleague a position is being chosen at. */
  readonly nodeIndex: number;
  /**
   * Index into that node's own candidate array, or null while the colleague is still being
   * chosen. Always resolved through the same array it indexes, so the committed side can only
   * ever come from the candidate itself.
   */
  readonly sideIndex: number | null;
}

/**
 * Move mode: the keyboard alternative to dragging a node to a new position.
 *
 * Two phases. First a colleague is chosen, marked only by the focus ring. Then `Enter` shows
 * every position that colleague offers and the choice is between those; `Enter` commits and
 * `Escape` steps back to choosing the colleague.
 */
@Injectable()
export class MoveModeService implements OnDestroy {
  private readonly candidatesService = inject(MoveCandidatesService);
  private readonly messages = inject(MoveMessageFactory);
  private readonly dropService = inject(DropService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly diagramFocusService = inject(DiagramFocusService);
  private readonly navigationService = inject(NavigationOrderService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly resultVisibleMs = inject(MOVE_RESULT_VISIBLE_MS);

  private readonly state = signal<MoveState | null>(null);
  private readonly status = signal('');

  /**
   * A plain field, not a signal. Writing a signal here would re-run the teardown effect in the
   * same turn, while the focused node still held the previous value, and cancel every step.
   */
  private expectedFocusId: string | null = null;

  private resultTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isActive = computed(() => this.state() !== null);
  readonly movingNodeId = computed(() => this.state()?.movingId ?? null);
  readonly message = this.status.asReadonly();

  /** True once a colleague is chosen and the choice is between the positions it offers. */
  readonly isPickingSide = computed(() => {
    const state = this.state();
    return state !== null && state.sideIndex !== null;
  });

  readonly handles = computed<readonly MoveHandle[]>(() => {
    const state = this.state();
    if (!state || state.sideIndex === null) return [];
    return buildNodeHandles(this.candidatesFor(state), state.sideIndex);
  });

  constructor() {
    effect(() => {
      if (!this.dragReorderService.isReorderActive()) return;
      if (!untracked(this.isActive)) return;
      this.abandon();
    });

    effect(() => {
      const focusedNodeId = this.diagramFocusService.nodeWithFocusId();
      if (!untracked(this.isActive)) return;
      if (focusedNodeId === this.expectedFocusId) return;
      this.abandon();
    });
  }

  ngOnDestroy(): void {
    this.clearResultTimer();
    this.state.set(null);
    this.expectedFocusId = null;
  }

  /** Reports and stays out rather than entering a mode that cannot work. */
  begin(nodeId: string): void {
    if (this.isActive()) return;
    if (this.dragReorderService.isReorderActive()) return;
    if (this.hierarchyService.getParentId(nodeId) === null) return;

    if (!this.layoutGate.isIdle()) {
      this.setResult(moveBusyAtStartMessage());
      return;
    }

    const candidates = this.candidatesService.build(nodeId);
    if (candidates.all.length === 0) {
      this.setResult(moveNowhereMessage(this.messages.nodeName(nodeId)));
      return;
    }

    const nodeIndex = this.startNodeIndex(nodeId, candidates);
    this.state.set({ movingId: nodeId, candidates, nodeIndex, sideIndex: null });
    this.goToNode(nodeId, candidates, nodeIndex);
  }

  /** Steps between colleagues in the first phase, and between that colleague's positions in the second. */
  step(delta: 1 | -1): void {
    const state = this.movableStateOrExit();
    if (!state) return;

    if (state.sideIndex === null) {
      const nodeIndex = stepCandidateIndex(state.nodeIndex, delta, state.candidates.nodeIds.length);
      this.state.set({ ...state, nodeIndex });
      this.goToNode(state.movingId, state.candidates, nodeIndex);
      return;
    }

    const own = this.candidatesFor(state);
    const sideIndex = stepCandidateIndex(state.sideIndex, delta, own.length);
    this.state.set({ ...state, sideIndex });
    this.status.set(this.preview(state.movingId, own[sideIndex]));
  }

  /**
   * In the first phase an arrow goes to the nearest colleague that offers a position. In the
   * second it cycles that colleague's positions, because the focus stays on one card.
   */
  stepByArrow(key: ArrowKey): void {
    const state = this.movableStateOrExit();
    if (!state) return;

    if (state.sideIndex !== null) {
      this.step(arrowStep(key));
      return;
    }

    const from = state.candidates.nodeIds[state.nodeIndex];
    const targetId = this.navigationService.getNextNodeId(from, key, (nodeId) =>
      state.candidates.byNodeId.has(nodeId),
    );
    if (!targetId) return;

    const nodeIndex = state.candidates.nodeIds.indexOf(targetId);
    this.state.set({ ...state, nodeIndex });
    this.goToNode(state.movingId, state.candidates, nodeIndex);
  }

  /** Shows the chosen colleague's positions, or commits the position already chosen. */
  async confirm(): Promise<void> {
    const state = this.state();
    if (!state) return;

    if (state.sideIndex === null) {
      const own = this.candidatesFor(state);
      this.state.set({ ...state, sideIndex: 0 });
      this.status.set(this.preview(state.movingId, own[0]));
      return;
    }

    if (!this.layoutGate.isIdle()) {
      this.status.set(moveBusyAtConfirmMessage());
      return;
    }

    const { movingId } = state;
    const moving = this.messages.nodeName(movingId);
    if (!this.stillMovable(movingId)) {
      this.exit(moveStaleMessage(moving));
      return;
    }

    const picked = this.candidatesFor(state)[state.sideIndex];
    const fresh = this.candidatesService.build(movingId);
    const match = fresh.all.find((c) => c.nodeId === picked.nodeId && c.side === picked.side);
    if (!match) {
      this.exit(moveStaleMessage(moving));
      return;
    }

    const success = moveCommitMessage(
      moving,
      this.messages.nodeName(match.nodeId),
      match.side,
      this.messages.newManagerName(match, movingId),
    );

    this.exit('');
    try {
      await this.dropService.dropNode(movingId, { nodeId: match.nodeId, side: match.side });
      this.setResult(success);
    } catch {
      this.setResult(moveFailedMessage(moving));
    }
    this.diagramFocusService.focusNode(movingId);
  }

  /**
   * Steps back one phase: from choosing a position to choosing a colleague, and from there out
   * of the mode altogether.
   */
  cancel(): void {
    const state = this.state();
    if (!state) return;

    if (state.sideIndex !== null) {
      this.state.set({ ...state, sideIndex: null });
      this.status.set(this.nodePicked(state.movingId, state.candidates.nodeIds[state.nodeIndex]));
      return;
    }

    this.exit(moveCancelMessage(this.messages.nodeName(state.movingId)));
    this.diagramFocusService.focusNode(state.movingId);
  }

  /**
   * Leaves the mode without touching the focus, for when something else has already moved it —
   * a press on the canvas, a pointer drag, or a tab into the panel.
   */
  private abandon(): void {
    const state = this.state();
    if (!state) return;
    this.exit(moveCancelMessage(this.messages.nodeName(state.movingId)));
  }

  private exit(message: string): void {
    this.state.set(null);
    this.expectedFocusId = null;
    this.setResult(message);
  }

  /**
   * A result outlives the mode, so it clears itself. Left on screen it would still name a move
   * long after the chart had moved on.
   */
  private setResult(message: string): void {
    this.clearResultTimer();
    this.status.set(message);
    if (!message) return;
    this.resultTimer = setTimeout(() => {
      this.resultTimer = null;
      if (!untracked(this.isActive)) this.status.set('');
    }, this.resultVisibleMs);
  }

  private clearResultTimer(): void {
    if (this.resultTimer === null) return;
    clearTimeout(this.resultTimer);
    this.resultTimer = null;
  }

  private goToNode(movingId: string, candidates: MoveCandidates, nodeIndex: number): void {
    const nodeId = candidates.nodeIds[nodeIndex];
    this.clearResultTimer();
    this.expectedFocusId = nodeId;
    this.diagramFocusService.focusNode(nodeId);
    this.status.set(this.nodePicked(movingId, nodeId));
  }

  private nodePicked(movingId: string, nodeId: string): string {
    return moveNodePickedMessage(this.messages.nodeName(movingId), this.messages.nodeName(nodeId));
  }

  private preview(movingId: string, candidate: MoveCandidate): string {
    return movePreviewMessage(
      this.messages.nodeName(movingId),
      this.messages.nodeName(candidate.nodeId),
      candidate.side,
      this.messages.newManagerName(candidate, movingId),
    );
  }

  private candidatesFor(state: MoveState): readonly MoveCandidate[] {
    return state.candidates.byNodeId.get(state.candidates.nodeIds[state.nodeIndex]) ?? [];
  }

  /** Starts at a colleague under the moved node's own manager, where most reorders happen. */
  private startNodeIndex(movingId: string, candidates: MoveCandidates): number {
    const parentId = this.hierarchyService.getParentId(movingId);
    const firstUnderOwnParent = candidates.all.find((c) => c.parentId === parentId);
    if (!firstUnderOwnParent) return 0;
    const index = candidates.nodeIds.indexOf(firstUnderOwnParent.nodeId);
    return index >= 0 ? index : 0;
  }

  private movableStateOrExit(): MoveState | null {
    const state = this.state();
    if (!state) return null;
    if (this.stillMovable(state.movingId)) return state;
    this.exit(moveStaleMessage(this.messages.nodeName(state.movingId)));
    return null;
  }

  /**
   * A node that has left the model would widen the candidate list rather than empty it, because
   * both exclusion rules go quiet, and the commit would then add an edge to nothing.
   */
  private stillMovable(movingId: string): boolean {
    if (!this.modelService.getNodeById(movingId)) return false;
    return this.hierarchyService.getParentId(movingId) !== null;
  }
}
