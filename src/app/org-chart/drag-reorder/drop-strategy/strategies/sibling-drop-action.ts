import type { HierarchyService } from '../../../diagram/model/hierarchy.service';
import type { DropZone } from '../../zone-detection';
import type { DropActionStrategy } from '../drop-strategy.interface';

const sideToPosition: Record<DropZone, 'before' | 'after'> = {
  left: 'before',
  right: 'after',
  bottom: 'after',
};

/** Drop as sibling: places the dragged node before or after the target under the target's parent. */
export function createSiblingDropAction(hierarchyService: HierarchyService): DropActionStrategy {
  return {
    execute({ draggedNodeId, targetNodeId, side }) {
      const newParentId = hierarchyService.getParentId(targetNodeId);
      return hierarchyService.updateNodeParent(
        draggedNodeId,
        newParentId,
        newParentId ? { referenceId: targetNodeId, position: sideToPosition[side] } : undefined,
      );
    },
  };
}
