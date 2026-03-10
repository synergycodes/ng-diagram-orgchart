import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgDiagramModelService } from 'ng-diagram';
import { OrgChartRole, type OrgChartNodeData } from '../../../diagram/interfaces';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ReportsToFieldComponent } from '../reports-to-field/reports-to-field.component';

@Component({
  selector: 'app-sidebar-form',
  imports: [ReactiveFormsModule, FormFieldComponent, ReportsToFieldComponent],
  templateUrl: './sidebar-form.component.html',
  styleUrl: './sidebar-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarFormComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly selectedNode = this.sidebarService.selectedNode;
  protected readonly roles = Object.values(OrgChartRole);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    role: new FormControl<OrgChartRole | ''>('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private previousNodeId: string | null = null;

  constructor() {
    effect(() => {
      const node = this.sidebarService.selectedNode();

      untracked(() => {
        this.flush();

        if (node) {
          this.previousNodeId = node.id;
          const data = node.data as OrgChartNodeData;
          this.form.patchValue(
            {
              fullName: data.fullName ?? '',
              role: data.role ?? '',
              description: data.description ?? '',
            },
            { emitEvent: false },
          );
        } else {
          this.previousNodeId = null;
        }
      });
    });

    this.form.valueChanges.subscribe(() => {
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
      role: (formValue.role as OrgChartRole) || undefined,
      description: formValue.description || undefined,
    });
  }
}
