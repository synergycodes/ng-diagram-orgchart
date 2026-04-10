import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { LayoutAnimationService } from '../diagram/animation/layout-animation.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { AddNodeService } from '../diagram/model/add-node.service';
import { ExpandCollapseService } from '../diagram/model/expand-collapse.service';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { SortOrderService } from '../diagram/model/sort-order.service';
import { NodeVisibilityConfigService } from '../diagram/node-visibility/node-visibility-config.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { ViewportBoundsDirective } from '../diagram/node-visibility/viewport-bounds.directive';
import { ViewportOverlayDirective } from '../diagram/node-visibility/viewport-overlay.directive';
import { MinimapPanelComponent } from '../minimap-panel/minimap-panel.component';
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
    MinimapPanelComponent,
    ToolbarHorizontalComponent,
    ViewportBoundsDirective,
    ViewportOverlayDirective,
  ],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgDiagram(),
    // To customize org-chart settings, uncomment and modify:
    // provideOrgChartConfig({ animation: { durationMs: 500 }, viewport: { zoomStep: 0.2 } }),
    PropertiesSidebarService,
    SortOrderService,
    ExpandCollapseService,
    LayoutGate,
    LayoutService,
    ModelApplyService,
    HierarchyService,
    AddNodeService,
    LayoutAnimationService,
    NodeVisibilityService,
    NodeVisibilityConfigService,
  ],
})
export class OrgChartPageComponent {}
