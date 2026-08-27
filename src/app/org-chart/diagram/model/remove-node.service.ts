import { inject, Injectable } from '@angular/core';
import { HierarchyService } from './hierarchy.service';
import { ModelApplyService } from './model-apply.service';
import { ModelChanges } from './model-changes';

/** Removes a node from the model. The counterpart of `AddNodeService`. */
@Injectable()
export class RemoveNodeService {
  private readonly hierarchyService = inject(HierarchyService);
  private readonly modelApplyService = inject(ModelApplyService);

  async removeNode(nodeId: string): Promise<void> {
    const parentId = this.hierarchyService.getParentId(nodeId);

    const changes = new ModelChanges();
    changes.addDeleteNodeIds(nodeId);

    if (parentId) {
      this.hierarchyService.clearHasChildrenFlags([parentId], changes, new Set([nodeId]));
    }

    await this.modelApplyService.applyWithLayout(changes);
  }
}
