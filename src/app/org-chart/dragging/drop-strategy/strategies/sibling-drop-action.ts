import { ModelChanges } from '../../../diagram/model-changes';
import type { DropZone } from '../../zone-detection';
import type { DropActionStrategy, DropDeps } from '../drop-strategy.interface';

const sideToPosition: Record<DropZone, 'before' | 'after'> = {
  left: 'before',
  right: 'after',
  bottom: 'after',
};

export function createSiblingDropAction(deps: DropDeps): DropActionStrategy {
  const { hierarchyService, sortOrderService } = deps;

  return {
    execute({ draggedNodeId, targetNodeId, side }) {
      const position = sideToPosition[side];

      const oldParentId = hierarchyService.getParentId(draggedNodeId);
      const newParentId = hierarchyService.getParentId(targetNodeId);

      const changes = new ModelChanges();
      const isSameParent = newParentId === oldParentId;

      if (isSameParent) {
        if (!newParentId) return { changes };

        sortOrderService.reorderChildren(
          newParentId,
          [{ nodeId: draggedNodeId, referenceId: targetNodeId, position }],
          changes,
          new Set([draggedNodeId]),
        );

        return { changes };
      }

      const incomingEdge = deps.modelService
        .getConnectedEdges(draggedNodeId)
        .find((e) => e.target === draggedNodeId);
      hierarchyService.computeEdgeMutations(changes, draggedNodeId, newParentId, incomingEdge);

      hierarchyService.computeParentFlagUpdates(changes, draggedNodeId, oldParentId, newParentId);

      if (oldParentId) {
        sortOrderService.reorderChildren(oldParentId, [], changes, new Set([draggedNodeId]));
      }

      if (newParentId) {
        sortOrderService.reorderChildren(
          newParentId,
          [{ nodeId: draggedNodeId, referenceId: targetNodeId, position }],
          changes,
        );
      }

      return { changes };
    },
  };
}
