import { type Edge, type Node } from 'ng-diagram';
import {
  OrgChartEdgeData,
  type OrgChartNodeData,
  type OrgChartOccupiedNodeData,
  type OrgChartVacantNodeData,
} from './interfaces';

export function isOrgChartNodeData(data: unknown): data is OrgChartNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data.type === 'occupied' || data.type === 'vacant')
  );
}

export function isOccupiedNodeData(data: unknown): data is OrgChartOccupiedNodeData {
  return isOrgChartNodeData(data) && data.type === 'occupied';
}

export function isVacantNodeData(data: unknown): data is OrgChartVacantNodeData {
  return isOrgChartNodeData(data) && data.type === 'vacant';
}

export function isOrgChartNode(node: Node | null | undefined): node is Node<OrgChartNodeData> {
  return !!node && isOrgChartNodeData(node.data);
}

export function isOccupiedNode(
  node: Node | null | undefined,
): node is Node<OrgChartOccupiedNodeData> {
  return !!node && isOccupiedNodeData(node.data);
}

export function isVacantNode(node: Node | null | undefined): node is Node<OrgChartVacantNodeData> {
  return !!node && isVacantNodeData(node.data);
}

export function isOrgChartEdgeData(data: unknown) {
  return typeof data === 'object' && data !== null;
}

export function isOrgChartEdge(edge: Edge | null | undefined): edge is Edge<OrgChartEdgeData> {
  return !!edge && isOrgChartEdgeData(edge.data);
}
