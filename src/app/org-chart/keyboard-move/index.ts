/**
 * The slice's public face. Code inside `keyboard-move/` must import by direct path instead, or
 * `move-mode.service.ts` and this file form a cycle.
 */
export { provideKeyboardMove } from './keyboard-move.providers';
export { MoveModeService } from './move-mode.service';
export { MoveModeStatusComponent } from './status-card/move-mode-status.component';
