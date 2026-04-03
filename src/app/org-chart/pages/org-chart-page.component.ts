import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgDiagramMinimapComponent, provideNgDiagram } from 'ng-diagram';
import { provideAddNode } from '../actions/provide-add-node';
import { DiagramComponent } from '../diagram/diagram.component';
import { LayoutService } from '../diagram/layout/layout.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [
    DiagramComponent,
    PropertiesSidebarComponent,
    TopNavbarComponent,
    NgDiagramMinimapComponent,
    ToolbarHorizontalComponent,
  ],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgDiagram(),
    PropertiesSidebarService,
    LayoutService,
    SortOrderService,
    HierarchyService,
    provideAddNode(() => {
      const sidebar = inject(PropertiesSidebarService);
      return {
        onNodeAdded: () => sidebar.expandSidebar(),
        getViewportInsets: () => ({ right: sidebar.isExpanded() ? sidebar.width : 0 }),
      };
    }),
  ],
})
export class OrgChartPageComponent {}
