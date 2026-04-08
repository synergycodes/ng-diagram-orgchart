import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { AddNodeService } from '../actions/add-node.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { ExpandCollapseService } from '../diagram/expand-collapse/expand-collapse.service';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { ModelApplyService } from '../diagram/model-apply.service';
import { provideNodeVisibilityConfig } from '../diagram/node-visibility/node-visibility-config.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { SortOrderService } from '../diagram/sort-order/sort-order.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { MinimapPanelComponent } from '../minimap-panel/minimap-panel.component';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopBarService } from '../top-navbar/top-bar.service';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [
    DiagramComponent,
    PropertiesSidebarComponent,
    TopNavbarComponent,
    MinimapPanelComponent,
    ToolbarHorizontalComponent,
  ],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgDiagram(),
    PropertiesSidebarService,
    TopBarService,
    SortOrderService,
    ExpandCollapseService,
    LayoutGate,
    LayoutService,
    ModelApplyService,
    HierarchyService,
    AddNodeService,
    NodeVisibilityService,
    provideNodeVisibilityConfig(),
  ],
})
export class OrgChartPageComponent {}
