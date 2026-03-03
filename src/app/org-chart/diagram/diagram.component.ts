import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDiagramComponent, initializeModel, provideNgDiagram } from 'ng-diagram';

@Component({
  selector: 'org-chart-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.css',
})
export class DiagramComponent {
  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 400, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });
}
