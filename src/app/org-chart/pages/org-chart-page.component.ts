import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDiagramMinimapComponent, provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from '../diagram/diagram.component';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { LayoutService } from '../diagram/layout/layout.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
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
  providers: [provideNgDiagram(), PropertiesSidebarService, LayoutService, HierarchyService],
})
export class OrgChartPageComponent {}
