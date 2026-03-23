import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  SelectDropdownNullOptionDef,
  SelectDropdownOptionDef,
} from './select-dropdown-option.directive';

export interface SelectDropdownOption<SelectDropdownOptionValue = unknown> {
  value: SelectDropdownOptionValue;
  label: string;
  data?: unknown;
}

@Component({
  selector: 'app-select-dropdown',
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDropdownComponent),
      multi: true,
    },
  ],
  templateUrl: './select-dropdown.component.html',
  styleUrl: './select-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SelectDropdownComponent<
  SelectDropdownOptionValue = unknown,
> implements ControlValueAccessor {
  private readonly elRef = inject(ElementRef);

  options = input.required<SelectDropdownOption<SelectDropdownOptionValue>[]>();
  placeholder = input('Select...');
  triggerId = input<string>();

  protected readonly optionTpl = contentChild(SelectDropdownOptionDef);
  protected readonly nullOptionTpl = contentChild(SelectDropdownNullOptionDef);
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('optionEl');

  protected readonly isOpen = signal(false);
  protected readonly disabled = signal(false);
  protected readonly value = signal<SelectDropdownOptionValue | null>(null);
  protected readonly focusedIndex = signal(-1);

  protected readonly selectedOption = computed(() => {
    const value = this.value();
    if (value == null) return null;
    return this.options().find((o) => o.value === value) ?? null;
  });

  private onChange: (value: SelectDropdownOptionValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: SelectDropdownOptionValue | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(onChange: (value: SelectDropdownOptionValue | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closePanel();
    }
  }

  protected toggleOpen(): void {
    if (this.disabled()) return;
    this.isOpen.update((value) => {
      if (!value) {
        this.initFocusedIndex();
      }
      return !value;
    });
  }

  protected select(option: SelectDropdownOption<SelectDropdownOptionValue> | null): void {
    const newValue = option?.value ?? null;
    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.closePanel();
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.initFocusedIndex();
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
          this.isOpen.set(true);
          this.initFocusedIndex();
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

  private closePanel(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
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
