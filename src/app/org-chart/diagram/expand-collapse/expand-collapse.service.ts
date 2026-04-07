import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNode, isOrgChartNodeData } from '../guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { ModelChanges } from '../model-changes';

export interface ToggleResult {
  changes: ModelChanges;
  toggledSubtreeIds: Set<string>;
  collapsing: boolean;
}

@Injectable()
export class ExpandCollapseService {
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Computes all model mutations needed to toggle a node's collapsed state.
   * Does not apply changes — the caller is responsible for committing them.
   *
   * @param nodeId - The node whose collapsed state should be flipped.
   * @param modelChanges - Accumulator for model changes; created if not provided.
   * @returns Model changes and metadata — or `null` if the node is not a valid org-chart node.
   *          `toggledSubtreeIds` — IDs of visible descendants affected by the toggle (for layout animation).
   *          `collapsing` — the collapsed state after the toggle (`true` = collapsing, `false` = expanding).
   */
  prepareToggle(
    nodeId: string,
    modelChanges: ModelChanges = new ModelChanges(),
  ): ToggleResult | null {
    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNode(node)) return null;

    const collapsing = !node.data.isCollapsed;
    const subtreeIds = this.getVisibleDescendantIds(nodeId);
    const { nodeUpdates, edgeUpdates } = this.computeSubtreeVisibilityChanges(
      subtreeIds,
      collapsing,
    );

    modelChanges.addNodeUpdates(
      {
        id: nodeId,
        data: {
          ...node.data,
          isCollapsed: collapsing,
          collapsedChildrenCount: collapsing ? this.countAllDescendants(nodeId) : undefined,
        },
      },
      ...nodeUpdates,
    );
    modelChanges.addEdgeUpdates(...edgeUpdates);

    return {
      changes: modelChanges,
      toggledSubtreeIds: subtreeIds,
      collapsing,
    };
  }

  /**
   * Collects all descendant IDs via DFS, stopping at collapsed nodes.
   *
   * @param nodeId - The root node to start traversal from (excluded from the result).
   * @returns Set of descendant node IDs that are currently visible in the tree.
   */
  private getVisibleDescendantIds(nodeId: string): Set<string> {
    const ids = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        if (edge.source !== parentId) continue;
        ids.add(edge.target);

        const childData = this.modelService.getNodeById(edge.target)?.data;
        if (isOrgChartNodeData(childData) && !childData?.isCollapsed) stack.push(edge.target);
      }
    }

    return ids;
  }

  /**
   * Counts all descendants, using stored `collapsedChildrenCount` to skip collapsed subtrees.
   *
   * @param nodeId - The root node to count descendants for (excluded from the count).
   * @returns Total number of descendants, including those hidden behind collapsed nodes.
   */
  private countAllDescendants(nodeId: string): number {
    let count = 0;
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        if (edge.source === parentId) {
          count++;

          const childData = this.modelService.getNodeById(edge.target)?.data;
          if (isOrgChartNodeData(childData) && childData.collapsedChildrenCount != null) {
            count += childData.collapsedChildrenCount;
          } else {
            stack.push(edge.target);
          }
        }
      }
    }

    return count;
  }

  /** Builds node and edge patches that set `isHidden` for all nodes in the given subtree. */
  private computeSubtreeVisibilityChanges(
    subtreeIds: Set<string>,
    hidden: boolean,
  ): {
    nodeUpdates: { id: string; data: OrgChartNodeData }[];
    edgeUpdates: { id: string; data: OrgChartEdgeData }[];
  } {
    const nodeUpdates: { id: string; data: OrgChartNodeData }[] = [];
    for (const id of subtreeIds) {
      const node = this.modelService.getNodeById(id);
      if (!node || !isOrgChartNode(node)) continue;
      nodeUpdates.push({ id, data: { ...node.data, isHidden: hidden } });
    }

    const edgeUpdates: { id: string; data: OrgChartEdgeData }[] = [];
    for (const id of subtreeIds) {
      for (const edge of this.modelService.getConnectedEdges(id)) {
        if (edge.target === id) {
          edgeUpdates.push({ id: edge.id, data: { type: 'orgChart', isHidden: hidden } });
        }
      }
    }

    return { nodeUpdates, edgeUpdates };
  }
}
