import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';
import { isOrgChartEdge, isOrgChartNode } from '../model/guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../model/interfaces';

/**
 * Returns the subset of nodes and edges that are currently visible
 * (not hidden inside a collapsed subtree). An edge is visible when
 * both of its endpoint nodes are visible.
 */
export function getVisibleSet(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
): {
  nodes: DiagramNode<OrgChartNodeData>[];
  edges: DiagramEdge<OrgChartEdgeData>[];
} {
  const visibleNodes = nodes.filter(
    (node): node is DiagramNode<OrgChartNodeData> => isOrgChartNode(node) && !node.hidden,
  );
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  return {
    nodes: visibleNodes,
    edges: edges.filter(
      (edge): edge is DiagramEdge<OrgChartEdgeData> =>
        isOrgChartEdge(edge) && visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
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
  const hiddenById = new Map(nodes.map((node) => [node.id, !!node.hidden]));
  const willBeVisible = (id: string) => {
    const isHidden = hiddenById.get(id) ?? false;
    return collapsing ? !isHidden && !subtreeIds.has(id) : !isHidden || subtreeIds.has(id);
  };

  return {
    nodes: nodes.filter(
      (n): n is DiagramNode<OrgChartNodeData> => isOrgChartNode(n) && willBeVisible(n.id),
    ),
    edges: edges.filter(
      (edge): edge is DiagramEdge<OrgChartEdgeData> =>
        isOrgChartEdge(edge) && willBeVisible(edge.source) && willBeVisible(edge.target),
    ),
  };
}

/** Finds the root node — the one that is never an edge target. */
export function findRootNode(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode | null {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !targetIds.has(n.id)) ?? null;
}
