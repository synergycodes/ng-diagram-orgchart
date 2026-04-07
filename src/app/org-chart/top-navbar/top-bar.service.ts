import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class TopBarService {
  private readonly document = inject(DOCUMENT);

  get height(): number {
    const el = this.document.querySelector('app-top-navbar');
    return el?.getBoundingClientRect().height ?? 0;
  }
}
