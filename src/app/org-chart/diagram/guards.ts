import { type OrgChartNodeData } from './interfaces';

export function isVacantNode(data: OrgChartNodeData | undefined): boolean {
  return !data?.fullName;
}
