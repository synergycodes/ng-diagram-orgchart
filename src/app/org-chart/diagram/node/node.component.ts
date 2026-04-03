import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { AddNodeService } from '../../actions/add-node.service';
import { DragReorderService } from '../../dragging/drag-reorder.service';
import { isOccupiedNodeData, isVacantNode } from '../guards';
import { type OrgChartNodeData } from '../interfaces';
import { LayoutService } from '../layout/layout.service';
import { AddButtonComponent } from './components/add-button/add-button.component';
import { CompactNodeComponent } from './components/compact-node/compact-node.component';
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
 * Expand/collapse button and connection ports are identical for all variants.
 */
@Component({
  imports: [
    NgDiagramPortComponent,
    VacantNodeComponent,
    CompactNodeComponent,
    FullNodeComponent,
    ToggleExpandButtonComponent,
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
    '[style.visibility]': 'node().data.isHidden ? "hidden" : null',
    '[style.pointer-events]': 'node().data.isHidden ? "none" : null',
    '[class.layout-horizontal]': 'isHorizontal()',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<OrgChartNodeData> {
  private readonly layoutService = inject(LayoutService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly addNodeService = inject(AddNodeService);

  node = input.required<Node<OrgChartNodeData>>();

  isLayoutIdle = this.layoutService.isIdle;

  isHorizontal = this.layoutService.isHorizontal;

  showLeftIndicator = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      !this.dragReorderService.isSideHidden(this.node().id, 'left'),
  );

  showRightIndicator = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      !this.dragReorderService.isSideHidden(this.node().id, 'right'),
  );

  showBottomIndicator = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      !this.dragReorderService.isSideHidden(this.node().id, 'bottom'),
  );

  showAddButtons = computed(() => !this.dragReorderService.isDragging());

  highlightedSide = computed(() => {
    const highlightedIndicator = this.dragReorderService.highlightedIndicator();
    return highlightedIndicator?.nodeId === this.node().id ? highlightedIndicator.side : null;
  });

  isRoot = computed(() => {
    // Update computed each time edge changes
    this.modelService.edges();
    const connectedEdges = this.modelService.getConnectedEdges(this.node().id);
    return !connectedEdges.some((e) => e.target === this.node().id);
  });

  variant = computed<NodeVariant>(() => {
    if (isVacantNode(this.node())) return 'vacant';
    return this.viewportService.scale() < 1 ? 'compact' : 'full';
  });

  occupiedData = computed(() => {
    const data = this.node().data;
    if (!isOccupiedNodeData(data)) {
      return undefined;
    }
    return data;
  });

  /** Toggle the collapsed state of this node's subtree and re-layout. */
  async onToggle(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.layoutService.toggleCollapsed(this.node().id);
  }

  onAddLeft(event: MouseEvent): void {
    event.stopPropagation();
    this.addNodeService.addNode(this.node().id, 'siblingBefore');
  }

  onAddRight(event: MouseEvent): void {
    event.stopPropagation();
    this.addNodeService.addNode(this.node().id, 'siblingAfter');
  }

  onAddBottom(event: MouseEvent): void {
    event.stopPropagation();
    this.addNodeService.addNode(this.node().id, 'child');
  }
}
