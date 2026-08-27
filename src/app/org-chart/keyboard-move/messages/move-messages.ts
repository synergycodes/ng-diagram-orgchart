import type { DropZone } from '../../drag-reorder/zone-detection/index';

/** A node as a move message names it. */
export interface MoveSubject {
  readonly name: string | null;
  readonly role: string | null;
}

export function moveSubjectName(subject: MoveSubject): string {
  if (subject.name) return subject.name;
  return subject.role ? `Vacant position, ${subject.role}` : 'Vacant position';
}

/**
 * The position clause of a move message, for example `after Peter Parker`.
 *
 * Semantic words only. Which side of a card means the earlier sibling flips with the layout
 * direction, so `left` and `bottom` would be wrong half of the time.
 */
export function movePositionPhrase(target: string, side: DropZone): string {
  switch (side) {
    case 'left':
      return `before ${target}`;
    case 'right':
      return `after ${target}`;
    case 'bottom':
      return `under ${target}`;
  }
}

/** The first phase, where a colleague is chosen but not yet a position at them. */
export function moveNodePickedMessage(moving: string, target: string): string {
  return `Moving ${moving} — at ${target}. Press Enter to choose a position.`;
}

/**
 * `newManager` is named only when the position also changes who the node reports to. In an org
 * chart that is the consequential part of the move, so the preview states it before the user
 * commits, not after.
 */
export function movePreviewMessage(
  moving: string,
  target: string,
  side: DropZone,
  newManager: string | null,
): string {
  const manager = newManager ? ` Reporting to ${newManager}.` : '';
  return `Moving ${moving} — ${movePositionPhrase(target, side)}.${manager}`;
}

export function moveCommitMessage(
  moving: string,
  target: string,
  side: DropZone,
  newManager: string | null,
): string {
  const manager = newManager ? ` Now reporting to ${newManager}.` : '';
  return `Moved ${moving} ${movePositionPhrase(target, side)}.${manager}`;
}

export function moveCancelMessage(moving: string): string {
  return `Move cancelled. ${moving} was not moved.`;
}

export function moveNowhereMessage(moving: string): string {
  return `${moving} cannot be moved — there is no other position for it in the chart.`;
}

/** The layout was still running when the mode was asked to start, so it did not start. */
export function moveBusyAtStartMessage(): string {
  return 'The chart is still updating. Try again in a moment.';
}

/** The layout was still running when a position was confirmed. The mode stays open. */
export function moveBusyAtConfirmMessage(): string {
  return 'The chart is still updating. Press Enter again to confirm.';
}

export function moveStaleMessage(moving: string): string {
  return `The chart changed. Move cancelled — ${moving} was not moved.`;
}

export function moveFailedMessage(moving: string): string {
  return `${moving} could not be moved. Nothing changed.`;
}
