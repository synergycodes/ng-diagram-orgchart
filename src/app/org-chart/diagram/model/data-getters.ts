import { OrgChartBaseNodeData } from './interfaces';

type WithOrgData = { data?: Partial<OrgChartBaseNodeData> };

export function getIsCollapsed(part: WithOrgData) {
  return part.data?.isCollapsed;
}

export function getIsHidden(part: WithOrgData) {
  return part.data?.isHidden;
}

export function getHasChildren(part: WithOrgData) {
  return part.data?.hasChildren;
}

export function getCollapsedChildrenCount(part: WithOrgData) {
  return part.data?.collapsedChildrenCount;
}
