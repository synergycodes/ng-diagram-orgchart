import { Directive, inject, TemplateRef } from '@angular/core';
import { type ComboboxOption } from './combobox.component';

interface ComboboxOptionContext<T = unknown> {
  $implicit: ComboboxOption<T>;
}

interface ComboboxPrefixContext<T = unknown> {
  $implicit: ComboboxOption<T> | null;
}

@Directive({ selector: 'ng-template[appComboboxOption]' })
export class ComboboxOptionDef<T = unknown> {
  readonly templateRef = inject(TemplateRef<ComboboxOptionContext<T>>);
}

@Directive({ selector: 'ng-template[appComboboxNullOption]' })
export class ComboboxNullOptionDef {
  readonly templateRef = inject(TemplateRef<void>);
}

@Directive({ selector: 'ng-template[appComboboxPrefix]' })
export class ComboboxPrefixDef<T = unknown> {
  readonly templateRef = inject(TemplateRef<ComboboxPrefixContext<T>>);
}
