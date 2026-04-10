import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import {
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
  type OrgChartRole,
} from '../../../diagram/model/interfaces';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '../../../shared/combobox/combobox.component';
import { AutofocusDirective } from '../../../shared/autofocus/autofocus.directive';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';
import { nodeDataToFormData } from './sidebar-form.mappers';
import { SidebarFormService } from './sidebar-form.service';

@Component({
  selector: 'app-sidebar-form',
  imports: [FormField, FormFieldComponent, ReportsToFieldComponent, ComboboxComponent, AutofocusDirective],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly formService = inject(SidebarFormService);

  readonly nodeId = input.required<string>();
  readonly nodeData = input.required<OrgChartNodeData>();
  readonly nodeParentId = input.required<string | null>();
  readonly reportsToCandidateNodes = input.required<Node<OrgChartOccupiedNodeData>[]>();
  readonly roleOptions = input.required<ComboboxOption<OrgChartRole>[]>();

  protected readonly fieldTree = this.formService.fieldTree;

  constructor() {
    this.syncFormWithInputs();

    inject(DestroyRef).onDestroy(() => {
      this.formService.flush();
    });
  }

  private syncFormWithInputs(): void {
    effect(() => {
      const nodeId = this.nodeId();
      const nodeData = this.nodeData();
      const parentId = this.nodeParentId();

      untracked(() => {
        const formData = nodeDataToFormData(nodeData, parentId);
        this.formService.loadFormData(nodeId, formData);
      });
    });
  }}
