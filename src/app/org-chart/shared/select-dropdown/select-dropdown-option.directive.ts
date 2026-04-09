import { Directive, inject, TemplateRef } from '@angular/core';
import { type SelectDropdownOption } from './select-dropdown.component';

interface SelectDropdownOptionContext<T = unknown> {
  $implicit: SelectDropdownOption<T>;
}

interface SelectDropdownPrefixContext<T = unknown> {
  $implicit: SelectDropdownOption<T> | null;
}

@Directive({ selector: 'ng-template[appSelectOption]' })
export class SelectDropdownOptionDef<T = unknown> {
  readonly templateRef = inject(TemplateRef<SelectDropdownOptionContext<T>>);
}

@Directive({ selector: 'ng-template[appSelectNullOption]' })
export class SelectDropdownNullOptionDef {
  readonly templateRef = inject(TemplateRef<void>);
}

@Directive({ selector: 'ng-template[appComboboxPrefix]' })
export class SelectDropdownPrefixDef<T = unknown> {
  readonly templateRef = inject(TemplateRef<SelectDropdownPrefixContext<T>>);
}
