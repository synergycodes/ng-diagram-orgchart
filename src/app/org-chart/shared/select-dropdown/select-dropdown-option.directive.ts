import { Directive, inject, TemplateRef } from '@angular/core';
import { type SelectDropdownOption } from './select-dropdown.component';

export interface SelectDropdownOptionContext<T = any> {
  $implicit: SelectDropdownOption<T>;
}

@Directive({ selector: 'ng-template[appSelectOption]' })
export class SelectDropdownOptionDef<T = any> {
  readonly templateRef = inject(TemplateRef<SelectDropdownOptionContext<T>>);
}

@Directive({ selector: 'ng-template[appSelectNullOption]' })
export class SelectDropdownNullOptionDef {
  readonly templateRef = inject(TemplateRef<void>);
}
