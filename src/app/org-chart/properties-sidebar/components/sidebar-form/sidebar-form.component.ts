import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { type Node } from 'ng-diagram';
import { type OrgChartOccupiedNodeData, type OrgChartRole } from '../../../diagram/interfaces';
import {
  SelectDropdownComponent,
  type SelectDropdownOption,
} from '../../../shared/select-dropdown/select-dropdown.component';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';
import { SidebarFormService } from './sidebar-form.service';

@Component({
  selector: 'app-sidebar-form',
  imports: [FormField, FormFieldComponent, ReportsToFieldComponent, SelectDropdownComponent],
  providers: [SidebarFormService],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly formService = inject(SidebarFormService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly injector = inject(Injector);

  private readonly selectedNodeId = computed(() => this.sidebarService.selectedNode()?.id);

  readonly reportsToCandidateNodes = input.required<Node<OrgChartOccupiedNodeData>[]>();
  readonly roleOptions = input.required<SelectDropdownOption<OrgChartRole>[]>();

  protected readonly fieldTree = this.formService.fieldTree;

  constructor() {
    this.focusOnNodeChange();
  }

  private focusOnNodeChange(): void {
    effect(() => {
      this.selectedNodeId();
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
