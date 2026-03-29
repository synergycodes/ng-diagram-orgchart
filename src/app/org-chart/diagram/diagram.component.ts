import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  DiagramInitEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramMinimapComponent,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
  NgDiagramViewportService,
  provideNgDiagram,
  type Edge,
  type NgDiagramConfig,
  type NodeDragEndedEvent,
  type NodeDragStartedEvent,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { LayoutDirectionService } from '../layout-direction.service';
import { diagramModel } from './data';
import { DragStateService } from './drag-state.service';
import { EdgeComponent } from './edge/edge.component';
import { EdgeTemplateType, NodeTemplateType, type OrgChartNodeData } from './interfaces';
import { LayoutSchedulerService } from './layout/layout-scheduler.service';
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
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent, NgDiagramMinimapComponent],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNgDiagram(), LayoutService, DragStateService, LayoutSchedulerService],
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);
  private readonly dragStateService = inject(DragStateService);
  private readonly layoutDirectionService = inject(LayoutDirectionService);
  private readonly layoutSchedulerService = inject(LayoutSchedulerService);

  protected isLayoutReady = signal(false);

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

  constructor() {
    let isFirstRun = true;

    effect(() => {
      // Track direction changes — the value is consumed by layoutService internally.
      this.layoutDirectionService.direction();

      untracked(() => {
        // Skip the initial eager run — onDiagramInit handles the first layout.
        if (isFirstRun) {
          isFirstRun = false;
          return;
        }

        // Always mark pending, even before init (onDiagramInit will flush).
        this.layoutSchedulerService.scheduleLayout();

        if (!this.isLayoutReady()) return;
        this.layoutSchedulerService.runPendingLayout();
      });
    });
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

    // Pick up any direction changes that arrived during init.
    this.layoutSchedulerService.runPendingLayout();
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
        if (node && (node.data as OrgChartNodeData).hasChildren) {
          this.modelService.updateNodeData(sourceId, {
            ...(node.data as OrgChartNodeData),
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

  onNodeDragStarted(event: NodeDragStartedEvent): void {
    this.dragStateService.setDraggedNodes(event);
  }

  onNodeDragEnded(_: NodeDragEndedEvent): void {
    this.dragStateService.clearDrag();
  }
}
