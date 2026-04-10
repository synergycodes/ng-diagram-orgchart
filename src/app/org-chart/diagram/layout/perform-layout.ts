import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node } from 'ng-diagram';

// Single ELK instance reused across all layout calls.
const elk = new ELK();

/**
 * Cached maximum node dimensions across all layout runs. Only grows —
 * never shrinks — so that layout spacing stays stable when zoom-driven
 * template variants (full vs compact) produce different sizes.
 */
let cachedMaxWidth = 0;
let cachedMaxHeight = 0;

function getUniformNodeSize(nodes: Node[]): { width: number; height: number } {
  for (const node of nodes) {
    const w = node.measuredBounds?.width ?? node.size?.width ?? 0;
    const h = node.measuredBounds?.height ?? node.size?.height ?? 0;
    if (w > cachedMaxWidth) cachedMaxWidth = w;
    if (h > cachedMaxHeight) cachedMaxHeight = h;
  }
  return { width: cachedMaxWidth, height: cachedMaxHeight };
}

/**
 * Compute tree positions for the given nodes using ELK.js.
 *
 * Converts ng-diagram nodes/edges into the ELK graph format, runs the
 * layout algorithm, and returns a new array of nodes with updated
 * positions.
 */
export async function performLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'DOWN' | 'RIGHT' = 'DOWN',
  nodeSpacing = 140,
) {
  const layoutOptions = {
    'elk.algorithm': 'mrtree',
    'elk.direction': direction,
    'elk.mrtree.edgeRoutingMode': 'MIDDLE_TO_MIDDLE',
    'spacing.nodeNode': String(nodeSpacing),
  };

  const { width, height } = getUniformNodeSize(nodes);

  const nodesToLayout = nodes.map(
    (node): ElkNode => ({
      id: node.id,
      width,
      height,
    }),
  );

  // Build the ELK graph with nodes as children and edges as connections.
  const graph: ElkNode = {
    id: 'root-graph',
    layoutOptions,
    children: nodesToLayout,
    edges: edges.map(({ id, source, target }) => {
      return {
        id,
        sources: [source],
        targets: [target],
      };
    }),
  };

  const { children: laidOutNodes } = await elk.layout(graph);

  const laidOutNodesMap = new Map(laidOutNodes?.map((node) => [node.id, node]));

  return nodes.map((node) => {
    const laidOut = laidOutNodesMap.get(node.id);
    return {
      ...node,
      position: {
        x: laidOut?.x ?? node.position.x,
        y: laidOut?.y ?? node.position.y,
      },
    };
  });
}
