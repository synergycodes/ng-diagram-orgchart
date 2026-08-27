import { resolveNodeAction } from './node-actions';

export const NODE_HOST_SELECTOR = '[data-org-node-id]';

export interface NodeFocusContext {
  readonly nodeId: string;
  readonly host: HTMLElement;
}

export interface FocusedNode extends NodeFocusContext {
  readonly level: 'node';
}

/** Focus is on one of the node's own action buttons. */
export interface FocusedNodeAction extends NodeFocusContext {
  readonly level: 'nodeAction';
  readonly action: HTMLElement;
}

export type DiagramFocus = { readonly level: 'surface' } | FocusedNode | FocusedNodeAction;

/**
 * Resolves which diagram focus level an event came from.
 *
 * Anything inside a node host resolves to that node's level: one of the node's
 * own action buttons is `nodeAction`, anything else within the host is `node`.
 * Anything outside a node host is the `surface`.
 */
export function resolveDiagramFocus(target: EventTarget | null): DiagramFocus {
  const host = target instanceof Element ? target.closest<HTMLElement>(NODE_HOST_SELECTOR) : null;
  const nodeId = host?.dataset['orgNodeId'];
  if (!host || !nodeId) return { level: 'surface' };
  const action = resolveNodeAction(target);
  return action ? { level: 'nodeAction', nodeId, host, action } : { level: 'node', nodeId, host };
}

/** The rendered host element for a node id, or `null` when the node is not in the DOM. */
export function findNodeHost(nodeId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-org-node-id="${nodeId}"]`);
}

/** Whether the target lies inside the region the selector names. */
export function isInsideRegion(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}
