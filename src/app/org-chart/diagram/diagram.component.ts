import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  type EdgeDrawnEvent,
  type NgDiagramConfig,
  type NodeDragEndedEvent,
  type NodeDragStartedEvent,
  type SelectionGestureEndedEvent,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { diagramModel } from './data';
import { DragStateService } from './drag-state.service';
import { EdgeComponent } from './edge/edge.component';
import { isOrgChartNode, isOrgChartNodeData } from './guards';
import { EdgeTemplateType, NodeTemplateType, type OrgChartNodeData } from './interfaces';
import { LayoutService } from './layout/layout.service';
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
  providers: [LayoutService, DragStateService],
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly dragStateService = inject(DragStateService);
  private readonly sidebarService = inject(PropertiesSidebarService);

  protected isLayoutReady = signal(false);

  // Assign the custom OrgChartEdge type to every user-drawn edge so it uses our
  // edge template (with visibility support for collapsed subtrees).
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
   * When the user draws a new edge, mark the source node as having children
   * so the expand/collapse toggle button appears. Re-layout only if the
   * flag actually changed.
   */
  async onEdgeDrawn(event: EdgeDrawnEvent): Promise<void> {
    if (!isOrgChartNodeData(event.source.data)) {
      throw new Error('Event source data is not of type `OrgChartNodeData`!');
    }
    const sourceData = event.source.data;
    if (!sourceData.hasChildren) {
      // Await the transaction to ensure hasChildren is committed
      // to the model before re-layout reads it.
      await this.diagramService.transaction(async () => {
        this.modelService.updateNodeData(event.source.id, {
          ...sourceData,
          hasChildren: true,
        });
      });

      await this.layoutService.applyLayout();
    }
  }

  /**
   * When the user deletes edges, check whether each affected source node
   * still has outgoing edges. If not, clear `hasChildren` so the toggle
   * button is removed. Re-layout only if at least one node was updated.
   */
  async onSelectionRemoved(event: SelectionRemovedEvent): Promise<void> {
    if (event.deletedEdges.length === 0) return;

    const affectedSourceIds = new Set(event.deletedEdges.map((e) => e.source));
    let changed = false;

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
          changed = true;
        }
      }
    });

    if (changed) {
      await this.layoutService.applyLayout();
    }
  }

  /**
   * Run the ELK tree layout inside a transaction (so measurements are
   * up-to-date), then fit the viewport to show all nodes.
   */
  async onDiagramInit(_: DiagramInitEvent): Promise<void> {
    await this.diagramService.transaction(
      async () => {
        await this.layoutService.applyLayout();
      },
      { waitForMeasurements: true },
    );

    this.viewportService.zoomToFit();
    this.isLayoutReady.set(true);
  }

  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    const hasOrgChartNodes = event.nodes.some(isOrgChartNode);
    if (hasOrgChartNodes) {
      this.sidebarService.expandSidebar();
    }
  }

  onNodeDragStarted(event: NodeDragStartedEvent): void {
    this.dragStateService.setDraggedNodes(event);
  }

  onNodeDragEnded(_: NodeDragEndedEvent): void {
    this.dragStateService.clearDrag();
  }
}
