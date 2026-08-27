import { inject, Injectable } from '@angular/core';
import { NgDiagramSelectionService } from 'ng-diagram';
import { findNodeHost } from '../../../keyboard-navigation/focus/diagram-focus-level';
import { AddNodeService, type AddNodeAction } from '../../../model/add-node.service';
import { NodeVisibilityService } from '../../../node-visibility/node-visibility.service';
import { PropertiesSidebarService } from '../../../../properties-sidebar/properties-sidebar.service';

@Injectable()
export class AddButtonService {
  private readonly addNodeService = inject(AddNodeService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);
  private readonly sidebarService = inject(PropertiesSidebarService);

  /**
   * Adds a node relative to `nodeId`, selects it, brings it into view, and opens the
   * properties panel with the new node's host as opener — so `Escape` in the panel
   * returns focus to the new node.
   */
  async addNode(nodeId: string, action: AddNodeAction): Promise<string | undefined> {
    const newNodeId = await this.addNodeService.addNode(nodeId, action);
    if (newNodeId == null) return undefined;
    this.selectionService.select([newNodeId]);
    requestAnimationFrame(() => {
      this.nodeVisibilityService.ensureVisible(newNodeId);
      this.sidebarService.expandSidebar(findNodeHost(newNodeId));
    });
    return newNodeId;
  }
}
