import {
  afterNextRender,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injectable,
  Injector,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private containerEl: HTMLElement | null = null;

  init(injector: Injector): void {
    this.syncFormWithSelectedNode(injector);
    this.enableAutoSave(injector);

    const containerElRef = injector.get(ElementRef<HTMLElement>);
    this.setupFocusManagement(containerElRef);

    const destroyRef = injector.get(DestroyRef);
    destroyRef.onDestroy(() => this.saveAndReset());
  }

  private syncFormWithSelectedNode(injector: Injector): void {
    effect(
      () => {
        const node = this.sidebarService.selectedNode();
        untracked(() => {
          if (node?.id === this.previousNodeId) {
            return;
          }

          this.commitPendingChanges();

          if (node) {
            this.previousNodeId = node.id;
            this.form.patchValue(
              {
                fullName: node.data.fullName ?? '',
                role: node.data.role ?? null,
                description: node.data.description ?? '',
                reportsTo: node.data.reportsTo ?? null,
              },
              { emitEvent: false },
            );
            queueMicrotask(() => this.focusFirstControl());
          } else {
            this.previousNodeId = null;
          }
        });
      },
      { injector },
    );
  }

  private enableAutoSave(injector: Injector): void {
    const formValue = toSignal(this.form.valueChanges, { injector });

    effect(
      () => {
        // Track value changes
        formValue();

        untracked(() => {
          this.debounceSave();
        });
      },
      { injector },
    );
  }

  private setupFocusManagement(containerElRef: ElementRef<HTMLElement>): void {
    afterNextRender(() => {
      this.containerEl = containerElRef.nativeElement;
      this.focusFirstControl();
    });
  }

  private saveAndReset(): void {
    this.commitPendingChanges();
    this.previousNodeId = null;
    this.containerEl = null;
    this.form.reset(
      { fullName: '', role: null, description: '', reportsTo: null },
      { emitEvent: false },
    );
  }

  private focusFirstControl(): void {
    if (!this.containerEl) return;
    const focusable = this.containerEl.querySelector<HTMLElement>(
      'input, textarea, select, [tabindex]',
    );
    focusable?.focus();
  }

  private commitPendingChanges(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.saveFormToNode();
    }
  }

  private debounceSave(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.saveFormToNode();
    }, 300);
  }

  private saveFormToNode(): void {
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
