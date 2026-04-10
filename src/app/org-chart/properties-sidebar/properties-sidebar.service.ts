import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Node } from 'ng-diagram';
import { isOccupiedNode, isOrgChartNode } from '../diagram/model/guards';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import {
  OrgChartRole,
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
} from '../diagram/model/interfaces';
import { type ComboboxOption } from '../shared/combobox/combobox.component';

/**
 * Manages sidebar visibility state and exposes selection-derived data
 * (selected nodes, parent info, reports-to candidates).
 */
@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);

  readonly isExpanded = signal(false);

  readonly selectedOrgChartNodes = computed<Node<OrgChartNodeData>[]>(() =>
    this.selectionService.selection().nodes.filter(isOrgChartNode),
  );
  readonly selectedNode = computed<Node<OrgChartNodeData> | undefined>(() =>
    this.selectedOrgChartNodes().at(0),
  );
  /** Valid "reports to" targets: all occupied nodes except the selected node and its descendants. */
  readonly reportsToCandidateNodes = computed<Node<OrgChartOccupiedNodeData>[]>(() => {
    const selectedNode = this.selectedNode();
    if (!selectedNode) return [];
    const descendantIds = this.hierarchyService.getDescendantIds(selectedNode.id);
    return this.modelService
      .nodes()
      .filter(
        (node): node is Node<OrgChartOccupiedNodeData> =>
          node.id !== selectedNode.id && !descendantIds.has(node.id) && isOccupiedNode(node),
      );
  });

  readonly roleOptions: ComboboxOption<OrgChartRole>[] = Object.values(OrgChartRole)
    .sort((a, b) => a.localeCompare(b))
    .map((role) => ({ value: role, label: role }));

  readonly selectedNodeParentId = computed<string | null>(() => {
    const node = this.selectedNode();
    return node ? this.hierarchyService.getParentId(node.id) : null;
  });

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const selectedNodes = this.selectedOrgChartNodes();
    if (selectedNodes.length === 0) return 'empty';
    if (selectedNodes.length > 1) return 'multi';
    return 'single';
  });

  expandSidebar(): void {
    this.isExpanded.set(true);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }
}
