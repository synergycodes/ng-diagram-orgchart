import type { DropZone } from '../../drag-reorder/zone-detection/index';

/**
 * One position the moved node can occupy: a target node plus the side of it to take.
 *
 * The same pair the pointer path drops on. Two pairs at different nodes can produce one outcome —
 * after `B` and before `C` reorder the same way — but the second phase offers the sides of a
 * single card, so a duplicate is never reachable from the pair it duplicates.
 */
export interface MoveCandidate {
  /** The node whose handle represents this position. */
  readonly nodeId: string;
  /** How the position is encoded for `DropService.dropNode`. */
  readonly side: DropZone;
  /** The parent the moved node ends up under. Equals `nodeId` when `side` is `bottom`. */
  readonly parentId: string;
}

export interface MoveCandidates {
  /** Step order: nodes in visible tree order, sides in drop-zone order within each node. */
  readonly all: readonly MoveCandidate[];
  /** The nodes that offer at least one position, in the order the first phase steps them. */
  readonly nodeIds: readonly string[];
  /** Every position a given node offers, in side order. Between one and three. */
  readonly byNodeId: ReadonlyMap<string, readonly MoveCandidate[]>;
}

/** A handle the template draws. Only the node being chosen at draws any. */
export interface MoveHandle {
  readonly nodeId: string;
  readonly side: DropZone;
  /** The position `Enter` commits. */
  readonly current: boolean;
}

/** Groups the positions by the node whose handle shows them, keeping step order. */
export function groupCandidatesByNode(all: readonly MoveCandidate[]): {
  nodeIds: string[];
  byNodeId: ReadonlyMap<string, readonly MoveCandidate[]>;
} {
  const byNodeId = new Map<string, MoveCandidate[]>();
  const nodeIds: string[] = [];

  for (const candidate of all) {
    const existing = byNodeId.get(candidate.nodeId);
    if (existing) {
      existing.push(candidate);
      continue;
    }
    byNodeId.set(candidate.nodeId, [candidate]);
    nodeIds.push(candidate.nodeId);
  }

  return { nodeIds, byNodeId };
}

/** Steps an index through a list, wrapping at both ends. */
export function stepCandidateIndex(index: number, delta: number, length: number): number {
  return (index + delta + length) % length;
}

/**
 * The handles for the node a position is being chosen at. Only that node draws any, so the
 * choice is between sides of one card rather than between bars scattered over the chart.
 */
export function buildNodeHandles(
  candidates: readonly MoveCandidate[],
  currentIndex: number,
): MoveHandle[] {
  return candidates.map((candidate, index) => ({
    nodeId: candidate.nodeId,
    side: candidate.side,
    current: index === currentIndex,
  }));
}

/**
 * The child order a commit would produce, so a position that changes nothing can be refused.
 *
 * Mirrors how the sort-order service rebuilds a sibling list: the moved node is removed first,
 * then inserted at the reference slot.
 */
export function projectChildOrder(
  childIds: readonly string[],
  movingId: string,
  candidate: MoveCandidate,
): string[] {
  const remaining = childIds.filter((id) => id !== movingId);

  if (candidate.side === 'bottom') return [...remaining, movingId];

  const referenceIndex = remaining.indexOf(candidate.nodeId);
  if (referenceIndex < 0) return remaining;

  const insertAt = candidate.side === 'right' ? referenceIndex + 1 : referenceIndex;
  const projected = [...remaining];
  projected.splice(insertAt, 0, movingId);
  return projected;
}
