import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { LayoutService } from '../layout/layout.service';
import { getHasChildren, getIsHidden } from '../model/data-getters';
import { isOccupiedNodeData, isVacantNode } from '../model/guards';
import { getColorForRole, type OrgChartNodeData } from '../model/interfaces';
import { AddButtonsPanelComponent } from './components/add-buttons-panel/add-buttons-panel.component';
import { CompactNodeComponent } from './components/compact-node/compact-node.component';
import { DragIndicatorsComponent } from './components/drag-indicators/drag-indicators.component';
import { FullNodeComponent } from './components/full-node/full-node.component';
import { ToggleExpandButtonComponent } from './components/toggle-expand-button/toggle-expand-button.component';
import { VacantNodeComponent } from './components/vacant-node/vacant-node.component';

type NodeVariant = 'vacant' | 'compact' | 'full';

/**
 * Custom org-chart node template.
 *
 * Renders one of three visual variants depending on vacancy and zoom level:
 * - **vacant** – no `fullName` set; shows a placeholder card.
 * - **compact** – zoom < 100%; header only, no stats/capacity.
 * - **full** – zoom >= 100%; complete card with stats and capacity bar.
 *
 * Delegates expand/collapse, drag indicators, and add-node buttons to child components.
 */
@Component({
  imports: [
    NgDiagramPortComponent,
    VacantNodeComponent,
    CompactNodeComponent,
    FullNodeComponent,
    ToggleExpandButtonComponent,
    DragIndicatorsComponent,
    AddButtonsPanelComponent,
  ],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
    '[class.variant-vacant]': 'variant() === "vacant"',
    '[class.variant-compact]': 'variant() === "compact"',
    '[class.variant-full]': 'variant() === "full"',
    '[class.selected]': 'node().selected',
    '[style.visibility]': 'isHidden() ? "hidden" : null',
    '[style.pointer-events]': 'isHidden() ? "none" : null',
    '[class.layout-horizontal]': 'isHorizontal()',
    '(mouseenter)': 'isHovered.set(true)',
    '(mouseleave)': 'isHovered.set(false)',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<OrgChartNodeData> {
  private readonly config = inject(ORG_CHART_CONFIG);
  private readonly layoutService = inject(LayoutService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);

  node = input.required<Node<OrgChartNodeData>>();

  isHorizontal = this.layoutService.isHorizontal;

  isRoot = computed(() => {
    // Update computed each time edge changes
    this.modelService.edges();
    const connectedEdges = this.modelService.getConnectedEdges(this.node().id);
    return !connectedEdges.some((e) => e.target === this.node().id);
  });

  variant = computed<NodeVariant>(() => {
    if (isVacantNode(this.node())) return 'vacant';
    return this.viewportService.scale() < this.config.viewport.compactScaleThreshold
      ? 'compact'
      : 'full';
  });

  protected color = computed(() => getColorForRole(this.node().data.role));

  occupiedData = computed(() => {
    const data = this.node().data;
    if (!isOccupiedNodeData(data)) {
      return undefined;
    }
    return data;
  });

  protected isHidden = computed(() => getIsHidden(this.node()));
  protected hasChildren = computed(() => getHasChildren(this.node()));

  protected isHovered = signal(false);
}
