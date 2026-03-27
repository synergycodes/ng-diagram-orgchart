import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { debounce, form } from '@angular/forms/signals';
import { EMPTY_FORM, ON_FIELD_CHANGE, type SidebarFormData } from './sidebar-form.mappers';

const DEBOUNCE_TIME_MS = 300;
const DEBOUNCED_FIELDS: (keyof SidebarFormData)[] = ['fullName', 'description'];

@Injectable()
export class SidebarFormService {
  private readonly onFieldChange = inject(ON_FIELD_CHANGE);

  readonly formModel = signal<SidebarFormData>({ ...EMPTY_FORM });

  readonly fieldTree = form(this.formModel, (schemaPath) => {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      debounce(schemaPath[fieldName], DEBOUNCE_TIME_MS);
    });
  });

  private lastEmittedModel: SidebarFormData = { ...EMPTY_FORM };
  private currentNodeId: string | null = null;

  constructor() {
    this.watchForChanges();
  }

  loadFormData(nodeId: string, data: SidebarFormData): void {
    this.flush();

    const model = this.formModel();
    const diffs = this.getDiffs(model);
    this.emitChange(diffs, model);

    this.currentNodeId = nodeId;
    this.lastEmittedModel = { ...data };
    this.formModel.set(data);
    this.fieldTree().reset();
  }

  flush(): void {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      this.fieldTree[fieldName]().markAsTouched();
    });
  }

  private emitChange(diffs: (keyof SidebarFormData)[], formData: SidebarFormData): void {
    if (this.currentNodeId) {
      this.onFieldChange({ nodeId: this.currentNodeId, fields: diffs, formData });
    }
  }

  private watchForChanges(): void {
    effect(() => {
      const model = this.formModel();

      untracked(() => {
        if (this.fieldTree().dirty()) {
          const diffs = this.getDiffs(model);
          this.emitChange(diffs, model);
          this.lastEmittedModel = { ...model };
        }
      });
    });
  }

  private getDiffs(model: SidebarFormData): (keyof SidebarFormData)[] {
    return (Object.keys(model) as (keyof SidebarFormData)[]).filter(
      (key) => model[key] !== this.lastEmittedModel[key],
    );
  }
}
