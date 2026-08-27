import type { AddNodeAction } from '../../model/add-node.service';

/** The node's own action buttons, in the order keyboard focus visits them. */
const NODE_ACTION_ORDER = [
  'child',
  'siblingBefore',
  'siblingAfter',
  'move',
  'toggleExpand',
] as const;

export type NodeActionName = AddNodeAction | 'move' | 'toggleExpand';

const NODE_ACTION_SELECTOR = '[data-node-action]';

/**
 * `animate.leave` in add-button.component.html keeps a button in the DOM while it fades
 * out; such a button must never become a focus target.
 */
const FOCUSABLE_NODE_ACTION_SELECTOR = `${NODE_ACTION_SELECTOR}:not(.add-btn--leaving)`;

/** The action button an event came from, or `null` when it came from elsewhere. */
export function resolveNodeAction(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(NODE_ACTION_SELECTOR) : null;
}

/** The node's currently rendered action buttons, in keyboard order. */
export function getNodeActions(host: HTMLElement): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>(FOCUSABLE_NODE_ACTION_SELECTOR)].sort(
    (a, b) => actionRank(a) - actionRank(b),
  );
}

/** Focuses the node's first action button, if it has one. */
export function focusFirstNodeAction(host: HTMLElement): void {
  getNodeActions(host).at(0)?.focus({ preventScroll: true });
}

function actionRank(element: HTMLElement): number {
  return NODE_ACTION_ORDER.indexOf(element.dataset['nodeAction'] as NodeActionName);
}
