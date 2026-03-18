import { inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { performLayout } from './perform-layout';

/**
 * Manages org-chart layout and expand/collapse behaviour.
 *
 * Uses ELK.js (via `performLayout`) to position visible nodes in a
 * top-down hierarchy. Hidden nodes (inside collapsed subtrees) are excluded
 * from the layout pass so the chart stays compact.
 */
@Injectable()
export class LayoutService {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  /**
   * Run the ELK layout on all visible nodes and edges.
   * The root node is pinned to its current position so the chart
   * doesn't jump after a re-layout.
   */
  async applyLayout(): Promise<void> {
    // Use getModel() to read the latest committed state directly.
    // Signal-based accessors (modelService.nodes/edges) may not yet
    // reflect updates made within the current transaction.
    const model = this.modelService.getModel();
    const visibleNodes = model.getNodes().filter((n) => !(n.data as OrgChartNodeData).isHidden);
    const visibleEdges = model.getEdges().filter((e) => !(e.data as OrgChartEdgeData).isHidden);

    const positionedNodes = await performLayout(visibleNodes, visibleEdges);

    const rootNode = this.findRootNode();
    if (rootNode) {
      // Offset every node so the root stays where it was before layout.
      const newRoot = positionedNodes.find((n) => n.id === rootNode.id);
      if (!newRoot) return;

      const newRootPosition = newRoot.position;
      const dx = rootNode.position.x - newRootPosition.x;
      const dy = rootNode.position.y - newRootPosition.y;

      this.modelService.updateNodes(
        positionedNodes.map((n) => ({
          id: n.id,
          position: { x: n.position.x + dx, y: n.position.y + dy },
        })),
      );
    } else {
      this.modelService.updateNodes(positionedNodes);
    }
  }

  /**
   * Toggle the collapsed state of a node and update the visibility
   * of its subtree. The collapsed flag and child visibility are
   * batched in a single transaction, followed by a re-layout.
   */
  async toggleCollapsed(nodeId: string): Promise<void> {
    const node = this.modelService.getNodeById(nodeId);

    if (!node) {
      return;
    }

    const newCollapsed = !(node.data as OrgChartNodeData).isCollapsed;
    const subtreeIds = this.computeAvailableSubtreeIds(nodeId);

    // Await the transaction to ensure all updates (collapsed flag +
    // visibility) are committed to the model before re-layout reads them.
    await this.diagramService.transaction(async () => {
      this.modelService.updateNodeData(nodeId, {
        ...(node.data as OrgChartNodeData),
        isCollapsed: newCollapsed,
      });

      this.updateVisibility(subtreeIds, newCollapsed, !newCollapsed ? node.position : undefined);
    });

    await this.applyLayout();
  }

  /**
   * Find the tree root — the node that is never a target of any edge.
   */
  private findRootNode() {
    const model = this.modelService.getModel();
    const targetIds = new Set(model.getEdges().map((e) => e.target));
    return model.getNodes().find((n) => !targetIds.has(n.id)) ?? null;
  }

  /**
   * Walk the subtree starting from `nodeId`, collecting descendant IDs.
   * Stops descending into children that are themselves collapsed, so
   * their subtrees remain hidden when expanding a parent.
   */
  private computeAvailableSubtreeIds(nodeId: string): Set<string> {
    const childrenIds = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      for (const edge of this.modelService.getConnectedEdges(parentId)) {
        if (edge.source === parentId) {
          childrenIds.add(edge.target);

          const childData = this.modelService.getNodeById(edge.target)?.data as OrgChartNodeData;
          if (!childData?.isCollapsed) {
            stack.push(edge.target);
          }
        }
      }
    }

    return childrenIds;
  }

  /**
   * Set `isHidden` on the affected subtree nodes and their incoming
   * edges. Only touches elements in `subtreeIds` — edges are matched
   * by target so the parent-to-child edge follows the child's visibility.
   */
  private updateVisibility(
    subtreeIds: Set<string>,
    hidden: boolean,
    parentPosition?: { x: number; y: number },
  ): void {
    this.modelService.updateNodes(
      [...subtreeIds].reduce<
        { id: string; data: OrgChartNodeData; position?: { x: number; y: number } }[]
      >((acc, id) => {
        const node = this.modelService.getNodeById(id);
        if (!node) return acc;

        acc.push({
          id,
          data: {
            ...(node.data as OrgChartNodeData),
            isHidden: hidden,
          },
          // When expanding, place children at the parent's position so they
          // fan out from it once the layout runs — avoids a visual blink
          // from a random previous position.
          ...(parentPosition ? { position: parentPosition } : {}),
        });

        return acc;
      }, []),
    );

    this.modelService.updateEdges(
      this.modelService
        .getModel()
        .getEdges()
        .filter((e) => subtreeIds.has(e.target))
        .map((e) => ({
          id: e.id,
          data: {
            isHidden: hidden,
          },
        })),
    );
  }
}
