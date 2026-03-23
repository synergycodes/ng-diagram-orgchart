import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';
import { SidebarFormService } from './components/sidebar-form/sidebar-form.service';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { PropertiesSidebarService } from './properties-sidebar.service';

@Component({
  selector: 'app-properties-sidebar',
  imports: [SidebarHeaderComponent, SidebarPlaceholderComponent, SidebarFormComponent],
  providers: [SidebarFormService],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isCollapsing = signal(false);
  private collapseTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly shouldAnimatePlaceholder = signal(false);
  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly state = this.sidebarService.sidebarState;
  protected readonly reportsToCandidateNodes = this.sidebarService.reportsToCandidateNodes;
  protected readonly roleOptions = this.sidebarService.roleOptions;
  protected readonly sidebarExpanded = computed(() => this.isExpanded() || this.isCollapsing());

  constructor() {
    this.registerCleanup();
  }

  protected onHeaderToggle(): void {
    if (this.isExpanded()) {
      this.isCollapsing.set(true);
      this.sidebarService.toggleSidebarVisibility();
      if (this.collapseTimeout) {
        clearTimeout(this.collapseTimeout);
      }
      this.collapseTimeout = setTimeout(
        () => this.isCollapsing.set(false),
        this.getCollapseDuration(),
      );
    } else {
      this.shouldAnimatePlaceholder.set(true);
      this.sidebarService.toggleSidebarVisibility();
    }
  }

  protected onPlaceholderAnimationEnd(): void {
    this.shouldAnimatePlaceholder.set(false);
  }

  private registerCleanup(): void {
    this.destroyRef.onDestroy(() => {
      if (this.collapseTimeout) {
        clearTimeout(this.collapseTimeout);
      }
    });
  }

  private getCollapseDuration(): number {
    const raw = getComputedStyle(this.elRef.nativeElement)
      .getPropertyValue('--sidebar-collapse-duration')
      .trim();
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? 200 : parsed;
  }
}
