import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { NgDiagramModelService, type Node } from 'ng-diagram';
import { type OrgChartNodeData } from '../../../diagram/interfaces';
import { PropertiesSidebarService } from '../../properties-sidebar.service';
import { InitialsAvatarComponent } from '../../../shared/initials-avatar/initials-avatar.component';

@Component({
  selector: 'app-reports-to-field',
  imports: [InitialsAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports-to-field.component.html',
  styleUrl: './reports-to-field.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ReportsToFieldComponent {
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly elRef = inject(ElementRef);

  node = input.required<Node<OrgChartNodeData>>();

  protected readonly isOpen = signal(false);

  protected readonly parentNodeId = computed(() => {
    const data = this.node().data as OrgChartNodeData;
    return data.reportsTo ?? null;
  });

  protected readonly candidates = computed(() => {
    const currentNode = this.node();
    const nodes = this.modelService.nodes();

    return nodes
      .filter((n) => n.id !== currentNode.id && (n.data as OrgChartNodeData).fullName)
      .map((n) => {
        const data = n.data as OrgChartNodeData;
        return {
          id: n.id,
          name: data.fullName!,
          color: data.color ?? '#999',
        };
      });
  });

  protected readonly selectedCandidate = computed(() => {
    const parentId = this.parentNodeId();
    if (!parentId) return null;
    return this.candidates().find((c) => c.id === parentId) ?? null;
  });

  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  protected toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  protected onSelect(newParentId: string | null): void {
    this.isOpen.set(false);
    const node = this.node();
    const currentData = node.data as OrgChartNodeData;
    this.sidebarService.updateNodeData(node.id, {
      ...currentData,
      reportsTo: newParentId ?? undefined,
    });
  }
}
