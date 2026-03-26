import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { form } from '@angular/forms/signals';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNodeData } from '../../../diagram/guards';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { EMPTY_FORM, formDataToNodeData, nodeDataToFormData, type SidebarFormData } from './sidebar-form.mappers';

@Injectable()
export class SidebarFormService {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);

  readonly formModel = signal<SidebarFormData>({ ...EMPTY_FORM });
  readonly fieldTree = form(this.formModel);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentNodeId: string | null = null;

  constructor() {
    this.syncFormWithSelectedNode();
    this.enableAutoSave();
    inject(DestroyRef).onDestroy(() => this.flushPendingSave());
  }

  private syncFormWithSelectedNode(): void {
    effect(() => {
      const node = this.sidebarService.selectedNode();
      untracked(() => {
        if (node?.id === this.currentNodeId) {
          return;
        }

        this.flushPendingSave();
        this.currentNodeId = node?.id ?? null;
        this.formModel.set(node ? nodeDataToFormData(node.data) : { ...EMPTY_FORM });
      });
    });
  }

  private enableAutoSave(): void {
    effect(() => {
      this.formModel();
      if (this.fieldTree().dirty()) {
        untracked(() => this.debounceSave());
      }
    });
  }

  private flushPendingSave(): void {
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
    const nodeId = this.currentNodeId;
    if (!nodeId) return;

    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    const updatedData = formDataToNodeData(this.formModel(), node.data);
    this.sidebarService.updateNodeData(nodeId, updatedData);
  }
}
