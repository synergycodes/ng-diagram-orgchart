import { isOrgChartNodeData } from '../../../diagram/guards';
import { ModelChanges } from '../../../diagram/model-changes';
import type { DropActionStrategy, DropDeps } from '../drop-strategy.interface';

export function createChildDropAction(deps: DropDeps): DropActionStrategy {
  const { modelService, hierarchyService, expandCollapseService } = deps;

  return {
    execute({ draggedNodeId, targetNodeId: newParentId }) {
      const changes = new ModelChanges();

      let expandSubtreeIds: Set<string> | undefined;
      const targetNode = modelService.getNodeById(newParentId);
      if (targetNode && isOrgChartNodeData(targetNode.data) && targetNode.data.isCollapsed) {
        expandSubtreeIds = expandCollapseService.prepareToggle(
          newParentId,
          changes,
        )?.toggledSubtreeIds;
      }

      hierarchyService.updateNodeParent(draggedNodeId, newParentId, undefined, changes);

      return {
        changes,
        visibilityHint: expandSubtreeIds
          ? { subtreeIds: expandSubtreeIds, collapsing: false }
          : undefined,
      };
    },
  };
}
