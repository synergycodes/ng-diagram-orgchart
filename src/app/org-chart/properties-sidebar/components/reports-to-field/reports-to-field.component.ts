import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import { type OrgChartOccupiedNodeData } from '../../../diagram/interfaces';
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
    SelectDropdownComponent,
    SelectDropdownOptionDef,
    SelectDropdownNullOptionDef,
    InitialsAvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-to-field.component.html',
  styleUrl: './reports-to-field.component.scss',
})
export class ReportsToFieldComponent implements FormValueControl<string | null> {
  candidateNodes = input.required<Node<OrgChartOccupiedNodeData>[]>();
  triggerId = input<string>();

  readonly value = model<string | null>(null);

  protected readonly candidates = computed<SelectDropdownOption<string>[]>(() =>
    this.candidateNodes().map(this.mapNodeToOption).sort((a, b) => a.label.localeCompare(b.label)),
  );

  private mapNodeToOption = (
    node: Node<OrgChartOccupiedNodeData>,
  ): SelectDropdownOption<string> => ({
    value: node.id,
    label: node.data.fullName,
    data: { color: node.data.color ?? '#999' },
  });
}
