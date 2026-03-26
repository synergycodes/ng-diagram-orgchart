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
  const { type, role, description, reportsTo, ...base } = existingData;
  const color = isOccupiedNodeData(existingData) ? existingData.color : undefined;

  const variantData = formData.fullName
    ? { type: 'occupied' as const, fullName: formData.fullName, color }
    : { type: 'vacant' as const };

  return {
    ...base,
    ...variantData,
    role: formData.role ?? undefined,
    description: formData.description || undefined,
    reportsTo: formData.reportsTo ?? undefined,
  };
}
