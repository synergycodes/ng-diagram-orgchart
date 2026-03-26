import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import {
  SelectDropdownNullOptionDef,
  SelectDropdownOptionDef,
} from './select-dropdown-option.directive';

let nextId = 0;

export interface SelectDropdownOption<SelectDropdownOptionValue = unknown> {
  value: SelectDropdownOptionValue;
  label: string;
  data?: unknown;
}

type DropdownItem<DropdownItemValue> =
  | { type: 'null'; value: null }
  | { type: 'option'; value: DropdownItemValue; option: SelectDropdownOption<DropdownItemValue> };

@Component({
  selector: 'app-select-dropdown',
  imports: [NgTemplateOutlet],
  templateUrl: './select-dropdown.component.html',
  styleUrl: './select-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDropdownComponent<
  SelectDropdownOptionValue = unknown,
> implements FormValueControl<SelectDropdownOptionValue | null> {
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uid = nextId++;

  options = input.required<SelectDropdownOption<SelectDropdownOptionValue>[]>();
  placeholder = input('Select...');
  triggerId = input<string>();

  protected readonly optionTpl = contentChild(SelectDropdownOptionDef);
  protected readonly nullOptionTpl = contentChild(SelectDropdownNullOptionDef);
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('optionEl');

  protected readonly isOpen = signal(false);
  readonly value = model<SelectDropdownOptionValue | null>(null);
  protected readonly focusedIndex = signal(-1);

  protected readonly listboxId = computed(() => this.triggerId() ?? `sd-${this.uid}`);
  protected readonly allOptions = computed<DropdownItem<SelectDropdownOptionValue>[]>(() => [
    { type: 'null', value: null },
    ...this.options().map((option) => ({
      type: 'option' as const,
      value: option.value,
      option: option,
    })),
  ]);

  protected readonly activeDescendantId = computed(() => {
    const idx = this.focusedIndex();
    return this.isOpen() && idx >= 0 ? this.optionId(idx) : null;
  });

  protected readonly selectedOption = computed(() => {
    const value = this.value();
    if (value == null) return null;
    return this.options().find((o) => o.value === value) ?? null;
  });

  private removeDocumentClick: (() => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.removeDocumentClick?.());
  }

  protected optionId(index: number): string {
    return `${this.listboxId()}-opt-${index}`;
  }

  protected panelId(): string {
    return `${this.listboxId()}-listbox`;
  }

  protected isSelected(item: DropdownItem<SelectDropdownOptionValue>): boolean {
    return item.value === this.value();
  }

  protected toggleOpen(): void {
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  protected select(item: DropdownItem<SelectDropdownOptionValue>): void {
    this.value.set(item.value);
    this.closePanel();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.closePanel();
      return;
    }

    if (!this.isOpen()) {
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }

    event.preventDefault();

    switch (event.key) {
      case 'ArrowDown':
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        this.moveFocus(-1);
        break;
      case 'Home':
        this.moveFocusTo(0);
        break;
      case 'End':
        this.moveFocusTo(this.allOptions().length - 1);
        break;
      case 'Enter':
      case ' ':
        this.selectFocused();
        break;
      case 'Escape':
        this.closePanel();
        break;
    }
  }

  private openPanel(): void {
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
    const index = this.allOptions().findIndex((item) => item.value === value);
    this.focusedIndex.set(index === -1 ? 0 : index);
    this.scrollFocusedIntoView();
  }

  private moveFocus(delta: number): void {
    this.moveFocusTo(this.focusedIndex() + delta);
  }

  private moveFocusTo(index: number): void {
    const optionsLength = this.allOptions().length;
    this.focusedIndex.set(Math.max(0, Math.min(index, optionsLength - 1)));
    this.scrollFocusedIntoView();
  }

  private scrollFocusedIntoView(): void {
    requestAnimationFrame(() => {
      this.optionElements()[this.focusedIndex()]?.nativeElement.scrollIntoView({
        block: 'nearest',
      });
    });
  }

  private selectFocused(): void {
    const item = this.allOptions()[this.focusedIndex()];
    this.select(item);
  }
}
