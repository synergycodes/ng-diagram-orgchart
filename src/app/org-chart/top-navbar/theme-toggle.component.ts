import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class ThemeToggleComponent {
  private readonly document = inject(DOCUMENT);

  activeTheme = signal<'light' | 'dark'>(
    this.document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark',
  );

  toggleTheme(): void {
    const next = this.activeTheme() === 'dark' ? 'light' : 'dark';
    this.document.documentElement.dataset['theme'] = next;
    localStorage.setItem('theme', next);
    this.activeTheme.set(next);
  }
}
