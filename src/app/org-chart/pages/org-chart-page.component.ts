import { Component } from '@angular/core';
import { DiagramComponent } from '../diagram/diagram.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [DiagramComponent],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.css',
})
export class OrgChartPageComponent {}
