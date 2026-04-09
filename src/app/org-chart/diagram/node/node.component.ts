import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { AddNodeService, type AddNodeAction } from '../../actions/add-node.service';
import { DragReorderService } from '../../dragging/drag-reorder.service';
import { PropertiesSidebarService } from '../../properties-sidebar/properties-sidebar.service';
import { ExpandCollapseService } from '../expand-collapse/expand-collapse.service';
import { isOccupiedNodeData, isVacantNode } from '../guards';
import { type OrgChartNodeData } from '../interfaces';
import { LayoutGate } from '../layout/layout-gate';
import { LayoutService } from '../layout/layout.service';
import { ModelApplyService } from '../model-apply.service';
import {
  getCollapsedChildrenCount,
  getHasChildren,
  getIsCollapsed,
  getIsHidden,
} from '../node-data-getters';
import { NodeVisibilityService } from '../node-visibility/node-visibility.service';
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
    '[style.visibility]': 'isHidden() ? "hidden" : null',
    '[style.pointer-events]': 'isHidden() ? "none" : null',
    '[class.layout-horizontal]': 'isHorizontal()',
    '[class.node-dragging]': 'dragReorderService.isReorderActive()',
    '[class.add-buttons-fading-out]': 'showAddButtonsDom() && !showAddButtons()',
    '(mouseenter)': 'isHovered.set(true)',
    '(mouseleave)': 'isHovered.set(false)',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<OrgChartNodeData> {
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly expandCollapseService = inject(ExpandCollapseService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly viewportService = inject(NgDiagramViewportService);
  protected readonly dragReorderService = inject(DragReorderService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly addNodeService = inject(AddNodeService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

  node = input.required<Node<OrgChartNodeData>>();

  isLayoutIdle = this.layoutGate.isIdle;

  isHorizontal = this.layoutService.isHorizontal;

  isInDropRange = computed(
    () =>
      this.dragReorderService.isReorderActive() &&
      this.dragReorderService.isNodeInDropRange(this.node().id),
  );

  private readonly _showIndicators = signal(false);
  showIndicators = this._showIndicators.asReadonly();

  private readonly indicatorExitEffect = effect((onCleanup) => {
    const inRange = this.isInDropRange();
    if (inRange) {
      this._showIndicators.set(true);
    } else {
      const timeout = setTimeout(() => this._showIndicators.set(false), 200);
      onCleanup(() => clearTimeout(timeout));
    }
  });

  isSideHidden = (side: 'left' | 'right' | 'bottom') =>
    this.dragReorderService.isSideHidden(this.node().id, side);

  highlightedSide = computed(() => {
    const indicator = this.dragReorderService.highlightedIndicator();
    return indicator?.nodeId === this.node().id ? indicator.side : null;
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

  protected isHidden = computed(() => getIsHidden(this.node()));
  protected isCollapsed = computed(() => getIsCollapsed(this.node()));
  protected hasChildren = computed(() => getHasChildren(this.node()));
  protected collapsedChildrenCount = computed(() => getCollapsedChildrenCount(this.node()));

  isHovered = signal(false);
  showAddButtons = computed(
    () => this.isHovered() && !this.dragReorderService.isReorderActive(),
  );

  private readonly _showAddButtonsDom = signal(false);
  showAddButtonsDom = this._showAddButtonsDom.asReadonly();

  private readonly addButtonExitEffect = effect((onCleanup) => {
    const show = this.showAddButtons();
    if (show) {
      this._showAddButtonsDom.set(true);
    } else {
      const timeout = setTimeout(() => this._showAddButtonsDom.set(false), 150);
      onCleanup(() => clearTimeout(timeout));
    }
  });

  isAddButtonDisabled = computed(() => !this.layoutGate.isIdle());

  /** Toggle the collapsed state of this node's subtree and re-layout. */
  async onToggle(event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const result = this.expandCollapseService.prepareToggle(this.node().id);
    if (!result) return;

    await this.modelApplyService.applyWithLayout(result.changes, {
      subtreeIds: result.toggledSubtreeIds,
      collapsing: result.collapsing,
    });
  }

  async onAddLeft(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('siblingBefore');
  }

  async onAddRight(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('siblingAfter');
  }

  async onAddBottom(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('child');
  }

  private async addNodeAndExpandSidebar(action: AddNodeAction): Promise<void> {
    const newNodeId = await this.addNodeService.addNode(this.node().id, action);
    if (newNodeId) {
      this.selectionService.select([newNodeId]);
      this.sidebarService.expandSidebar();
      requestAnimationFrame(() => {
        this.nodeVisibilityService.ensureVisible(newNodeId);
      });
    }
  }
}
