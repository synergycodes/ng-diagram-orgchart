import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgDiagramSelectionService } from 'ng-diagram';
import { DragReorderService } from '../../../../drag-reorder/drag-reorder.service';
import { PropertiesSidebarService } from '../../../../properties-sidebar/properties-sidebar.service';
import { LayoutGate } from '../../../layout/layout-gate';
import { AddNodeService, type AddNodeAction } from '../../../model/add-node.service';
import { NodeVisibilityService } from '../../../node-visibility/node-visibility.service';
import { AddButtonComponent } from '../add-button/add-button.component';

@Component({
  selector: 'app-add-buttons-panel',
  templateUrl: './add-buttons-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AddButtonComponent],
  host: {
    style: 'display: contents',
  },
})
export class AddButtonsPanelComponent {
  private readonly dragReorderService = inject(DragReorderService);
  private readonly addNodeService = inject(AddNodeService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly layoutGate = inject(LayoutGate);

  nodeId = input.required<string>();
  isRoot = input(false);
  isHorizontal = input(false);
  isHovered = input(false);

  protected showAddButtons = computed(
    () => this.isHovered() && !this.dragReorderService.isReorderActive(),
  );

  protected isAddButtonDisabled = computed(() => !this.layoutGate.isIdle());

  async onAddLeft(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('siblingBefore');
  }

  async onAddRight(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('siblingAfter');
  }

  async onAddBottom(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addNodeAndExpandSidebar('child');
  }

  private async addNodeAndExpandSidebar(action: AddNodeAction): Promise<void> {
    const newNodeId = await this.addNodeService.addNode(this.nodeId(), action);
    if (newNodeId) {
      this.selectionService.select([newNodeId]);
      this.sidebarService.expandSidebar();
      requestAnimationFrame(() => {
        this.nodeVisibilityService.ensureVisible(newNodeId);
      });
    }
  }
}
