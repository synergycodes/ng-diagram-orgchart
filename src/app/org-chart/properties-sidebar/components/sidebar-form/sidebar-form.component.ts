import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { type Node } from 'ng-diagram';
import { type OrgChartNodeData, type OrgChartRole } from '../../../diagram/interfaces';
import {
  SelectDropdownComponent,
  type SelectDropdownOption,
} from '../../../shared/select-dropdown/select-dropdown.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';
import { SidebarFormService } from './sidebar-form.service';

@Component({
  selector: 'app-sidebar-form',
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    ReportsToFieldComponent,
    SelectDropdownComponent,
  ],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly formService = inject(SidebarFormService);

  readonly reportsToCandidateNodes = input.required<Node<OrgChartNodeData>[]>();
  readonly roleOptions = input.required<SelectDropdownOption<OrgChartRole>[]>();

  protected readonly form = this.formService.form;

  constructor() {
    this.formService.init(inject(DestroyRef), inject(ElementRef<HTMLElement>));
  }
}
