/** One row of a binding table: the key it answers to, and what it does with the focused thing. */
export interface KeyBinding<TFocus> {
  match(event: KeyboardEvent): boolean;
  run(event: KeyboardEvent, focus: TFocus): void | Promise<void>;
}
