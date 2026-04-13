import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import { type OrgChartOccupiedNodeData, getColorForRole } from '../../../diagram/model/interfaces';
import {
  ComboboxNullOptionDef,
  ComboboxOptionDef,
  ComboboxPrefixDef,
} from '../../../shared/combobox/combobox-option.directive';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '../../../shared/combobox/combobox.component';
import { InitialsAvatarComponent } from '../../../shared/initials-avatar/initials-avatar.component';

@Component({
  selector: 'app-reports-to-field',
  imports: [
    ComboboxComponent,
    ComboboxOptionDef,
    ComboboxNullOptionDef,
    ComboboxPrefixDef,
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

  protected readonly candidates = computed<ComboboxOption<string>[]>(() =>
    this.candidateNodes()
      .map(this.mapNodeToOption)
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  private mapNodeToOption = (node: Node<OrgChartOccupiedNodeData>): ComboboxOption<string> => ({
    value: node.id,
    label: node.data.fullName,
    data: { color: getColorForRole(node.data.role) },
  });
}
