import {
  COLLAPSED_CHILDREN_COUNT,
  HAS_CHILDREN,
  IS_COLLAPSED,
  SORT_ORDER,
  type OrgChartBaseNodeData,
} from './interfaces';

type WithOrgData = { data?: Partial<OrgChartBaseNodeData> };

export function getIsCollapsed(part: WithOrgData) {
  return part.data?.[IS_COLLAPSED];
}

export function getHasChildren(part: WithOrgData) {
  return part.data?.[HAS_CHILDREN];
}

export function getCollapsedChildrenCount(part: WithOrgData) {
  return part.data?.[COLLAPSED_CHILDREN_COUNT];
}

export function getSortOrder(part: WithOrgData) {
  return part.data?.[SORT_ORDER];
}
