import type { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNode } from '../../../diagram/guards';
import type { DropActionStrategy } from '../drop-strategy.interface';

export const childDropAction: DropActionStrategy = {
  getDropParams({ targetNodeId, modelService }) {
    const lastChild = getSortedChildren(targetNodeId, modelService).at(-1);
    const targetNode = modelService.getNodeById(targetNodeId);
    const shouldExpand = isOrgChartNode(targetNode) && !!targetNode.data.isCollapsed;

    return {
      newParentId: targetNodeId,
      sortOrder: lastChild ? lastChild.sortOrder + 1 : 0,
      shouldExpand,
    };
  },
};

function getSortedChildren(
  parentId: string,
  modelService: NgDiagramModelService,
): { id: string; sortOrder: number }[] {
  return modelService
    .getConnectedEdges(parentId)
    .filter((e) => e.source === parentId)
    .map((e) => {
      const node = modelService.getNodeById(e.target);
      return {
        id: e.target,
        sortOrder: isOrgChartNode(node) ? (node.data.sortOrder ?? 0) : 0,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
