import { PRIMARY_MODIFIER_KEY_LABEL as MOD } from '../shared/platform';

export type KeyCombo = readonly string[];

export interface ShortcutRow {
  /** Different key combinations that do the same action. */
  readonly combos: readonly KeyCombo[];
  readonly action: string;
}

export const KEYBOARD_SHORTCUTS_TITLE = 'Keyboard shortcuts';

export const KEYBOARD_SHORTCUTS_HOTKEY = '?';

/**
 * With their default settings, screen readers do not read most punctuation marks. The user then
 * hears no text for a cell that contains only `-`.
 */
const SPOKEN_KEYS: Readonly<Record<string, string>> = {
  '=': 'Equals',
  '-': 'Minus',
  '?': 'Question mark',
};

export function spokenKey(glyph: string): string {
  return SPOKEN_KEYS[glyph] ?? glyph;
}

export const SHORTCUTS: readonly ShortcutRow[] = [
  { combos: [['Tab']], action: 'Go to next node' },
  { combos: [['Shift', 'Tab']], action: 'Go to previous node' },
  { combos: [['arrow keys'], ['Shift', 'arrow keys']], action: 'Go to nearby node' },
  { combos: [['Enter']], action: 'Select node and go to its buttons' },
  { combos: [['arrow keys']], action: 'Go to next node button, while a button has focus' },
  { combos: [['Escape']], action: 'Leave node buttons, or clear the selection' },
  { combos: [['Space']], action: 'Expand or collapse node' },
  { combos: [[MOD, 'Enter']], action: 'Open properties panel' },
  {
    combos: [['arrow keys']],
    action: 'Pan the chart, while no node has focus and nothing is selected',
  },
  {
    combos: [['Delete'], ['Backspace']],
    action: 'Delete node that has focus, after a confirmation',
  },
  { combos: [[MOD, 'A']], action: 'Select all nodes' },
  { combos: [[MOD, 'C']], action: 'Copy node' },
  { combos: [[MOD, 'X']], action: 'Cut node' },
  { combos: [[MOD, 'V']], action: 'Paste node' },
  { combos: [['=']], action: 'Zoom in' },
  { combos: [['-']], action: 'Zoom out' },
  {
    combos: [[KEYBOARD_SHORTCUTS_HOTKEY]],
    action: 'Show keyboard shortcuts, except while moving a colleague',
  },
  {
    combos: [['Tab'], ['Shift', 'Tab']],
    action: 'While moving a colleague: step through the colleagues, then through their positions',
  },
  {
    combos: [['arrow keys']],
    action: 'While moving a colleague: go to a nearby colleague or position',
  },
  {
    combos: [['Enter']],
    action: 'While moving a colleague: choose the colleague, then confirm the position',
  },
  {
    combos: [['Escape']],
    action: 'While moving a colleague: go back to choosing a colleague, then leave the move',
  },
];
