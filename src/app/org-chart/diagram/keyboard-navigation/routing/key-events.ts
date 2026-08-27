/** Library shortcuts a move in progress must not let through: cut, paste, select all, undo, redo. */
const DISRUPTIVE_LIBRARY_KEYS = new Set(['x', 'v', 'a', 'z', 'y']);

/** `Ctrl` on Windows and Linux, `Cmd` on macOS. */
function hasPrimaryModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

export function isDeleteKey(event: KeyboardEvent): boolean {
  return event.key === 'Delete' || event.key === 'Backspace';
}

export function isModifierEnter(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && hasPrimaryModifier(event);
}

export function isDisruptiveLibraryShortcut(event: KeyboardEvent): boolean {
  return hasPrimaryModifier(event) && DISRUPTIVE_LIBRARY_KEYS.has(event.key.toLowerCase());
}

export function swallow(event: KeyboardEvent): void {
  event.preventDefault();
}

/** Also keeps the key from reaching the library's own document listener. */
export function swallowFromLibrary(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
