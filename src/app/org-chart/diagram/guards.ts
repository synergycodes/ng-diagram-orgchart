import { type Node } from 'ng-diagram';
import { VacantNodeData, type OrgChartNodeData } from './interfaces';

export function isOrgChartNodeData(data: unknown): data is OrgChartNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'reports' in data &&
    'span' in data &&
    'shiftCapacity' in data
  );
}

export function isOrgChartNode(node: Node | null | undefined): node is Node<OrgChartNodeData> {
  return !!node && isOrgChartNodeData(node.data);
}

export function isVacantNodeData(data: unknown): data is VacantNodeData {
  return isOrgChartNodeData(data) && data.fullName === undefined;
}

export function isVacantNode(node: Node | null | undefined): node is Node<VacantNodeData> {
  return !!node && isVacantNodeData(node.data);
}
