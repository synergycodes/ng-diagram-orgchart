import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  host: { '[class.expanded]': 'isExpanded()' },
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);

  protected readonly shouldAnimatePlaceholder = signal(false);
  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly state = this.sidebarService.sidebarState;
  protected readonly reportsToCandidateNodes = this.sidebarService.reportsToCandidateNodes;
  protected readonly roleOptions = this.sidebarService.roleOptions;

  protected onHeaderToggle(): void {
    if (!this.isExpanded()) {
      this.shouldAnimatePlaceholder.set(true);
    }
    this.sidebarService.toggleSidebarVisibility();
  }

  protected onPlaceholderAnimationEnd(): void {
    this.shouldAnimatePlaceholder.set(false);
  }
}
