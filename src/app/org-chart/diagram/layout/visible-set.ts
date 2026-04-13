import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';
import { isOrgChartEdge, isOrgChartNode } from '../model/guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../model/interfaces';
import { getIsHidden } from '../model/data-getters';

/**
 * Returns the subset of nodes and edges that are currently visible
 * (not hidden inside a collapsed subtree).
 */
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

/**
 * Predicts the visible set after a collapse/expand toggle is applied.
 *
 * @param subtreeIds IDs of nodes in the toggled subtree.
 * @param collapsing `true` when collapsing (hide subtree), `false` when expanding (reveal subtree).
 */
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

/** Finds the root node — the one that is never an edge target. */
export function findRootNode(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode | null {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targetIds.has(n.id)) ?? null;
}
