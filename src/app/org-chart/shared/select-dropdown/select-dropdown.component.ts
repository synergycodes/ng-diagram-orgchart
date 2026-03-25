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
  readonly disabled = input(false);
  readonly value = model<SelectDropdownOptionValue | null>(null);
  protected readonly focusedIndex = signal(-1);

  protected readonly listboxId = computed(() => this.triggerId() ?? `sd-${this.uid}`);

  protected readonly activeDescendantId = computed(() => {
    const idx = this.focusedIndex();
    return this.isOpen() && idx >= 0 ? `${this.listboxId()}-opt-${idx}` : null;
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

  protected toggleOpen(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  protected select(option: SelectDropdownOption<SelectDropdownOptionValue> | null): void {
    this.value.set(option?.value ?? null);
    this.closePanel();
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.moveFocus(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveFocus(-1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openPanel();
        } else {
          this.selectFocused();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closePanel();
        break;
      case 'Tab':
        this.closePanel();
        break;
      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.focusedIndex.set(0);
          this.scrollFocusedIntoView();
        }
        break;
      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.focusedIndex.set(this.options().length);
          this.scrollFocusedIntoView();
        }
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
    if (value == null) {
      this.focusedIndex.set(0);
    } else {
      const index = this.options().findIndex((option) => option.value === value);
      this.focusedIndex.set(index === -1 ? 0 : index + 1);
    }
    this.scrollFocusedIntoView();
  }

  private moveFocus(delta: number): void {
    const total = this.options().length + 1; // +1 for null option
    const next = this.focusedIndex() + delta;
    this.focusedIndex.set(Math.max(0, Math.min(next, total - 1)));
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
    const index = this.focusedIndex();
    if (index === 0) {
      this.select(null);
    } else {
      const option = this.options()[index - 1];
      if (option) {
        this.select(option);
      }
    }
  }
}
