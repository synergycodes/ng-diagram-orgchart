import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { LayoutAnimationService } from '../diagram/animation/layout-animation.service';
import { DiagramComponent } from '../diagram/diagram.component';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { LayoutService } from '../diagram/layout/layout.service';
import { AddNodeService } from '../diagram/model/add-node.service';
import { ExpandCollapseService } from '../diagram/model/expand-collapse.service';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { RemoveNodeService } from '../diagram/model/remove-node.service';
import { SortOrderService } from '../diagram/model/sort-order.service';
import { provideDiagramFocusRegions } from '../diagram/keyboard-navigation/focus/diagram-focus-regions';
import { DiagramFocusService } from '../diagram/keyboard-navigation/focus/diagram-focus.service';
import { provideDiagramModalFocusRestore } from '../diagram/keyboard-navigation/focus/diagram-modal-focus-restore';
import { trackFocusInputModality } from '../diagram/keyboard-navigation/focus/focus-input-modality';
import { NavigationOrderService } from '../diagram/keyboard-navigation/order/navigation-order.service';
import { NodeFocusService } from '../diagram/keyboard-navigation/focus/node-focus.service';
import { ConfirmDeleteDialogComponent } from '../diagram/confirm-delete/confirm-delete-dialog.component';
import { provideConfirmDelete } from '../diagram/confirm-delete/confirm-delete.providers';
import { NodeVisibilityConfigService } from '../diagram/node-visibility/node-visibility-config.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import { ViewportBoundsDirective } from '../diagram/node-visibility/viewport-bounds.directive';
import { ViewportOverlayDirective } from '../diagram/node-visibility/viewport-overlay.directive';
import { AddButtonService } from '../diagram/node/components/add-button/add-button.service';
import { KeyboardShortcutsDialogComponent } from '../keyboard-shortcuts/keyboard-shortcuts-dialog.component';
import { KeyboardShortcutsHotkeyDirective } from '../keyboard-shortcuts/keyboard-shortcuts-hotkey.directive';
import { KeyboardShortcutsTriggerComponent } from '../keyboard-shortcuts/keyboard-shortcuts-trigger.component';
import { provideKeyboardShortcuts } from '../keyboard-shortcuts/keyboard-shortcuts.providers';
import { MinimapPanelComponent } from '../minimap-panel/minimap-panel.component';
import { NodeMutationService } from '../properties-sidebar/node-mutation.service';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
  imports: [
    DiagramComponent,
    PropertiesSidebarComponent,
    TopNavbarComponent,
    MinimapPanelComponent,
    ToolbarHorizontalComponent,
    ViewportBoundsDirective,
    ViewportOverlayDirective,
    KeyboardShortcutsTriggerComponent,
    KeyboardShortcutsDialogComponent,
    ConfirmDeleteDialogComponent,
  ],
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onPageFocusIn($event)',
    '(focusout)': 'onPageFocusOut($event)',
  },
  hostDirectives: [KeyboardShortcutsHotkeyDirective],
  providers: [
    provideNgDiagram(),
    // To customize org-chart settings, uncomment and modify:
    // provideOrgChartConfig({ animation: { durationMs: 500 }, viewport: { zoomStep: 0.2 } }),
    PropertiesSidebarService,
    NodeMutationService,
    SortOrderService,
    ExpandCollapseService,
    LayoutGate,
    LayoutService,
    ModelApplyService,
    HierarchyService,
    AddNodeService,
    RemoveNodeService,
    AddButtonService,
    LayoutAnimationService,
    NodeVisibilityService,
    NodeVisibilityConfigService,
    NavigationOrderService,
    NodeFocusService,
    DiagramFocusService,
    provideDiagramFocusRegions({
      diagram: 'app-diagram',
      retaining: ['app-diagram', 'app-properties-sidebar'],
    }),
    ...provideKeyboardShortcuts(),
    ...provideConfirmDelete(),
    provideDiagramModalFocusRestore(),
  ],
})
export class OrgChartPageComponent {
  private readonly diagramFocusService = inject(DiagramFocusService);

  constructor() {
    trackFocusInputModality();
  }

  onSkipToDiagram(event: Event): void {
    event.preventDefault();
    this.diagramFocusService.focusEntryNode();
  }

  protected onPageFocusIn(event: FocusEvent): void {
    this.diagramFocusService.handlePageFocusIn(event.target);
  }

  protected onPageFocusOut(event: FocusEvent): void {
    this.diagramFocusService.handlePageFocusOut(event.relatedTarget);
  }
}
