import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import {
  configureShortcuts,
  DiagramInitEvent,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  NgDiagramViewportService,
  type Edge,
  type NgDiagramConfig,
  type SelectionGestureEndedEvent,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { DragReorderService } from '../drag-reorder/drag-reorder.service';
import { DragService } from '../drag-reorder/drag.service';
import { DropService } from '../drag-reorder/drop.service';
import { MoveModeStatusComponent, provideKeyboardMove } from '../keyboard-move';
import { ORG_CHART_CONFIG } from '../org-chart.config';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { diagramModel } from './data';
import { EdgeComponent } from './edge.component';
import { DiagramFocusService } from './keyboard-navigation/focus/diagram-focus.service';
import { DiagramKeyboardService } from './keyboard-navigation/routing/diagram-keyboard.service';
import { LayoutGate } from './layout/layout-gate';
import { LayoutService, type LayoutDirection } from './layout/layout.service';
import { isOrgChartNode } from './model/guards';
import { HierarchyService } from './model/hierarchy.service';
import { EdgeTemplateType, NodeTemplateType } from './model/interfaces';
import { ModelApplyService } from './model/model-apply.service';
import { ModelChanges } from './model/model-changes';
import { SortOrderService } from './model/sort-order.service';
import { NodeVisibilityConfigService } from './node-visibility/node-visibility-config.service';
import { NodeVisibilityService } from './node-visibility/node-visibility.service';
import { NodeComponent } from './node/node.component';
import { SuppressLibraryTabStopsDirective } from './suppress-library-tab-stops.directive';

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
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    SuppressLibraryTabStopsDirective,
    MoveModeStatusComponent,
  ],
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DragService,
    DropService,
    DragReorderService,
    DiagramKeyboardService,
    ...provideKeyboardMove(),
  ],
})
export class DiagramComponent {
  private readonly orgChartConfig = inject(ORG_CHART_CONFIG);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly nodeVisibilityConfigService = inject(NodeVisibilityConfigService);
  private readonly keyboardService = inject(DiagramKeyboardService);
  private readonly diagramFocusService = inject(DiagramFocusService);

  private readonly diagramMain = viewChild('diagramMain', { read: ElementRef<HTMLElement> });

  constructor() {
    effect(() => {
      const element = this.diagramMain()?.nativeElement ?? null;
      this.sidebarService.setFallbackFocusTarget(element);
      this.diagramFocusService.setFallbackTarget(element);
    });
  }

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
    watermarkPosition: 'bottom-left',
    zIndex: {
      elevateOnSelection: false,
    },
    shortcuts: configureShortcuts([
      // The app owns Delete, because it confirms first.
      { actionName: 'deleteSelection', bindings: [] },
      // ELK owns the positions, so the next layout run puts a nudged node back.
      { actionName: 'keyboardMoveSelectionUp', bindings: [] },
      { actionName: 'keyboardMoveSelectionDown', bindings: [] },
      { actionName: 'keyboardMoveSelectionLeft', bindings: [] },
      { actionName: 'keyboardMoveSelectionRight', bindings: [] },
    ]),
  } satisfies NgDiagramConfig;

  nodeTemplateMap = new NgDiagramNodeTemplateMap([[NodeTemplateType.OrgChartNode, NodeComponent]]);

  edgeTemplateMap = new NgDiagramEdgeTemplateMap([[EdgeTemplateType.OrgChartEdge, EdgeComponent]]);

  model = initializeModel(diagramModel);

  async changeDirection(value: LayoutDirection): Promise<void> {
    if (this.direction() === value) {
      return;
    }
    this.layoutService.setDirection(value);
    await this.modelApplyService.applyWithLayout();
    this.zoomToFit();
  }

  /**
   * Initialize sort order and run the first layout, then fit the viewport.
   */
  async onDiagramInit(_: DiagramInitEvent): Promise<void> {
    const changes = this.sortOrderService.initSortOrder();
    await this.modelApplyService.applyWithLayout(changes, { animate: false });
    this.dragReorderService.init();
    this.zoomToFit();
  }

  /**
   * When the user deletes edges, check whether each affected source node
   * still has outgoing edges. If not, clear `hasChildren` so the toggle
   * button is removed. Always re-layout to reposition remaining nodes.
   */
  async onSelectionRemoved(event: SelectionRemovedEvent): Promise<void> {
    if (event.deletedEdges.length > 0) {
      const parentIds = [...new Set(event.deletedEdges.map((e) => e.source))];
      const changes = new ModelChanges();
      this.hierarchyService.clearHasChildrenFlags(parentIds, changes);

      await this.modelApplyService.applyWithLayout(changes);

      if (parentIds.length > 0) {
        this.nodeVisibilityService.ensureVisible(parentIds[0]);
      }
    }

    this.diagramFocusService.recoverFocusIfLost();
  }

  /** Opens the properties sidebar when org-chart nodes are selected. */
  onSelectionGestureEnded(event: SelectionGestureEndedEvent): void {
    const hasOrgChartNodes = event.nodes.some(isOrgChartNode);
    if (hasOrgChartNodes) {
      this.sidebarService.expandSidebar();
    }
  }

  onDiagramKeydown(event: KeyboardEvent): void {
    this.keyboardService.handle(event);
  }

  /** Fits all nodes in view, accounting for overlay insets plus extra padding. */
  private zoomToFit(): void {
    const insets = this.nodeVisibilityConfigService.getViewportInsets();
    const pad = this.orgChartConfig.viewport.zoomToFitPadding;
    this.viewportService.zoomToFit({
      padding: [
        (insets.top ?? 0) + pad,
        (insets.right ?? 0) + pad,
        (insets.bottom ?? 0) + pad,
        (insets.left ?? 0) + pad,
      ],
    });
  }
}
