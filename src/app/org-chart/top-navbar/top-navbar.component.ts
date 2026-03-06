import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  activeTheme = signal<'light' | 'dark'>(
    (document.documentElement.dataset['theme'] as 'light' | 'dark') ?? 'dark',
  );

  toggleTheme(): void {
    const next = this.activeTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = next;
    this.activeTheme.set(next);
  }
}
