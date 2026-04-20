export enum NodeTemplateType {
  OrgChartNode = 'orgChartNode',
}

export enum EdgeTemplateType {
  OrgChartEdge = 'orgChartEdge',
}

export enum OrgChartRole {
  PlantDirector = 'Plant Director',
  ChiefEngineer = 'Chief Engineer',
  OperationsManager = 'Operations Manager',
  SafetyComplianceLead = 'Safety & Compliance Lead',
  HrManager = 'HR Manager',
  RdSpecialist = 'R&D Specialist',
  EngineeringIntern = 'Engineering Intern',
  MaintenanceTechnician = 'Maintenance Technician',
  QaAuditor = 'QA Auditor',
  WarehouseOperator = 'Warehouse Operator',
  SafetyInspector = 'Safety Inspector',
  ProcurementSpecialist = 'Procurement Specialist',
  ShiftSupervisor = 'Shift Supervisor',
  ProcessEngineer = 'Process Engineer',
}

export const ORG_CHART_ROLE_COLORS: Record<OrgChartRole, string> = {
  [OrgChartRole.PlantDirector]: 'var(--ngd-role-plant-director)',
  [OrgChartRole.ChiefEngineer]: 'var(--ngd-role-chief-engineer)',
  [OrgChartRole.OperationsManager]: 'var(--ngd-role-operations-manager)',
  [OrgChartRole.SafetyComplianceLead]: 'var(--ngd-role-safety-compliance-lead)',
  [OrgChartRole.HrManager]: 'var(--ngd-role-hr-manager)',
  [OrgChartRole.RdSpecialist]: 'var(--ngd-role-rd-specialist)',
  [OrgChartRole.EngineeringIntern]: 'var(--ngd-role-engineering-intern)',
  [OrgChartRole.MaintenanceTechnician]: 'var(--ngd-role-maintenance-technician)',
  [OrgChartRole.QaAuditor]: 'var(--ngd-role-qa-auditor)',
  [OrgChartRole.WarehouseOperator]: 'var(--ngd-role-warehouse-operator)',
  [OrgChartRole.SafetyInspector]: 'var(--ngd-role-safety-inspector)',
  [OrgChartRole.ProcurementSpecialist]: 'var(--ngd-role-procurement-specialist)',
  [OrgChartRole.ShiftSupervisor]: 'var(--ngd-role-shift-supervisor)',
  [OrgChartRole.ProcessEngineer]: 'var(--ngd-role-process-engineer)',
};

export function getColorForRole(role: OrgChartRole | undefined): string | undefined {
  return role ? ORG_CHART_ROLE_COLORS[role] : undefined;
}

export type OrgChartNodeData = OrgChartOccupiedNodeData | OrgChartVacantNodeData;

/**
 * Centralized property keys for org-chart node and edge data.
 *
 * To rename a property, change the key here and in the interface.
 */
export const IS_COLLAPSED = 'isCollapsed' as const;
export const IS_HIDDEN = 'isHidden' as const;
export const HAS_CHILDREN = 'hasChildren' as const;
export const COLLAPSED_CHILDREN_COUNT = 'collapsedChildrenCount' as const;
export const SORT_ORDER = 'sortOrder' as const;
export const EDGE_IS_HIDDEN = 'isHidden' as const;

export interface OrgChartEdgeData {
  type: 'orgChart';
  isHidden?: boolean;
}

export interface OrgChartOccupiedNodeData extends OrgChartBaseNodeData {
  type: 'occupied';
  fullName: string;
}

export interface OrgChartVacantNodeData extends OrgChartBaseNodeData {
  type: 'vacant';
}

export interface OrgChartBaseNodeData {
  role?: OrgChartRole;
  description?: string;
  reports: number;
  headcount: number;
  utilization: number;
  sortOrder?: number;
  isCollapsed?: boolean;
  collapsedChildrenCount?: number;
  hasChildren?: boolean;
  isHidden?: boolean;
}
