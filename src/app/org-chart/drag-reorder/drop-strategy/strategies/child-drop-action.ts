import type { HierarchyService } from '../../../diagram/model/hierarchy.service';
import type { DropActionStrategy } from '../drop-strategy.interface';

/** Drop as child: reparents the dragged node under the target, expanding it if collapsed. */
export function createChildDropAction(hierarchyService: HierarchyService): DropActionStrategy {
  return {
    execute({ draggedNodeId, targetNodeId: newParentId }) {
      return hierarchyService.updateNodeParent(draggedNodeId, newParentId);
    },
  };
}
