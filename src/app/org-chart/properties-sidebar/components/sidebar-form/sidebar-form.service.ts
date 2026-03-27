import { DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { debounce, form } from '@angular/forms/signals';
import { EMPTY_FORM, type SidebarFormData } from './sidebar-form.mappers';

const DEBOUNCE_TIME_MS = 300;
const DEBOUNCED_FIELDS: (keyof SidebarFormData)[] = ['fullName', 'description'];

type OnFieldChange = (fields: (keyof SidebarFormData)[], formData: SidebarFormData) => void;

@Injectable()
export class SidebarFormService {
  readonly formModel = signal<SidebarFormData>({ ...EMPTY_FORM });

  readonly fieldTree = form(this.formModel, (schemaPath) => {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      debounce(schemaPath[fieldName], DEBOUNCE_TIME_MS);
    });
  });

  private onFieldChange: OnFieldChange | null = null;
  private lastEmittedModel: SidebarFormData = { ...EMPTY_FORM };

  constructor() {
    this.watchForChanges();

    inject(DestroyRef).onDestroy(() => {
      this.flushDebouncedFields();
    });
  }

  registerChangeCallback(cb: OnFieldChange): void {
    this.onFieldChange = cb;
  }

  loadFormData(data: SidebarFormData): void {
    this.flushDebouncedFields();

    const model = this.formModel();
    const diffs = this.getDiffs(model);
    this.onFieldChange?.(diffs, model);

    this.lastEmittedModel = { ...data };
    this.formModel.set(data);
    this.fieldTree().reset();
  }

  private flushDebouncedFields(): void {
    DEBOUNCED_FIELDS.forEach((fieldName) => {
      this.fieldTree[fieldName]().markAsTouched();
    });
  }

  private watchForChanges(): void {
    effect(() => {
      const model = this.formModel();

      untracked(() => {
        if (this.fieldTree().dirty()) {
          const diffs = this.getDiffs(model);
          this.onFieldChange?.(diffs, model);
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
