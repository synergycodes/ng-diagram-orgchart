import { ModelChanges } from '../../../diagram/model/model-changes';
import type { DropZone } from '../../zone-detection';
import type { DropActionStrategy, DropDeps } from '../drop-strategy.interface';

const sideToPosition: Record<DropZone, 'before' | 'after'> = {
  left: 'before',
  right: 'after',
  bottom: 'after',
};

/** Drop as sibling: places the dragged node before or after the target under the same parent. */
export function createSiblingDropAction(deps: DropDeps): DropActionStrategy {
  const { hierarchyService, sortOrderService } = deps;

  return {
    execute({ draggedNodeId, targetNodeId, side }) {
      const position = sideToPosition[side];

      const oldParentId = hierarchyService.getParentId(draggedNodeId);
      const newParentId = hierarchyService.getParentId(targetNodeId);

      if (newParentId === oldParentId) {
        if (!newParentId) return { changes: new ModelChanges() };

        const changes = new ModelChanges();
        sortOrderService.reorderChildren(
          newParentId,
          [{ nodeId: draggedNodeId, referenceId: targetNodeId, position }],
          changes,
          new Set([draggedNodeId]),
        );

        return { changes };
      }

      return hierarchyService.updateNodeParent(
        draggedNodeId,
        newParentId,
        newParentId ? { referenceId: targetNodeId, position } : undefined,
      );
    },
  };
}
