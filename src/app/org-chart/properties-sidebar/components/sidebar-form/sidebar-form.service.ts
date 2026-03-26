import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { debounce, form } from '@angular/forms/signals';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../../../diagram/guards';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import {
  EMPTY_FORM,
  formDataToNodeData,
  nodeDataToFormData,
  type SidebarFormData,
} from './sidebar-form.mappers';

const DEBOUNCE_TIME_MS = 300;
const DEBOUNCED_FIELDS: (keyof SidebarFormData)[] = ['fullName', 'description'];

@Injectable()
export class SidebarFormService {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);

  readonly formModel = signal<SidebarFormData>({ ...EMPTY_FORM });

  readonly fieldTree = form(this.formModel, (schemaPath) => {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      debounce(schemaPath[fieldName], DEBOUNCE_TIME_MS);
    });
  });

  private currentNodeId: string | null = null;

  constructor() {
    this.syncFormWithSelectedNode();
    this.enableAutoSave();
    inject(DestroyRef).onDestroy(() => this.flushDebouncedFields());
  }

  private syncFormWithSelectedNode(): void {
    effect(() => {
      const node = this.sidebarService.selectedNode();
      untracked(() => {
        if (node?.id === this.currentNodeId) {
          return;
        }

        this.flushDebouncedFields();
        queueMicrotask(() => {
          this.saveFormToNode();
          this.currentNodeId = node?.id ?? null;
          this.formModel.set(node ? nodeDataToFormData(node.data) : { ...EMPTY_FORM });
        });
      });
    });
  }

  private flushDebouncedFields(): void {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      this.fieldTree[fieldName]().markAsTouched();
    });
  }

  private enableAutoSave(): void {
    effect(() => {
      this.formModel();

      untracked(() => {
        if (this.fieldTree().dirty()) {
          this.saveFormToNode();
        }
      });
    });
  }

  private saveFormToNode(): void {
    const nodeId = this.currentNodeId;
    if (!nodeId) return;

    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    const updatedData = formDataToNodeData(this.formModel(), node.data);
    this.sidebarService.updateNodeData(nodeId, updatedData);
  }
}
