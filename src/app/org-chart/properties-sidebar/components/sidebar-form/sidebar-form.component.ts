import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgDiagramModelService } from 'ng-diagram';
import { OrgChartRole, type OrgChartNodeData } from '../../../diagram/interfaces';
import {
  SelectDropdownComponent,
  type SelectDropdownOption,
} from '../../../shared/select-dropdown/select-dropdown.component';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';

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
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly selectedNode = this.sidebarService.selectedNode;

  protected readonly roleOptions: SelectDropdownOption<OrgChartRole>[] = Object.values(
    OrgChartRole,
  ).map((role) => ({ value: role, label: role }));

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    role: new FormControl<OrgChartRole | null>(null),
    description: new FormControl('', { nonNullable: true }),
    reportsTo: new FormControl<string | null>(null),
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private previousNodeId: string | null = null;

  constructor() {
    toObservable(this.sidebarService.selectedNode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((node) => {
        this.flush();

        if (node) {
          this.previousNodeId = node.id;
          const data = node.data as OrgChartNodeData;
          this.form.patchValue(
            {
              fullName: data.fullName ?? '',
              role: data.role ?? null,
              description: data.description ?? '',
              reportsTo: data.reportsTo ?? null,
            },
            { emitEvent: false },
          );
        } else {
          this.previousNodeId = null;
        }
      });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.scheduleCommit();
    });

    this.destroyRef.onDestroy(() => this.flush());
  }

  flush(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.commitCurrentValues();
    }
  }

  private scheduleCommit(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.commitCurrentValues();
    }, 300);
  }

  private commitCurrentValues(): void {
    const nodeId = this.previousNodeId;
    if (!nodeId) return;

    const node = this.modelService.nodes().find((n) => n.id === nodeId);
    if (!node) return;

    const formValue = this.form.getRawValue();
    const currentData = node.data as OrgChartNodeData;

    this.sidebarService.updateNodeData(nodeId, {
      ...currentData,
      fullName: formValue.fullName || undefined,
      role: formValue.role ?? undefined,
      description: formValue.description || undefined,
      reportsTo: formValue.reportsTo ?? undefined,
    });
  }
}
