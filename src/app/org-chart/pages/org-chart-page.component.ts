import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DiagramComponent } from '../diagram/diagram.component';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [DiagramComponent, ToolbarHorizontalComponent, TopNavbarComponent],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartPageComponent {}
