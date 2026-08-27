import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { LayoutGate } from '../diagram/layout/layout-gate';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import { type OrgChartNodeData } from '../diagram/model/interfaces';
import { ModelApplyService } from '../diagram/model/model-apply.service';
import { NodeVisibilityService } from '../diagram/node-visibility/node-visibility.service';
import {
  formDataToNodeData,
  type SidebarFieldChange,
} from './components/sidebar-form/sidebar-form.mappers';

/**
 * Handles node data updates and hierarchy changes (updating node parent).
 * Receives node IDs as parameters.
 */
@Injectable()
export class NodeMutationService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly modelApplyService = inject(ModelApplyService);
  private readonly nodeVisibilityService = inject(NodeVisibilityService);

  /** Processes form field changes: updates node data and/or update parent if "reportsTo" changed. */
  handleFieldChange(change: SidebarFieldChange): void {
    const node = this.modelService.getNodeById<OrgChartNodeData>(change.nodeId);
    if (!node) return;

    if (this.hasNodeDataChanges(change)) {
      const updatedNodeData = formDataToNodeData(change.formData, node.data);
      this.modelService.updateNodeData(change.nodeId, updatedNodeData);
    }

    if (this.hasHierarchicalChanges(change) && this.layoutGate.isIdle()) {
      this.updateNodeParent(change.nodeId, change.formData.reportsTo);
    }
  }

  private async updateNodeParent(nodeId: string, newParentId: string | null): Promise<void> {
    const { changes, visibilityHint } = this.hierarchyService.updateNodeParent(nodeId, newParentId);
    await this.modelApplyService.applyWithLayout(changes, { visibility: visibilityHint });
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
