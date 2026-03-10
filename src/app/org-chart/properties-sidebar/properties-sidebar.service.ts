import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
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

  readonly isExpanded = signal(false);

  readonly selectedNode = computed<Node<OrgChartNodeData> | undefined>(
    () => this.selectionService.selection().nodes.at(0) as Node<OrgChartNodeData> | undefined,
  );

  readonly sidebarState = computed<'empty' | 'single' | 'multi'>(() => {
    const sel = this.selectionService.selection();
    if (sel.nodes.length === 0) return 'empty';
    if (sel.nodes.length > 1) return 'multi';
    return 'single';
  });

  constructor() {
    effect(() => {
      const node = this.selectedNode();

      untracked(() => {
        if (node) {
          this.isExpanded.set(true);
        }
      });
    });
  }

  updateNodeData(id: string, data: OrgChartNodeData): void {
    this.diagramService.transaction(() => {
      this.modelService.updateNodeData(id, data);
    });
  }

  toggle(): void {
    this.isExpanded.update((v) => !v);
  }
}
