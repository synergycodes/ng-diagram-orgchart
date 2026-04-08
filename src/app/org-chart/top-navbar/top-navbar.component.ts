import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { NodeVisibilityConfigService } from '../diagram/node-visibility/node-visibility-config.service';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-top-navbar',
  imports: [ThemeToggleComponent],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavbarComponent {
  constructor() {
    this.registerAsViewportOverlay();
  }

  private registerAsViewportOverlay(): void {
    const configService = inject(NodeVisibilityConfigService);
    const elementRef = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);

    configService.register('top-navbar', elementRef);
    destroyRef.onDestroy(() => configService.unregister('top-navbar'));
  }
}
