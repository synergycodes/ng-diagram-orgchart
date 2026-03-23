import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, type Node } from 'ng-diagram';
import { isOrgChartNode, isVacantNode } from '../diagram/guards';
import { OrgChartRole, type OrgChartNodeData } from '../diagram/interfaces';
import { type SelectDropdownOption } from '../shared/select-dropdown/select-dropdown.component';

@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);

  readonly selectedOrgChartNodes = computed<Node<OrgChartNodeData>[]>(() =>
    this.selectionService.selection().nodes.filter(isOrgChartNode),
  );
  readonly selectedNode = computed<Node<OrgChartNodeData> | undefined>(() =>
    this.selectedOrgChartNodes().at(0),
  );
  readonly reportsToCandidateNodes = computed<Node<OrgChartNodeData>[]>(() => {
    const selectedNode = this.selectedNode();
    return this.modelService
      .nodes()
      .filter(
        (node): node is Node<OrgChartNodeData> =>
          node.id !== selectedNode?.id && isOrgChartNode(node) && !isVacantNode(node),
      );
  });

  readonly roleOptions: SelectDropdownOption<OrgChartRole>[] = Object.values(OrgChartRole).map(
    (role) => ({ value: role, label: role }),
  );

  readonly isExpanded = linkedSignal<Node<OrgChartNodeData> | undefined, boolean>({
    source: this.selectedNode,
    computation: (node, previous) => (node ? true : (previous?.value ?? false)),
  });

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const selectedNodes = this.selectedOrgChartNodes();
    if (selectedNodes.length === 0) return 'empty';
    if (selectedNodes.length > 1) return 'multi';
    return 'single';
  });

  // `& Record<string, unknown>` here is fix for `updateNodeData` constrains
  updateNodeData(id: string, data: OrgChartNodeData & Record<string, unknown>): void {
    this.modelService.updateNodeData(id, data);
  }

  toggleSidebarVisibility(): void {
    this.isExpanded.update((v) => !v);
  }
}
