import { isOrgChartNodeData } from '../../../diagram/guards';
import { ModelChanges } from '../../../diagram/model-changes';
import type { DropActionStrategy, DropDeps } from '../drop-strategy.interface';

export function createChildDropAction(deps: DropDeps): DropActionStrategy {
  const { modelService, hierarchyService, sortOrderService, expandCollapseService } = deps;

  return {
    execute({ draggedNodeId, targetNodeId: newParentId }) {
      const oldParentId = hierarchyService.getParentId(draggedNodeId);

      const changes = new ModelChanges();

      let expandSubtreeIds: Set<string> | undefined;
      const targetNode = modelService.getNodeById(newParentId);
      if (targetNode && isOrgChartNodeData(targetNode.data) && targetNode.data.isCollapsed) {
        expandSubtreeIds = expandCollapseService.prepareToggle(
          newParentId,
          changes,
        )?.toggledSubtreeIds;
      }

      const incomingEdge = modelService
        .getConnectedEdges(draggedNodeId)
        .find((e) => e.target === draggedNodeId);
      hierarchyService.computeEdgeMutations(changes, draggedNodeId, newParentId, incomingEdge);

      hierarchyService.computeParentFlagUpdates(changes, draggedNodeId, oldParentId, newParentId);

      if (oldParentId) {
        sortOrderService.reorderChildren(oldParentId, [], changes, new Set([draggedNodeId]));
      }

      sortOrderService.reorderChildren(
        newParentId,
        [{ nodeId: draggedNodeId, referenceId: null, position: 'after' }],
        changes,
      );

      return {
        changes,
        visibilityHint: expandSubtreeIds
          ? { subtreeIds: expandSubtreeIds, collapsing: false }
          : undefined,
      };
    },
  };
}
