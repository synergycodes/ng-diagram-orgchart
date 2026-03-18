import { NgDiagramModelService } from 'ng-diagram';
import { type OrgChartNodeData } from '../interfaces';

/**
 * Count all descendants of a node. Uses stored collapsedChildrenCount
 * on already-collapsed children to skip their subtrees.
 */
export function countAllDescendants(nodeId: string, modelService: NgDiagramModelService): number {
  let count = 0;
  const stack = [nodeId];

  while (stack.length > 0) {
    const parentId = stack.pop()!;
    for (const edge of modelService.getConnectedEdges(parentId)) {
      if (edge.source === parentId) {
        count++;

        const childData = modelService.getNodeById(edge.target)?.data as OrgChartNodeData;
        if (childData?.collapsedChildrenCount != null) {
          count += childData.collapsedChildrenCount;
        } else {
          stack.push(edge.target);
        }
      }
    }
  }

  return count;
}
