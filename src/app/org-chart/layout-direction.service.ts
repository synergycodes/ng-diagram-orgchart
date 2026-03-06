import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutDirectionService {
  readonly direction = signal<'DOWN' | 'RIGHT'>('DOWN');

  setDirection(value: 'DOWN' | 'RIGHT'): void {
    this.direction.set(value);
  }
}
