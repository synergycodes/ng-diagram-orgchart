const TEXT_ENTRY_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

export function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (TEXT_ENTRY_TAGS.includes(target.tagName) || target.isContentEditable)
  );
}
