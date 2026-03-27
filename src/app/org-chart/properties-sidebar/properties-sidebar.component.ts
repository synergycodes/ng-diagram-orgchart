import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';
import { type SidebarFieldChange } from './components/sidebar-form/sidebar-form.mappers';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { PropertiesSidebarService } from './properties-sidebar.service';

@Component({
  selector: 'app-properties-sidebar',
  imports: [SidebarHeaderComponent, SidebarPlaceholderComponent, SidebarFormComponent],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.expanded]': 'isExpanded()' },
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);

  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly state = this.sidebarService.sidebarState;
  protected readonly selectedNodeId = computed(() => this.sidebarService.selectedNode()?.id);
  protected readonly selectedNodeData = computed(() => this.sidebarService.selectedNode()?.data);
  protected readonly selectedNodeParentId = this.sidebarService.selectedNodeParentId;
  protected readonly reportsToCandidateNodes = this.sidebarService.reportsToCandidateNodes;
  protected readonly roleOptions = this.sidebarService.roleOptions;

  protected onHeaderToggle(): void {
    this.sidebarService.toggleSidebarVisibility();
  }

  protected onFieldChange(change: SidebarFieldChange): void {
    this.sidebarService.handleFieldChange(change);
  }
}
