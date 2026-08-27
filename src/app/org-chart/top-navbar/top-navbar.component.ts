import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KeyboardShortcutsTriggerComponent } from '../keyboard-shortcuts/keyboard-shortcuts-trigger.component';
import { ThemeToggleComponent } from './theme-toggle.component';

@Component({
  selector: 'app-top-navbar',
  imports: [KeyboardShortcutsTriggerComponent, ThemeToggleComponent],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {}
