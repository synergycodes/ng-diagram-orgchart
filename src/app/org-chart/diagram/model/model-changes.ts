import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';
import { type OrgChartEdgeData, type OrgChartNodeData } from './interfaces';

export type NodeUpdate = Omit<Partial<DiagramNode<OrgChartNodeData>>, 'data'> & {
  id: string;
  data?: Partial<OrgChartNodeData>;
};
export type EdgeUpdate = Omit<Partial<DiagramEdge<OrgChartEdgeData>>, 'data'> & {
  id: string;
  data?: Partial<OrgChartEdgeData>;
};

/**
 * Accumulates pending model mutations (adds, updates, deletes) that are
 * applied atomically in a single transaction via {@link ModelApplyService}.
 */
export class ModelChanges {
  readonly nodeUpdates: NodeUpdate[] = [];
  readonly edgeUpdates: EdgeUpdate[] = [];
  readonly newNodes: DiagramNode<OrgChartNodeData>[] = [];
  readonly newEdges: DiagramEdge<OrgChartEdgeData>[] = [];
  readonly deleteNodeIds: string[] = [];
  readonly deleteEdgeIds: string[] = [];

  addNodeUpdates(...updates: NodeUpdate[]): void {
    this.nodeUpdates.push(...updates);
  }

  addEdgeUpdates(...updates: EdgeUpdate[]): void {
    this.edgeUpdates.push(...updates);
  }

  addNewNodes(...nodes: DiagramNode<OrgChartNodeData>[]): void {
    this.newNodes.push(...nodes);
  }

  addNewEdges(...edges: DiagramEdge<OrgChartEdgeData>[]): void {
    this.newEdges.push(...edges);
  }

  addDeleteNodeIds(...ids: string[]): void {
    this.deleteNodeIds.push(...ids);
  }

  addDeleteEdgeIds(...ids: string[]): void {
    this.deleteEdgeIds.push(...ids);
  }
}
