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
import { NgDiagramModelService, type Node } from 'ng-diagram';
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
  private readonly modelService = inject(NgDiagramModelService);
  private readonly destroyRef = inject(DestroyRef);

  node = input.required<Node<OrgChartNodeData>>();
  triggerId = input<string>();

  protected readonly innerControl = new FormControl<string | null>(null);

  protected readonly candidates = computed<SelectDropdownOption<string>[]>(() => {
    const currentNode = this.node();
    const nodes = this.modelService.nodes();

    return nodes
      .filter((n) => n.id !== currentNode.id && (n.data as OrgChartNodeData).fullName)
      .map((n) => {
        const data = n.data as OrgChartNodeData;
        return {
          value: n.id,
          label: data.fullName!,
          data: { color: data.color ?? '#999' },
        };
      });
  });

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
}
