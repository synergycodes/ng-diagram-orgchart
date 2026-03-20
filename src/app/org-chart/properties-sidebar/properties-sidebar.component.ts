import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { PropertiesSidebarService } from './properties-sidebar.service';

/** Must match .sidebar-leave animation duration in properties-sidebar.component.scss */
const COLLAPSE_ANIMATION_MS = 200;

@Component({
  selector: 'app-properties-sidebar',
  imports: [SidebarPlaceholderComponent, SidebarFormComponent],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formRef = viewChild(SidebarFormComponent);
  private readonly isCollapsing = signal(false);
  private collapseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly shouldAnimatePlaceholder = signal(false);
  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly sidebarExpanded = computed(() => this.isExpanded() || this.isCollapsing());
  protected readonly state = this.sidebarService.sidebarState;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.collapseTimeout) {
        clearTimeout(this.collapseTimeout);
      }
    });
  }

  protected toggle(): void {
    if (this.isExpanded()) {
      this.formRef()?.flush();
      this.isCollapsing.set(true);
      this.sidebarService.toggle();
      this.collapseTimeout = setTimeout(() => this.isCollapsing.set(false), COLLAPSE_ANIMATION_MS);
    } else {
      this.shouldAnimatePlaceholder.set(true);
      this.sidebarService.toggle();
    }
  }

  protected onPlaceholderAnimationEnd(): void {
    this.shouldAnimatePlaceholder.set(false);
  }
}
