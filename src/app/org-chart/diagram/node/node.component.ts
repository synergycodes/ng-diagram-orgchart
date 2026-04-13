import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { DragReorderService } from '../../drag-reorder/drag-reorder.service';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { LayoutService } from '../layout/layout.service';
import { getHasChildren, getIsHidden } from '../model/data-getters';
import { isOccupiedNodeData, isVacantNode } from '../model/guards';
import { getColorForRole, type OrgChartNodeData } from '../model/interfaces';
import { AddButtonComponent } from './components/add-button/add-button.component';
import { CompactNodeComponent } from './components/compact-node/compact-node.component';
import { DropIndicatorComponent } from './components/drop-indicator/drop-indicator.component';
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
    DropIndicatorComponent,
    AddButtonComponent,
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
    '[class.is-hidden]': 'isHidden()',
    '[style.visibility]': 'isHidden() ? "hidden" : null',
    '[style.pointer-events]': 'isHidden() ? "none" : null',
    '(mouseenter)': 'isNodeHovered.set(true)',
    '(mouseleave)': 'isNodeHovered.set(false)',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<OrgChartNodeData> {
  private readonly config = inject(ORG_CHART_CONFIG);
  private readonly layoutService = inject(LayoutService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly dragReorderService = inject(DragReorderService);

  node = input.required<Node<OrgChartNodeData>>();

  protected isNodeHovered = signal(false);

  protected isHorizontal = this.layoutService.isHorizontal;

  protected nodeId = computed(() => this.node().id);
  protected isHidden = computed(() => getIsHidden(this.node()));
  protected variant = computed<NodeVariant>(() => {
    if (isVacantNode(this.node())) return 'vacant';
    return this.viewportService.scale() < this.config.viewport.compactScaleThreshold
      ? 'compact'
      : 'full';
  });
  protected color = computed(() => getColorForRole(this.node().data.role));
  protected occupiedData = computed(() => {
    const data = this.node().data;
    if (!isOccupiedNodeData(data)) {
      return undefined;
    }
    return data;
  });

  protected hasChildren = computed(() => !!getHasChildren(this.node()));
  protected isInDropRange = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      this.dragReorderService.isNodeInDropRange(this.nodeId()),
  );

  protected isRoot = computed(() => {
    // Update computed each time edge changes
    this.modelService.edges();
    const id = this.nodeId();
    const connectedEdges = this.modelService.getConnectedEdges(id);
    return !connectedEdges.some((e) => e.target === id);
  });
  protected showAddButtons = computed(
    () => this.isNodeHovered() && !this.dragReorderService.isReorderActive(),
  );
}
