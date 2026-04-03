import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  DiagramInitEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
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
import { isOrgChartNode, isOrgChartNodeData } from './guards';
import { EdgeTemplateType, NodeTemplateType } from './interfaces';
import { LayoutService, type LayoutDirection } from './layout/layout.service';
import { NodeComponent } from './node/node.component';

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
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly sidebarService = inject(PropertiesSidebarService);

  protected readonly isLayoutInitialized = this.layoutService.isInitialized;
  protected readonly isRebuilding = this.layoutService.isRebuilding;
  readonly isLayoutIdle = this.layoutService.isIdle;

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

  changeDirection(value: LayoutDirection): void {
    this.layoutService.setDirection(value);
  }

  /**
   * Run the ELK tree layout inside a transaction (so measurements are
   * up-to-date), then fit the viewport to show all nodes.
   */
  async onDiagramInit(_: DiagramInitEvent): Promise<void> {
    await this.layoutService.init();
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

    const affectedSourceIds = new Set(event.deletedEdges.map((e) => e.source));

    // Await the transaction to ensure hasChildren updates are committed
    // to the model before re-layout reads them.
    await this.diagramService.transaction(async () => {
      for (const sourceId of affectedSourceIds) {
        const stillHasChildren = this.modelService
          .getConnectedEdges(sourceId)
          .some((e) => e.source === sourceId);
        if (stillHasChildren) continue;

        const node = this.modelService.getNodeById(sourceId);
        if (node && isOrgChartNodeData(node.data) && node.data.hasChildren) {
          this.modelService.updateNodeData(sourceId, {
            ...node.data,
            hasChildren: false,
          });
        }
      }
    });

    await this.layoutService.runLayout();
  }

  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    const hasOrgChartNodes = event.nodes.some(isOrgChartNode);
    if (hasOrgChartNodes) {
      this.sidebarService.expandSidebar();
    }
  }
}
