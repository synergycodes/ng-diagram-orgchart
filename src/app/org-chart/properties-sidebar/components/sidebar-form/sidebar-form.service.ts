import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../../../diagram/guards';
import { OrgChartRole } from '../../../diagram/interfaces';
import { PropertiesSidebarService } from '../../properties-sidebar.service';

@Injectable()
export class SidebarFormService {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    role: new FormControl<OrgChartRole | null>(null),
    description: new FormControl('', { nonNullable: true }),
    reportsTo: new FormControl<string | null>(null),
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private previousNodeId: string | null = null;

  init(destroyRef: DestroyRef): void {
    toObservable(this.sidebarService.selectedNode)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((node) => {
        this.flush();

        if (node) {
          this.previousNodeId = node.id;
          if (!isOrgChartNodeData(node.data)) {
            return;
          }
          this.form.patchValue(
            {
              fullName: node.data.fullName ?? '',
              role: node.data.role ?? null,
              description: node.data.description ?? '',
              reportsTo: node.data.reportsTo ?? null,
            },
            { emitEvent: false },
          );
        } else {
          this.previousNodeId = null;
        }
      });

    this.form.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.scheduleCommit();
    });

    destroyRef.onDestroy(() => this.teardown());
  }

  teardown(): void {
    this.flush();
    this.previousNodeId = null;
    this.form.reset(
      { fullName: '', role: null, description: '', reportsTo: null },
      { emitEvent: false },
    );
  }

  private flush(): void {
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

    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    const formValue = this.form.getRawValue();

    this.sidebarService.updateNodeData(nodeId, {
      ...node.data,
      fullName: formValue.fullName || undefined,
      role: formValue.role ?? undefined,
      description: formValue.description || undefined,
      reportsTo: formValue.reportsTo ?? undefined,
    });
  }
}
