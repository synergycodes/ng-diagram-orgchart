import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgDiagramBaseEdgeComponent, type NgDiagramEdgeTemplate, type Edge } from 'ng-diagram';
import { type TreeEdgeData } from '../interfaces';

/**
 * Custom tree edge template.
 *
 * Delegates all rendering to the built-in base edge component.
 * Edges whose source or target node is inside a collapsed subtree
 * are hidden via a host binding on the `isHidden` data flag.
 */
@Component({
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge [edge]="edge()" />`,
  styleUrl: './edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Hide edges that connect to nodes inside a collapsed subtree.
    '[style.visibility]': 'edge().data.isHidden ? "hidden" : null',
  },
})
export class EdgeComponent implements NgDiagramEdgeTemplate<TreeEdgeData> {
  edge = input.required<Edge<TreeEdgeData>>();
}
