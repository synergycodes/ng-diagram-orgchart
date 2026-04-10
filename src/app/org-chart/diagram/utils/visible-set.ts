import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';
import { isOrgChartEdge, isOrgChartNode } from '../guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { getIsHidden } from '../data-getters';

export function getVisibleSet(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): {
  nodes: DiagramNode<OrgChartNodeData>[];
  edges: DiagramEdge<OrgChartEdgeData>[];
} {
  return {
    nodes: nodes.filter(
      (node): node is DiagramNode<OrgChartNodeData> => isOrgChartNode(node) && !getIsHidden(node),
    ),
    edges: edges.filter(
      (edge): edge is DiagramEdge<OrgChartEdgeData> => isOrgChartEdge(edge) && !getIsHidden(edge),
    ),
  };
}

export function getFutureVisibleSet(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  subtreeIds: Set<string>,
  collapsing: boolean,
): {
  nodes: DiagramNode<OrgChartNodeData>[];
  edges: DiagramEdge<OrgChartEdgeData>[];
} {
  const willBeVisible = (id: string, isHidden: boolean) =>
    collapsing ? !isHidden && !subtreeIds.has(id) : !isHidden || subtreeIds.has(id);

  return {
    nodes: nodes.filter(
      (n): n is DiagramNode<OrgChartNodeData> =>
        isOrgChartNode(n) && willBeVisible(n.id, !!getIsHidden(n)),
    ),
    edges: edges.filter(
      (edge): edge is DiagramEdge<OrgChartEdgeData> =>
        isOrgChartEdge(edge) && willBeVisible(edge.target, !!getIsHidden(edge)),
    ),
  };
}

export function findRootNode(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode | null {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targetIds.has(n.id)) ?? null;
}
