import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  type ControlValueAccessor,
} from '@angular/forms';
import { type Node } from 'ng-diagram';
import { type OrgChartNodeData } from '../../../diagram/interfaces';
import { InitialsAvatarComponent } from '../../../shared/initials-avatar/initials-avatar.component';
import {
  SelectDropdownNullOptionDef,
  SelectDropdownOptionDef,
} from '../../../shared/select-dropdown/select-dropdown-option.directive';
import {
  SelectDropdownComponent,
  type SelectDropdownOption,
} from '../../../shared/select-dropdown/select-dropdown.component';

@Component({
  selector: 'app-reports-to-field',
  imports: [
    ReactiveFormsModule,
    SelectDropdownComponent,
    SelectDropdownOptionDef,
    SelectDropdownNullOptionDef,
    InitialsAvatarComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReportsToFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-to-field.component.html',
  styleUrl: './reports-to-field.component.scss',
})
export class ReportsToFieldComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  candidateNodes = input.required<Node<OrgChartNodeData>[]>();
  triggerId = input<string>();

  protected readonly innerControl = new FormControl<string | null>(null);

  protected readonly candidates = computed<SelectDropdownOption<string>[]>(() =>
    this.candidateNodes().map(this.mapNodeToOption),
  );

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this.innerControl.setValue(val, { emitEvent: false });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
    this.innerControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.innerControl.disable() : this.innerControl.enable();
  }

  private mapNodeToOption = (node: Node<OrgChartNodeData>): SelectDropdownOption<string> => ({
    value: node.id,
    label: node.data.fullName!,
    data: { color: node.data.color ?? '#999' },
  });
}
