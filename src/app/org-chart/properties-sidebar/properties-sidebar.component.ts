import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SidebarFormComponent } from './components/sidebar-form/sidebar-form.component';
import {
  ON_FIELD_CHANGE,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';
import { SidebarFormService } from './components/sidebar-form/sidebar-form.service';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { SidebarPlaceholderComponent } from './components/sidebar-placeholder/sidebar-placeholder.component';
import { PropertiesSidebarService } from './properties-sidebar.service';

@Component({
  selector: 'app-properties-sidebar',
  imports: [SidebarHeaderComponent, SidebarPlaceholderComponent, SidebarFormComponent],
  providers: [
    SidebarFormService,
    {
      provide: ON_FIELD_CHANGE,
      useFactory: () => {
        const sidebarService = inject(PropertiesSidebarService);
        return (change: SidebarFieldChange) => sidebarService.handleFieldChange(change);
      },
    },
  ],
  templateUrl: './properties-sidebar.component.html',
  styleUrl: './properties-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.expanded]': 'isExpanded()' },
})
export class PropertiesSidebarComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);

  protected readonly isExpanded = this.sidebarService.isExpanded;
  protected readonly state = this.sidebarService.sidebarState;
  protected readonly selectedNode = this.sidebarService.selectedNode;
  protected readonly selectedNodeParentId = this.sidebarService.selectedNodeParentId;
  protected readonly reportsToCandidateNodes = this.sidebarService.reportsToCandidateNodes;
  protected readonly roleOptions = this.sidebarService.roleOptions;

  protected onHeaderToggle(): void {
    this.sidebarService.toggleSidebarVisibility();
  }

  protected onRemoveNode(): void {
    this.sidebarService.removeSelectedNode();
  }
}
