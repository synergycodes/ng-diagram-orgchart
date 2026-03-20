import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  type Node,
} from 'ng-diagram';
import { type OrgChartNodeData } from '../diagram/interfaces';

@Injectable()
export class PropertiesSidebarService {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  readonly selectedNode = computed<Node<OrgChartNodeData> | undefined>(
    () => this.selectionService.selection().nodes.at(0) as Node<OrgChartNodeData> | undefined,
  );

  readonly isExpanded = linkedSignal({
    source: this.selectedNode,
    computation: (node, previous) => (node ? true : (previous?.value ?? false)),
  });

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const sel = this.selectionService.selection();
    if (sel.nodes.length === 0) return 'empty';
    if (sel.nodes.length > 1) return 'multi';
    return 'single';
  });

  // `& Record<string, unknown>` here is fix for `updateNodeData` constrains
  updateNodeData(id: string, data: OrgChartNodeData & Record<string, unknown>): void {
    this.diagramService.transaction(() => {
      this.modelService.updateNodeData(id, data);
    });
  }

  toggle(): void {
    this.isExpanded.update((v) => !v);
  }
}
