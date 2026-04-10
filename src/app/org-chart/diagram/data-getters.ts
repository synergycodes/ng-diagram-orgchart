import { Edge, type Node } from 'ng-diagram';
import { type OrgChartNodeData } from './interfaces';

type WithData = { data?: Partial<OrgChartNodeData> };
type AnyPart = Node | Edge | WithData;

export function getIsCollapsed(part: AnyPart) {
  return (part as WithData).data?.isCollapsed;
}

export function getIsHidden(part: AnyPart) {
  return (part as WithData).data?.isHidden;
}

export function getHasChildren(node: Node | WithData) {
  return (node as WithData).data?.hasChildren;
}

export function getCollapsedChildrenCount(node: Node | WithData) {
  return (node as WithData).data?.collapsedChildrenCount;
}
