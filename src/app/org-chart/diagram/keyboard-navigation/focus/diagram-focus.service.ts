import { computed, inject, Injectable, signal } from '@angular/core';
import { NodeVisibilityService } from '../../node-visibility/node-visibility.service';
import {
  isInsideRegion,
  NODE_HOST_SELECTOR,
  resolveDiagramFocus,
  type DiagramFocus,
} from './diagram-focus-level';
import { DIAGRAM_FOCUS_REGIONS } from './diagram-focus-regions';
import { NavigationOrderService } from '../order/navigation-order.service';
import { NodeFocusService } from './node-focus.service';

/**
 * Owns which node is the diagram's tab stop, and focusing it.
 *
 * `entryNodeId` resumes at the node that last had focus, falling back to the
 * first node in tab order.
 */
@Injectable()
export class DiagramFocusService {
  private readonly navigationService = inject(NavigationOrderService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly nodeFocusService = inject(NodeFocusService);
  private readonly regions = inject(DIAGRAM_FOCUS_REGIONS);

  private readonly retainingSelector = this.regions.retaining.join(', ');

  private readonly lastFocusedNodeId = signal<string | null>(null);
  private readonly nodeWithFocus = signal<string | null>(null);
  private fallbackTarget: HTMLElement | null = null;
  private lastInputWasPointer = false;

  /** The node that currently contains focus — its host or one of its action buttons. */
  readonly nodeWithFocusId = this.nodeWithFocus.asReadonly();

  readonly entryNodeId = computed<string | null>(() => {
    const remembered = this.lastFocusedNodeId();
    if (remembered && this.navigationService.isInTabOrder(remembered)) return remembered;
    return this.navigationService.visibleTreeOrder().at(0) ?? null;
  });

  handleNodeFocus(nodeId: string, from: EventTarget | null): void {
    this.lastFocusedNodeId.set(nodeId);
    if (isInsideRegion(from, this.regions.diagram)) return;
    this.nodeVisibilityService.ensureVisible(nodeId);
  }

  /**
   * Reacts to focus landing anywhere on the page: tracks which node contains focus, and
   * drops the remembered node once focus leaves the diagram and its properties panel.
   */
  handlePageFocusIn(target: EventTarget | null): void {
    const focus = resolveDiagramFocus(target);
    this.nodeWithFocus.set(this.resolveContainment(focus));
    if (isInsideRegion(target, this.retainingSelector)) return;
    this.lastFocusedNodeId.set(null);
  }

  handlePagePointerDown(target: EventTarget | null): void {
    this.lastInputWasPointer = true;
    if (resolveDiagramFocus(target).level !== 'surface') return;
    this.releaseFocusedNode();
  }

  /** The node keeps the focus after a key press, so `Enter` can reach its buttons. */
  handlePageKeyDown(target: EventTarget | null): void {
    this.lastInputWasPointer = false;
    const focus = resolveDiagramFocus(target);
    if (focus.level === 'surface') return;
    this.nodeWithFocus.set(focus.nodeId);
  }

  /**
   * Brings a node into view and focuses it on the app's behalf. Not a pointer press, so the node
   * counts as containing the focus.
   */
  focusNode(nodeId: string): void {
    this.lastInputWasPointer = false;
    this.nodeVisibilityService.ensureVisible(nodeId);
    this.nodeFocusService.focus(nodeId);
  }

  /** ng-diagram prevents the default blur on a press on the canvas. Blur the node host. */
  private releaseFocusedNode(): void {
    this.nodeWithFocus.set(null);
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.closest(NODE_HOST_SELECTOR)) {
      focused.blur();
    }
  }

  /** Clears the focus-containment state when focus is lost to the document body. */
  handlePageFocusOut(relatedTarget: EventTarget | null): void {
    if (relatedTarget !== null) return;
    requestAnimationFrame(() => {
      if (!document.hasFocus()) return;
      if (document.activeElement !== document.body) return;
      this.nodeWithFocus.set(null);
    });
  }

  /**
   * Focus on a button always counts. The buttons must stay in the DOM while they have the
   * focus. Focus on the host counts only after keyboard input, because a pointer press
   * gives the host the focus and no later event removes it.
   */
  private resolveContainment(focus: DiagramFocus): string | null {
    if (focus.level === 'surface') return null;
    if (focus.level === 'node' && this.lastInputWasPointer) return null;
    return focus.nodeId;
  }

  setFallbackTarget(element: HTMLElement | null): void {
    this.fallbackTarget = element;
  }

  get diagramSurface(): HTMLElement | null {
    return this.fallbackTarget;
  }

  /** With no node to focus, the focus goes to the diagram and not to `document.body`. */
  focusEntryNode(): void {
    const nodeId = this.entryNodeId();
    if (!nodeId) {
      this.fallbackTarget?.focus({ preventScroll: true });
      return;
    }
    this.focusNode(nodeId);
  }

  recoverFocusIfLost(): void {
    requestAnimationFrame(() => {
      if (document.activeElement !== document.body) return;
      if (this.lastFocusedNodeId() === null) return;
      this.focusEntryNode();
    });
  }
}
