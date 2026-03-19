import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DiagramComponent } from '../diagram/diagram.component';
import { LayoutDirectionService } from '../layout-direction.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [DiagramComponent, ToolbarHorizontalComponent, TopNavbarComponent],
  providers: [LayoutDirectionService],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartPageComponent {}
