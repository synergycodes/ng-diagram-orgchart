import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramPortComponent,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { DragReorderService } from '../../drag-reorder/drag-reorder.service';
import { visibleDropSides } from '../../drag-reorder/visible-drop-sides';
import { MoveModeService } from '../../keyboard-move';
import { ORG_CHART_CONFIG } from '../../org-chart.config';
import { DiagramFocusService } from '../keyboard-navigation/focus/diagram-focus.service';
import { focusFirstNodeAction } from '../keyboard-navigation/focus/node-actions';
import { NodeFocusService } from '../keyboard-navigation/focus/node-focus.service';
import { LayoutService } from '../layout/layout.service';
import { getHasChildren, getIsCollapsed, getIsHidden } from '../model/data-getters';
import { isOccupiedNodeData, isVacantNode } from '../model/guards';
import { getColorForRole, type OrgChartNodeData } from '../model/interfaces';
import { AddButtonComponent } from './components/add-button/add-button.component';
import { CompactNodeComponent } from './components/compact-node/compact-node.component';
import { DropIndicatorComponent } from './components/drop-indicator/drop-indicator.component';
import {
  buildIndicatorStates,
  indicatorStatesEqual,
  type IndicatorStates,
} from './components/drop-indicator/indicator-states';
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
    '[class.selected]': 'node().selected',
    '[class.is-hidden]': 'isHidden()',
    '[style.visibility]': 'isHidden() ? "hidden" : null',
    '[style.pointer-events]': 'isHidden() ? "none" : null',
    '[attr.role]': '"treeitem"',
    '[attr.tabindex]': 'isTabStop() ? 0 : -1',
    '[attr.data-org-node-id]': 'nodeId()',
    '[attr.aria-selected]': 'node().selected',
    '[attr.aria-expanded]': 'ariaExpanded()',
    '[attr.aria-label]': 'ariaLabel()',
    '(mouseenter)': 'isNodeHovered.set(true)',
    '(mouseleave)': 'isNodeHovered.set(false)',
    '(focusin)': 'onFocusIn($event)',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<OrgChartNodeData> {
  private readonly config = inject(ORG_CHART_CONFIG);
  private readonly layoutService = inject(LayoutService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly dragReorderService = inject(DragReorderService);
  private readonly moveModeService = inject(MoveModeService);
  private readonly nodeFocusService = inject(NodeFocusService);
  private readonly diagramFocusService = inject(DiagramFocusService);
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const request = this.nodeFocusService.current();
      if (request?.target === 'host' && request.id === untracked(this.nodeId)) {
        this.host.nativeElement.focus({ preventScroll: true });
      }
    });

    afterRenderEffect(() => {
      const request = this.nodeFocusService.current();
      if (request?.target === 'firstAction' && request.id === untracked(this.nodeId)) {
        focusFirstNodeAction(this.host.nativeElement);
      }
    });
  }

  node = input.required<Node<OrgChartNodeData>>();

  protected isNodeHovered = signal(false);

  protected isHorizontal = this.layoutService.isHorizontal;

  protected nodeId = computed(() => this.node().id);
  protected isTabStop = computed(() => this.diagramFocusService.entryNodeId() === this.nodeId());
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

  /**
   * The three drop bars, fed by whichever reorder is running. Move mode wins when both could
   * claim the node, and they are mutually exclusive anyway — a pointer drag cancels the mode.
   */
  protected readonly indicators = computed<IndicatorStates | null>(
    () => {
      const id = this.nodeId();

      if (this.moveModeService.isActive()) {
        const own = this.moveModeService.handles().filter((handle) => handle.nodeId === id);
        if (own.length === 0) return null;
        const current = own.find((handle) => handle.current)?.side ?? null;
        return buildIndicatorStates(new Set(own.map((handle) => handle.side)), current);
      }

      if (!this.dragReorderService.isReorderActive()) return null;
      if (!this.dragReorderService.isNodeInDropRange(id)) return null;

      const visible = new Set(visibleDropSides(this.dragReorderService.hiddenSidesFor(id)));
      const highlighted = this.dragReorderService.highlightedIndicator();

      return buildIndicatorStates(visible, highlighted?.nodeId === id ? highlighted.side : null);
    },
    { equal: indicatorStatesEqual },
  );

  protected isRoot = computed(() => {
    // Update computed each time edge changes
    this.modelService.edges();
    const id = this.nodeId();
    const connectedEdges = this.modelService.getConnectedEdges(id);
    return !connectedEdges.some((e) => e.target === id);
  });
  protected readonly containsFocus = computed(
    () => this.diagramFocusService.nodeWithFocusId() === this.nodeId(),
  );
  private readonly actionsAllowed = computed(
    () => !this.dragReorderService.isReorderActive() && !this.moveModeService.isActive(),
  );

  protected showAddButtons = computed(
    () => (this.isNodeHovered() || this.containsFocus()) && this.actionsAllowed(),
  );

  /**
   * Keyboard only, and never on a root. A pointer user drags the card, so the button is not needed
   * on hover. `containsFocus` is already false after a pointer press on the card.
   */
  protected showMoveButton = computed(
    () => this.containsFocus() && !this.isRoot() && this.actionsAllowed(),
  );

  protected readonly ariaExpanded = computed<boolean | null>(() => {
    if (!this.hasChildren()) return null;
    return !getIsCollapsed(this.node());
  });

  protected onFocusIn(event: FocusEvent): void {
    this.diagramFocusService.handleNodeFocus(this.nodeId(), event.relatedTarget);
  }

  protected readonly ariaLabel = computed(() => {
    const node = this.node();
    const data = node.data;
    if (data.type === 'vacant') {
      return data.role ? `Vacant position, ${data.role}` : 'Vacant position';
    }
    const parts: string[] = [data.fullName];
    if (data.role) parts.push(data.role);
    if (data.reports > 0) {
      parts.push(`${data.reports} ${data.reports === 1 ? 'report' : 'reports'}`);
    }
    return parts.join(', ');
  });
}
