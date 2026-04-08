import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class TopBarService {
  private readonly document = inject(DOCUMENT);
  private cachedHeight: number | null = null;

  get height(): number {
    if (this.cachedHeight === null) {
      const el = this.document.querySelector('app-top-navbar');
      this.cachedHeight = el?.getBoundingClientRect().height ?? 0;
    }
    return this.cachedHeight;
  }
}
