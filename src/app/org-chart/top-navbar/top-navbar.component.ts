import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-top-navbar',
  imports: [ThemeToggleComponent],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  private readonly navbar = viewChild<ElementRef<HTMLElement>>('navbar');

  get height(): number {
    return this.navbar()?.nativeElement.getBoundingClientRect().height ?? 0;
  }
}
