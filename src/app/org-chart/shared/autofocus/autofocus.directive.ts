import { afterRenderEffect, Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective {
  /** Pass a signal to track - when its value changes, the host element is re-focused. */
  readonly appAutofocus = input<unknown>();

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement;

    afterRenderEffect(() => {
      this.appAutofocus();
      el.focus();
    });
  }
}
