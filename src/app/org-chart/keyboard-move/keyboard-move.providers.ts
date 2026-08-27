import { type Provider } from '@angular/core';
import { MoveCandidatesService } from './candidates/move-candidates.service';
import { MoveMessageFactory } from './messages/move-message.factory';
import { MOVE_RESULT_VISIBLE_MS, MoveModeService } from './move-mode.service';

/**
 * Add these providers at one location only. The node's move button, the keyboard service and the
 * status card must all reach one instance.
 *
 * They belong on `DiagramComponent`, because `MoveModeService` needs `DropService` and injectors
 * resolve upward only.
 *
 * @param resultVisibleMs How long a finished move stays named on screen. The default is long enough
 * to read the sentence, and short enough that the card stops naming a move the chart has moved on
 * from.
 */
export function provideKeyboardMove(resultVisibleMs = 6000): Provider[] {
  return [
    MoveCandidatesService,
    MoveMessageFactory,
    MoveModeService,
    { provide: MOVE_RESULT_VISIBLE_MS, useValue: resultVisibleMs },
  ];
}
