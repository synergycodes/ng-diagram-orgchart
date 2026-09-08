import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramModelService,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';
import { isVacantNode } from './model/guards';
import { type OrgChartEdgeData } from './model/interfaces';

/**
 * Custom org-chart edge template.
 *
 * Delegates all rendering to the built-in base edge component.
 * Edges inside a collapsed subtree disappear automatically — ng-diagram
 * hides an edge whenever one of its endpoint nodes is hidden.
 */
@Component({
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [strokeDasharray]="isVacant() ? '5 5' : undefined"
  />`,
  styleUrl: './edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeComponent implements NgDiagramEdgeTemplate<OrgChartEdgeData> {
  private readonly modelService = inject(NgDiagramModelService);

  edge = input.required<Edge<OrgChartEdgeData>>();

  isVacant = computed(() => {
    const targetNode = this.modelService.getNodeById(this.edge().target);
    return isVacantNode(targetNode);
  });
}
