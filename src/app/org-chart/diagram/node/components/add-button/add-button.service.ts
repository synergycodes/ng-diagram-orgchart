import { inject, Injectable } from '@angular/core';
import { NgDiagramSelectionService } from 'ng-diagram';
import { PropertiesSidebarService } from '../../../../properties-sidebar/properties-sidebar.service';
import { AddNodeService, type AddNodeAction } from '../../../model/add-node.service';
import { NodeVisibilityService } from '../../../node-visibility/node-visibility.service';

@Injectable()
export class AddButtonService {
  private readonly addNodeService = inject(AddNodeService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly sidebarService = inject(PropertiesSidebarService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

  async addNode(nodeId: string, action: AddNodeAction): Promise<void> {
    const newNodeId = await this.addNodeService.addNode(nodeId, action);
    if (newNodeId) {
      this.selectionService.select([newNodeId]);
      this.sidebarService.expandSidebar();
      requestAnimationFrame(() => {
        this.nodeVisibilityService.ensureVisible(newNodeId);
      });
    }
  }
}
