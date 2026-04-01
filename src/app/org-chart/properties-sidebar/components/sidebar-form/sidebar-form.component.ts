import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import {
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
  type OrgChartRole,
} from '../../../diagram/interfaces';
import {
  SelectDropdownComponent,
  type SelectDropdownOption,
} from '../../../shared/select-dropdown/select-dropdown.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';
import { nodeDataToFormData } from './sidebar-form.mappers';
import { SidebarFormService } from './sidebar-form.service';

@Component({
  selector: 'app-sidebar-form',
  imports: [FormField, FormFieldComponent, ReportsToFieldComponent, SelectDropdownComponent],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly formService = inject(SidebarFormService);
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly injector = inject(Injector);

  readonly nodeId = input.required<string>();
  readonly nodeData = input.required<OrgChartNodeData>();
  readonly nodeParentId = input.required<string | null>();
  readonly reportsToCandidateNodes = input.required<Node<OrgChartOccupiedNodeData>[]>();
  readonly roleOptions = input.required<SelectDropdownOption<OrgChartRole>[]>();

  protected readonly fieldTree = this.formService.fieldTree;

  constructor() {
    this.syncFormWithInputs();
    this.focusOnNodeChange();

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
  }

  private focusOnNodeChange(): void {
    effect(() => {
      this.nodeId();
      untracked(() => {
        afterNextRender(() => this.focusFirstControl(), { injector: this.injector });
      });
    });
  }

  private focusFirstControl(): void {
    const focusable: HTMLElement | null = this.el.querySelector(
      'input, textarea, select, [tabindex]',
    );
    focusable?.focus();
  }
}
