import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOrgChartNode, isOrgChartNodeData } from '../guards';
import { type OrgChartEdgeData, type OrgChartNodeData } from '../interfaces';
import { LayoutService } from '../layout/layout.service';

interface ToggleResult {
  toggledNodeUpdate: { id: string; data: OrgChartNodeData };
  subtreeNodeUpdates: { id: string; data: OrgChartNodeData }[];
  subtreeEdgeUpdates: { id: string; data: OrgChartEdgeData }[];
  subtreeIds: Set<string>;
  newCollapsed: boolean;
}

export interface ExpandResult {
  parentPatch: { isCollapsed: false; collapsedChildrenCount: undefined };
  subtreeNodeUpdates: { id: string; data: OrgChartNodeData }[];
  subtreeEdgeUpdates: { id: string; data: OrgChartEdgeData }[];
  subtreeIds: Set<string>;
}

@Injectable()
export class ExpandCollapseService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);

  async toggleCollapsed(nodeId: string): Promise<void> {
    if (!this.layoutService.isIdle()) return;

    const result = this.prepareToggle(nodeId);
    if (!result) return;

    await this.layoutService.applyWithLayout(
      {
        nodeDataUpdates: [result.toggledNodeUpdate, ...result.subtreeNodeUpdates],
        edgeDataUpdates: result.subtreeEdgeUpdates,
      },
      { subtreeIds: result.subtreeIds, collapsing: result.newCollapsed },
    );
  }

  prepareExpand(nodeId: string): ExpandResult | null {
    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNode(node)) return null;

    const subtreeIds = this.computeSubtreeIds(nodeId);
    const { nodeUpdates, edgeUpdates } = this.computeSubtreeVisibilityChanges(subtreeIds, false);

    return {
      parentPatch: { isCollapsed: false, collapsedChildrenCount: undefined },
      subtreeNodeUpdates: nodeUpdates,
      subtreeEdgeUpdates: edgeUpdates,
      subtreeIds,
    };
  }

  computeSubtreeIds(nodeId: string): Set<string> {
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

  countAllDescendants(nodeId: string): number {
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

  private prepareToggle(nodeId: string): ToggleResult | null {
    const node = this.modelService.getNodeById(nodeId);
    if (!node || !isOrgChartNode(node)) return null;

    const newCollapsed = !node.data.isCollapsed;
    const subtreeIds = this.computeSubtreeIds(nodeId);
    const { nodeUpdates, edgeUpdates } = this.computeSubtreeVisibilityChanges(
      subtreeIds,
      newCollapsed,
    );

    const toggledNodeUpdate = {
      id: nodeId,
      data: {
        ...node.data,
        isCollapsed: newCollapsed,
        collapsedChildrenCount: newCollapsed
          ? this.countAllDescendants(nodeId)
          : undefined,
      },
    };

    return {
      toggledNodeUpdate,
      subtreeNodeUpdates: nodeUpdates,
      subtreeEdgeUpdates: edgeUpdates,
      subtreeIds,
      newCollapsed,
    };
  }

  private computeSubtreeVisibilityChanges(
    subtreeIds: Set<string>,
    hidden: boolean,
  ): {
    nodeUpdates: { id: string; data: OrgChartNodeData }[];
    edgeUpdates: { id: string; data: OrgChartEdgeData }[];
  } {
    const nodeUpdates = [...subtreeIds].reduce<{ id: string; data: OrgChartNodeData }[]>(
      (acc, id) => {
        const node = this.modelService.getNodeById(id);
        if (node && isOrgChartNode(node)) {
          acc.push({ id, data: { ...node.data, isHidden: hidden } });
        }
        return acc;
      },
      [],
    );

    const edgeUpdates = this.modelService
      .getModel()
      .getEdges()
      .filter((e) => subtreeIds.has(e.target))
      .map((e) => ({ id: e.id, data: { type: 'orgChart' as const, isHidden: hidden } }));

    return { nodeUpdates, edgeUpdates };
  }
}
