import { inject, Injectable } from '@angular/core';
import { NgDiagramSelectionService } from 'ng-diagram';
import { MoveModeService } from '../../../keyboard-move';
import { PropertiesSidebarService } from '../../../properties-sidebar/properties-sidebar.service';
import { ExpandCollapseService } from '../../model/expand-collapse.service';
import { ModelApplyService } from '../../model/model-apply.service';
import { ConfirmDeleteDialogService } from '../../confirm-delete/confirm-delete-dialog.service';
import { NodeVisibilityService } from '../../node-visibility/node-visibility.service';
import { arrowStep, isArrowKey, type ArrowKey } from '../order/arrow-keys';
import {
  resolveDiagramFocus,
  type FocusedNode,
  type FocusedNodeAction,
  type NodeFocusContext,
} from '../focus/diagram-focus-level';
import { type KeyBinding } from './key-bindings.interface';
import {
  isDeleteKey,
  isDisruptiveLibraryShortcut,
  isModifierEnter,
  swallow,
  swallowFromLibrary,
} from './key-events';
import { NavigationOrderService } from '../order/navigation-order.service';
import { getNodeActions } from '../focus/node-actions';
import { DiagramFocusService } from '../focus/diagram-focus.service';
import { NodeFocusService } from '../focus/node-focus.service';

/**
 * Routes diagram keydown events to the action for whatever holds the focus. Keeps
 * `DiagramComponent` free of keyboard logic.
 *
 * One binding table per level, in the order `handle` tries them: an active move mode answers
 * every key, then a focused node, then one of that node's action buttons. Anything else is left
 * to the library.
 */
@Injectable()
export class DiagramKeyboardService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly navigationService = inject(NavigationOrderService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly nodeFocusService = inject(NodeFocusService);
  private readonly diagramFocusService = inject(DiagramFocusService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly confirmDeleteService = inject(ConfirmDeleteDialogService);
  private readonly moveModeService = inject(MoveModeService);

  /**
   * While a node is being moved, every key that would disturb the move has to be stopped before
   * the library sees it.
   */
  private readonly moveModeBindings: readonly KeyBinding<void>[] = [
    { match: (e) => e.key === 'Escape', run: (e) => this.cancelMove(e) },
    { match: isModifierEnter, run: swallow },
    { match: (e) => e.key === 'Enter', run: (e) => this.confirmMove(e) },
    { match: (e) => e.key === 'Tab', run: (e) => this.stepMove(e) },
    { match: (e) => isArrowKey(e.key) && !e.shiftKey, run: (e) => this.stepMoveByArrow(e) },
    { match: (e) => isArrowKey(e.key) && e.shiftKey, run: swallow },
    { match: isDeleteKey, run: swallow },
    { match: isDisruptiveLibraryShortcut, run: swallowFromLibrary },
    { match: (e) => e.key === ' ', run: swallow },
    { match: (e) => e.key === '?', run: swallowFromLibrary },
  ];

  private readonly nodeBindings: readonly KeyBinding<FocusedNode>[] = [
    { match: (e) => e.key === 'Tab', run: (e, f) => this.moveFocus(e, f.nodeId) },
    { match: (e) => isArrowKey(e.key), run: (e, f) => this.moveFocusInDirection(e, f) },
    { match: isModifierEnter, run: (e, f) => this.selectAndOpenSidebar(e, f) },
    { match: (e) => e.key === 'Enter', run: (e, f) => this.selectAndDescend(e, f) },
    { match: (e) => e.key === 'Escape', run: (e) => this.clearSelection(e) },
    { match: (e) => e.key === ' ', run: (e, f) => this.toggleExpand(e, f) },
    { match: isDeleteKey, run: (e, f) => this.requestDelete(e, f) },
  ];

  private readonly nodeActionBindings: readonly KeyBinding<FocusedNodeAction>[] = [
    { match: (e) => e.key === 'Tab', run: (e, f) => this.moveFocusWithinActions(e, f) },
    {
      match: (e) => e.shiftKey && isArrowKey(e.key),
      run: (e, f) => this.moveFocusInDirection(e, f),
    },
    { match: (e) => isArrowKey(e.key), run: (e, f) => this.stepActionByArrow(e, f) },
    { match: isModifierEnter, run: (e, f) => this.selectAndOpenSidebar(e, f) },
    { match: (e) => e.key === 'Escape', run: (e, f) => this.ascendToNode(e, f) },
    { match: isDeleteKey, run: (e, f) => this.requestDelete(e, f) },
  ];

  handle(event: KeyboardEvent): void {
    if (this.moveModeService.isActive()) {
      this.run(this.moveModeBindings, event, undefined);
      return;
    }

    const focus = resolveDiagramFocus(event.target);
    switch (focus.level) {
      case 'node':
        this.run(this.nodeBindings, event, focus);
        break;
      case 'nodeAction':
        this.run(this.nodeActionBindings, event, focus);
        break;
    }
  }

  private run<TFocus>(
    bindings: readonly KeyBinding<TFocus>[],
    event: KeyboardEvent,
    focus: TFocus,
  ): void {
    const binding = bindings.find((b) => b.match(event));
    if (binding) binding.run(event, focus);
  }

  private moveFocus(event: KeyboardEvent, nodeId: string): void {
    const targetId = this.navigationService.getAdjacentNodeId(nodeId, event.shiftKey ? -1 : 1);
    if (!targetId) return;
    event.preventDefault();
    this.diagramFocusService.focusNode(targetId);
  }

  /** The arrow has to be stopped as well, or the library pans the chart under the new focus. */
  private moveFocusInDirection(event: KeyboardEvent, focus: NodeFocusContext): void {
    swallowFromLibrary(event);
    const targetId = this.navigationService.getNextNodeId(focus.nodeId, event.key as ArrowKey);
    if (!targetId) return;
    this.diagramFocusService.focusNode(targetId);
  }

  private selectAndDescend(event: KeyboardEvent, focus: FocusedNode): void {
    swallow(event);
    this.selectionService.select([focus.nodeId]);
    this.nodeFocusService.focusFirstAction(focus.nodeId);
  }

  private selectAndOpenSidebar(event: KeyboardEvent, focus: NodeFocusContext): void {
    swallow(event);
    this.selectionService.select([focus.nodeId]);
    this.sidebarService.expandSidebar(focus.host);
  }

  private clearSelection(event: KeyboardEvent): void {
    const { nodes, edges } = this.selectionService.selection();
    if (nodes.length === 0 && edges.length === 0) return;
    swallow(event);
    this.selectionService.deselectAll();
  }

  private async toggleExpand(event: KeyboardEvent, focus: FocusedNode): Promise<void> {
    swallow(event);
    const result = this.expandCollapseService.prepareToggle(focus.nodeId);
    if (!result) return;
    await this.modelApplyService.applyWithLayout(result.changes, {
      visibility: { subtreeIds: result.toggledSubtreeIds, collapsing: result.collapsing },
    });
    this.nodeVisibilityService.ensureVisible(focus.nodeId);
  }

  private moveFocusWithinActions(event: KeyboardEvent, focus: FocusedNodeAction): void {
    const next = this.nextAction(focus, event.shiftKey ? -1 : 1);
    if (!next) return;
    swallow(event);
    next.focus({ preventScroll: true });
  }

  /** An arrow stays inside the node's own buttons. `Escape` is the way back out. */
  private stepActionByArrow(event: KeyboardEvent, focus: FocusedNodeAction): void {
    swallowFromLibrary(event);
    this.nextAction(focus, arrowStep(event.key as ArrowKey))?.focus({ preventScroll: true });
  }

  private nextAction(focus: FocusedNodeAction, step: 1 | -1): HTMLElement | null {
    const actions = getNodeActions(focus.host);
    if (actions.length === 0) return null;
    const index = actions.indexOf(focus.action);
    return actions[(index + step + actions.length) % actions.length];
  }

  private ascendToNode(event: KeyboardEvent, focus: FocusedNodeAction): void {
    swallow(event);
    focus.host.focus({ preventScroll: true });
  }

  /** Stop the key, so Backspace cannot reach a browser default. */
  private requestDelete(event: KeyboardEvent, focus: NodeFocusContext): void {
    swallow(event);
    this.confirmDeleteService.requestDelete(focus.nodeId, focus.host);
  }

  private cancelMove(event: KeyboardEvent): void {
    swallow(event);
    this.moveModeService.cancel();
  }

  private async confirmMove(event: KeyboardEvent): Promise<void> {
    swallow(event);
    await this.moveModeService.confirm();
  }

  private stepMove(event: KeyboardEvent): void {
    swallow(event);
    this.moveModeService.step(event.shiftKey ? -1 : 1);
  }

  /** The arrow has to be stopped as well, or the library pans the chart under the move. */
  private stepMoveByArrow(event: KeyboardEvent): void {
    swallowFromLibrary(event);
    this.moveModeService.stepByArrow(event.key as ArrowKey);
  }
}
