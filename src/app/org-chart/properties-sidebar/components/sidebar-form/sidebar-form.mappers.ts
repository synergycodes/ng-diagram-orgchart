import { InjectionToken } from '@angular/core';
import { isOccupiedNodeData } from '../../../diagram/guards';
import { type OrgChartNodeData, type OrgChartRole } from '../../../diagram/interfaces';

export interface SidebarFieldChange {
  nodeId: string;
  fields: (keyof SidebarFormData)[];
  formData: SidebarFormData;
}

export const ON_FIELD_CHANGE = new InjectionToken<(change: SidebarFieldChange) => void>(
  'ON_FIELD_CHANGE',
);

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

export function nodeDataToFormData(
  data: OrgChartNodeData,
  parentId: string | null,
): SidebarFormData {
  return {
    fullName: isOccupiedNodeData(data) ? data.fullName : '',
    role: data.role ?? null,
    description: data.description ?? '',
    reportsTo: parentId,
  };
}

// TODO: remove `& Record<string, unknown>` when ng-diagram supports generic updateNodeData
export function formDataToNodeData(
  formData: SidebarFormData,
  existingData: OrgChartNodeData,
): OrgChartNodeData & Record<string, unknown> {
  const { type, role, description, ...base } = existingData;
  const color = isOccupiedNodeData(existingData) ? existingData.color : undefined;

  const variantData = formData.fullName
    ? { type: 'occupied' as const, fullName: formData.fullName, color }
    : { type: 'vacant' as const };

  return {
    ...base,
    ...variantData,
    role: formData.role ?? undefined,
    description: formData.description || undefined,
  };
}
