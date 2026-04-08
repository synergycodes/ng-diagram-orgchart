import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  DiagramInitEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramViewportService,
  type Edge,
  type NgDiagramConfig,
  type SelectionGestureEndedEvent,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { DragReorderService } from '../dragging/drag-reorder.service';
import { DragService } from '../dragging/drag.service';
import { DropService } from '../dragging/drop.service';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { diagramModel } from './data';
import { EdgeComponent } from './edge/edge.component';
import { isOrgChartNode } from './guards';
import { getHasChildren } from './node-data-getters';
import { EdgeTemplateType, NodeTemplateType } from './interfaces';
import { LayoutGate } from './layout/layout-gate';
import { LayoutService, type LayoutDirection } from './layout/layout.service';
import { ModelApplyService } from './model-apply.service';
import { ModelChanges } from './model-changes';
import { NodeVisibilityService } from './node-visibility/node-visibility.service';
import { NodeComponent } from './node/node.component';
import { SortOrderService } from './sort-order/sort-order.service';

/**
 * Org Chart Diagram
 *
 * Demonstrates a collapsible org-chart layout using ng-diagram with ELK.js for automatic
 * node positioning. Nodes with children display a toggle button to expand/collapse
 * their subtree. The `hasChildren` flag on each node is kept in sync automatically
 * as the user draws or deletes edges.
 */
@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DragService, DropService, DragReorderService],
})
export class DiagramComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

  protected readonly isLayoutInitialized = this.layoutGate.isInitialized;
  readonly isLayoutIdle = this.layoutGate.isIdle;

  readonly direction = this.layoutService.direction;

  config = {
    linking: {
      finalEdgeDataBuilder: (edge: Edge) => ({
        ...edge,
        type: EdgeTemplateType.OrgChartEdge,
      }),
    },
    zIndex: {
      elevateOnSelection: false,
    },
  } satisfies NgDiagramConfig;

  nodeTemplateMap = new NgDiagramNodeTemplateMap([[NodeTemplateType.OrgChartNode, NodeComponent]]);

  edgeTemplateMap = new NgDiagramEdgeTemplateMap([[EdgeTemplateType.OrgChartEdge, EdgeComponent]]);

  model = initializeModel(diagramModel);

  /**
   * Layout is deferred to the next animation frame so the browser can
   * paint the recreated port components (via `@if` in the node template)
   * before the layout transaction measures their positions.
   *
   * TODO: remove requestAnimationFrame once ng-diagram fixes port
   * dynamic side update.
   */
  changeDirection(value: LayoutDirection): void {
    if (this.direction() === value) {
      return;
    }
    this.layoutService.setDirection(value);
    requestAnimationFrame(async () => {
      await this.modelApplyService.applyWithLayout();
      this.viewportService.zoomToFit();
    });
  }

  /**
   * Initialize sort order and run the first layout, then fit the viewport.
   */
  async onDiagramInit(_: DiagramInitEvent): Promise<void> {
    const changes = this.sortOrderService.initSortOrder();
    await this.modelApplyService.applyWithLayout(changes, { animate: false });
    this.dragReorderService.init();
    this.viewportService.zoomToFit();
  }

  /**
   * When the user deletes edges, check whether each affected source node
   * still has outgoing edges. If not, clear `hasChildren` so the toggle
   * button is removed. Always re-layout to reposition remaining nodes.
   */
  async onSelectionRemoved(event: SelectionRemovedEvent): Promise<void> {
    if (event.deletedEdges.length === 0) return;

    const changes = new ModelChanges();

    for (const sourceId of new Set(event.deletedEdges.map((e) => e.source))) {
      const stillHasChildren = this.modelService
        .getConnectedEdges(sourceId)
        .some((e) => e.source === sourceId);
      if (stillHasChildren) continue;

      const node = this.modelService.getNodeById(sourceId);
      if (isOrgChartNode(node) && getHasChildren(node)) {
        changes.addNodeUpdates({ id: sourceId, data: { ...node.data, hasChildren: false } });
      }
    }

    const parentIds = [...new Set(event.deletedEdges.map((e) => e.source))];

    await this.modelApplyService.applyWithLayout(changes);

    if (parentIds.length > 0) {
      this.nodeVisibilityService.ensureVisible(parentIds[0]);
    }
  }

  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    const hasOrgChartNodes = event.nodes.some(isOrgChartNode);
    if (hasOrgChartNodes) {
      this.sidebarService.expandSidebar();
    }
  }

}
