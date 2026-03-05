import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgDiagramBaseEdgeComponent, NgDiagramModelService, type NgDiagramEdgeTemplate, type Edge } from 'ng-diagram';
import { isVacantNode } from '../guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';

/**
 * Custom org-chart edge template.
 *
 * Delegates all rendering to the built-in base edge component.
 * Edges whose source or target node is inside a collapsed subtree
 * are hidden via a host binding on the `isHidden` data flag.
 */
@Component({
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge [edge]="edge()" [strokeDasharray]="isVacant() ? '5 5' : undefined" />`,
  styleUrl: './edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Hide edges that connect to nodes inside a collapsed subtree.
    '[style.visibility]': 'edge().data.isHidden ? "hidden" : null',
  },
})
export class EdgeComponent implements NgDiagramEdgeTemplate<OrgChartEdgeData> {
  private modelService = inject(NgDiagramModelService);

  edge = input.required<Edge<OrgChartEdgeData>>();

  isVacant = computed(() => {
    const target = this.modelService.getNodeById(this.edge().target);
    return isVacantNode(target?.data as OrgChartNodeData | undefined);
  });
}
