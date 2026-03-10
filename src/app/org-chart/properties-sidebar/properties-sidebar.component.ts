import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PropertiesSidebarService } from './properties-sidebar.service';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';

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

  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly sidebarExpanded = computed(() => this.isExpanded() || this.isCollapsing());
  protected readonly state = computed(() => this.sidebarService.sidebarState());

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
      this.collapseTimeout = setTimeout(() => this.isCollapsing.set(false), 200);
    } else {
      this.sidebarService.toggle();
    }
  }
}
