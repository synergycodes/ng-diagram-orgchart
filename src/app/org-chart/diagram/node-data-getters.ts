import { type Node } from 'ng-diagram';
import { type OrgChartNodeData } from './interfaces';

export function getIsCollapsed(node: Node<OrgChartNodeData>) {
  return node.data.isCollapsed;
}

export function getIsHidden(node: Node<OrgChartNodeData>) {
  return node.data.isHidden;
}

export function getHasChildren(node: Node<OrgChartNodeData>) {
  return node.data.hasChildren;
}

export function getCollapsedChildrenCount(node: Node<OrgChartNodeData>) {
  return node.data.collapsedChildrenCount;
}
