import { isOccupiedNodeData } from '../../../diagram/guards';
import { type OrgChartNodeData, type OrgChartRole } from '../../../diagram/interfaces';

export interface SidebarFormData {
  fullName: string;
  role: OrgChartRole | null;
  description: string;
  reportsTo: string | null;
}

export const EMPTY_FORM: SidebarFormData = {
  fullName: '',
  role: null,
  description: '',
  reportsTo: null,
};

export function nodeDataToFormData(data: OrgChartNodeData): SidebarFormData {
  return {
    fullName: isOccupiedNodeData(data) ? data.fullName : '',
    role: data.role ?? null,
    description: data.description ?? '',
    reportsTo: data.reportsTo ?? null,
  };
}

// TODO: remove `& Record<string, unknown>` when ng-diagram supports generic updateNodeData
export function formDataToNodeData(
  formData: SidebarFormData,
  existingData: OrgChartNodeData,
): OrgChartNodeData & Record<string, unknown> {
  const variantData = formData.fullName
    ? {
        type: 'occupied' as const,
        fullName: formData.fullName,
        color: isOccupiedNodeData(existingData) ? existingData.color : undefined,
      }
    : { type: 'vacant' as const };

  return {
    ...variantData,
    role: formData.role ?? undefined,
    description: formData.description || undefined,
    reports: existingData.reports,
    span: existingData.span,
    shiftCapacity: existingData.shiftCapacity,
    reportsTo: formData.reportsTo ?? undefined,
    isCollapsed: existingData.isCollapsed,
    collapsedChildrenCount: existingData.collapsedChildrenCount,
    hasChildren: existingData.hasChildren,
    isHidden: existingData.isHidden,
  };
}
