import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import {
  ComboboxNullOptionDef,
  ComboboxOptionDef,
  ComboboxPrefixDef,
} from './combobox-option.directive';

let nextId = 0;

const FILTER_DEBOUNCE_MS = 150;

/** A selectable option exposed to consumers of the combobox. */
export interface ComboboxOption<T = unknown> {
  value: T;
  label: string;
  data?: unknown;
}

/** Internal wrapper that adds a null-option alongside real options. */
type ComboboxItem<T> =
  | { type: 'null'; value: null }
  | { type: 'option'; value: T; option: ComboboxOption<T> };

/**
 * Filterable combobox with keyboard navigation and custom option templates.
 *
 * Supports a prefix template (e.g. avatar), a null option ("None"),
 * and custom option rendering via content-projected directives.
 */
@Component({
  selector: 'app-combobox',
  imports: [NgTemplateOutlet],
  templateUrl: './combobox.component.html',
  styleUrl: './combobox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboboxComponent<T = unknown> implements FormValueControl<T | null> {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uid = nextId++;

  options = input.required<ComboboxOption<T>[]>();
  placeholder = input('Select...');
  triggerId = input<string>();

  protected readonly optionTpl = contentChild(ComboboxOptionDef);
  protected readonly nullOptionTpl = contentChild(ComboboxNullOptionDef);
  protected readonly prefixTpl = contentChild(ComboboxPrefixDef);
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('optionEl');
  protected readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('comboboxInput');

  protected readonly isOpen = signal(false);
  readonly value = model<T | null>(null);
  protected readonly focusedIndex = signal(-1);
  protected readonly inputText = signal('');
  private readonly filterText = signal('');

  private filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private blurTimer: ReturnType<typeof setTimeout> | null = null;
  private removeDocumentClick: (() => void) | null = null;

  protected readonly listboxId = computed(() => this.triggerId() ?? `cb-${this.uid}`);

  protected readonly allOptions = computed<ComboboxItem<T>[]>(() => [
    { type: 'null', value: null },
    ...this.options().map((option) => ({
      type: 'option' as const,
      value: option.value,
      option: option,
    })),
  ]);

  protected readonly displayedOptions = computed<ComboboxItem<T>[]>(() => {
    const filter = this.filterText().toLowerCase();
    if (!filter) return this.allOptions();
    return this.allOptions().filter(
      (item) => item.type === 'option' && item.option.label.toLowerCase().includes(filter),
    );
  });

  protected readonly activeDescendantId = computed(() => {
    const idx = this.focusedIndex();
    return this.isOpen() && idx >= 0 ? this.optionId(idx) : null;
  });

  protected readonly selectedOption = computed(() => {
    const value = this.value();
    if (value == null) return null;
    return this.options().find((o) => o.value === value) ?? null;
  });

  /** Shows the prefix template only when the input text matches the selected option's label. */
  protected readonly prefixOption = computed(() => {
    const opt = this.selectedOption();
    if (!opt) return null;
    return this.inputText() === opt.label ? opt : null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.removeDocumentClick?.();
      if (this.filterDebounceTimer !== null) clearTimeout(this.filterDebounceTimer);
      if (this.blurTimer !== null) clearTimeout(this.blurTimer);
    });

    effect(() => {
      const opt = this.selectedOption();
      untracked(() => this.inputText.set(opt ? opt.label : ''));
    });
  }

  protected optionId(index: number): string {
    return `${this.listboxId()}-opt-${index}`;
  }

  protected panelId(): string {
    return `${this.listboxId()}-listbox`;
  }

  protected isSelected(item: ComboboxItem<T>): boolean {
    return item.value === this.value();
  }

  protected onTriggerClick(): void {
    this.inputEl()?.nativeElement.focus();
    if (!this.isOpen()) {
      this.openPanel();
    }
  }

  protected onChevronClick(): void {
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
      this.inputEl()?.nativeElement.focus();
    }
  }

  protected select(item: ComboboxItem<T>): void {
    this.value.set(item.value);
    this.inputText.set(item.type === 'option' ? item.option.label : '');
    this.closePanel();
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.inputText.set(raw);

    if (raw === '') {
      this.filterText.set('');
      this.focusedIndex.set(0);
      if (!this.isOpen()) {
        this.openPanel();
      }
      return;
    }

    if (!this.isOpen()) {
      this.openPanel();
    }

    if (this.filterDebounceTimer !== null) {
      clearTimeout(this.filterDebounceTimer);
    }
    this.filterDebounceTimer = setTimeout(() => {
      this.filterText.set(raw);
      const firstRealIndex = this.displayedOptions().findIndex((item) => item.type !== 'null');
      this.focusedIndex.set(firstRealIndex !== -1 ? firstRealIndex : 0);
      this.filterDebounceTimer = null;
    }, FILTER_DEBOUNCE_MS);
  }

  protected onBlur(): void {
    this.blurTimer = setTimeout(() => {
      this.blurTimer = null;
      if (this.isOpen()) {
        this.closePanel();
      } else {
        this.commitOrRevert();
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Tab':
        if (this.isOpen()) {
          this.closePanel();
        }
        return;

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closePanel();
          this.inputEl()?.nativeElement.focus();
        }
        return;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.moveFocus(1);
        }
        return;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.moveFocus(-1);
        }
        return;

      case 'Enter':
        if (this.isOpen()) {
          event.preventDefault();
          this.selectFocused();
        }
        return;
    }
  }

  private openPanel(): void {
    if (this.blurTimer !== null) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
    this.filterText.set('');
    this.isOpen.set(true);
    this.initFocusedIndex();
    this.removeDocumentClick?.();
    this.removeDocumentClick = this.listenForOutsideClicks();
  }

  private closePanel(): void {
    this.removeDocumentClick?.();
    this.removeDocumentClick = null;
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.filterText.set('');
    if (this.filterDebounceTimer !== null) {
      clearTimeout(this.filterDebounceTimer);
      this.filterDebounceTimer = null;
    }
    this.commitOrRevert();
  }

  /** If the user cleared the input, set value to null; otherwise restore the selected label. */
  private commitOrRevert(): void {
    if (this.inputText() === '') {
      this.value.set(null);
    }
    this.revertInputText();
  }

  /** Resets the input text to the selected option's label (direct DOM write needed when signal value is unchanged). */
  private revertInputText(): void {
    const opt = this.selectedOption();
    const display = opt ? opt.label : '';
    this.inputText.set(display);
    const el = this.inputEl()?.nativeElement;
    if (el) {
      el.value = display;
    }
  }

  private listenForOutsideClicks(): () => void {
    const handler = (event: MouseEvent) => {
      if (!this.elRef.nativeElement.contains(event.target)) {
        this.closePanel();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }

  private initFocusedIndex(): void {
    const value = this.value();
    const index = this.displayedOptions().findIndex((item) => item.value === value);
    this.focusedIndex.set(index === -1 ? 0 : index);
    this.scrollFocusedIntoView();
  }

  private moveFocus(delta: number): void {
    this.moveFocusTo(this.focusedIndex() + delta);
  }

  private moveFocusTo(index: number): void {
    const optionsLength = this.displayedOptions().length;
    this.focusedIndex.set(Math.max(0, Math.min(index, optionsLength - 1)));
    this.scrollFocusedIntoView();
  }

  private scrollFocusedIntoView(): void {
    requestAnimationFrame(() => {
      this.optionElements().at(this.focusedIndex())?.nativeElement.scrollIntoView({
        block: 'nearest',
      });
    });
  }

  private selectFocused(): void {
    const item = this.displayedOptions().at(this.focusedIndex());
    if (!item) {
      return;
    }
    this.select(item);
  }
}
