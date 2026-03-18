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
export class SelectDropdownComponent implements ControlValueAccessor {
  private readonly elRef = inject(ElementRef);

  options = input.required<SelectDropdownOption[]>();
  placeholder = input('Select...');

  protected readonly optionTpl = contentChild(SelectDropdownOptionDef);
  protected readonly nullOptionTpl = contentChild(SelectDropdownNullOptionDef);

  protected readonly isOpen = signal(false);
  protected readonly value = signal<any>(null);

  protected readonly selectedOption = computed(() => {
    const v = this.value();
    if (v == null) return null;
    return this.options().find((o) => o.value === v) ?? null;
  });

  private onChange: (value: SelectDropdownOption['value']) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: SelectDropdownOption['value']): void {
    this.value.set(value ?? null);
  }

  registerOnChange(onChange: (value: SelectDropdownOption['value']) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  protected toggleOpen(): void {
    this.isOpen.update((value) => !value);
  }

  protected select(option: SelectDropdownOption | null): void {
    const newValue = option?.value ?? null;
    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
