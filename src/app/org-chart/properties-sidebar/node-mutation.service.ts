import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { isOrgChartNodeData } from '../diagram/model/guards';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { type OrgChartNodeData } from '../diagram/model/interfaces';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { ModelChanges } from '../diagram/model/model-changes';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import {
  formDataToNodeData,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';

/**
 * Handles node data updates, hierarchy changes (updating node parent), and node removal.
 * Receives node IDs as parameters — has no dependency on sidebar state.
 */
@Injectable()
export class NodeMutationService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

  // TODO: fix when ng-diagram supports generic updateNodeData. `& Record<string, unknown>` here is fix for `updateNodeData` constrains
  updateNodeData(id: string, data: OrgChartNodeData & Record<string, unknown>): void {
    this.modelService.updateNodeData(id, data);
  }

  /** Deletes the given node, updates parent's hasChildren flag, and re-layouts. */
  async removeNode(nodeId: string): Promise<void> {
    if (!this.layoutGate.isIdle()) return;

    const parentId = this.hierarchyService.getParentId(nodeId);

    const changes = new ModelChanges();
    changes.addDeleteNodeIds(nodeId);

    if (parentId) {
      this.hierarchyService.clearHasChildrenFlags([parentId], changes, new Set([nodeId]));
    }

    await this.modelApplyService.applyWithLayout(changes);
  }

  /** Processes form field changes: updates node data and/or update parent if "reportsTo" changed. */
  handleFieldChange(change: SidebarFieldChange): void {
    const node = this.modelService.getNodeById(change.nodeId);
    if (!node || !isOrgChartNodeData(node.data)) return;

    if (this.hasNodeDataChanges(change)) {
      const updatedNodeData = formDataToNodeData(change.formData, node.data);
      this.updateNodeData(change.nodeId, updatedNodeData);
    }

    if (this.hasHierarchicalChanges(change) && this.layoutGate.isIdle()) {
      this.updateNodeParent(change.nodeId, change.formData.reportsTo);
    }
  }

  private async updateNodeParent(nodeId: string, newParentId: string | null): Promise<void> {
    const changes = this.hierarchyService.updateNodeParent(nodeId, newParentId);
    await this.modelApplyService.applyWithLayout(changes);
    this.nodeVisibilityService.ensureVisible(nodeId);
  }

  private hasHierarchicalChanges(change: SidebarFieldChange): boolean {
    const currentParentId = this.hierarchyService.getParentId(change.nodeId);
    return change.fields.includes('reportsTo') && change.formData.reportsTo !== currentParentId;
  }

  private hasNodeDataChanges(change: SidebarFieldChange): boolean {
    return change.fields.some((f) => f !== 'reportsTo');
  }
}
