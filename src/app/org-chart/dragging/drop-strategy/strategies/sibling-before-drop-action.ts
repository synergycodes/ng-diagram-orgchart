import { isOrgChartNode } from '../../../diagram/guards';
import type { DropActionStrategy } from '../drop-strategy.interface';

export const siblingBeforeDropAction: DropActionStrategy = {
  getDropParams({ targetNodeId, modelService, hierarchyService }) {
    const targetNode = modelService.getNodeById(targetNodeId);
    const targetSortOrder = isOrgChartNode(targetNode) ? (targetNode.data.sortOrder ?? 0) : 0;

    return {
      newParentId: hierarchyService.getParentId(targetNodeId),
      sortOrder: targetSortOrder - 0.5,
      shouldExpand: false,
    };
  },
};
