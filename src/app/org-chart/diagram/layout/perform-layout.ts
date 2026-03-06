import ELK, { type ElkNode } from 'elkjs';
import { type Edge, type Node } from 'ng-diagram';

// Single ELK instance reused across all layout calls.
const elk = new ELK();

/**
 * Compute tree positions for the given nodes using ELK.js.
 *
 * Converts ng-diagram nodes/edges into the ELK graph format, runs the
 * layout algorithm, and returns a new array of nodes with updated
 * positions.
 */
export async function performLayout(nodes: Node[], edges: Edge[], direction: 'DOWN' | 'RIGHT' = 'DOWN') {
  const layoutOptions = {
    'elk.algorithm': 'mrtree',
    'elk.direction': direction,
    'spacing.nodeNode': '140',
  };
  // Use the largest measured node size so all nodes occupy the same
  // bounding box in the layout.
  const MAX_WIDTH = 267;
  const MAX_HEIGHT = 247;

  const nodesToLayout = nodes.map(
    ({ id: nodeId }): ElkNode => ({
      id: nodeId,
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
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
