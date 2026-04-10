export enum NodeTemplateType {
  OrgChartNode = 'orgChartNode',
}

export enum EdgeTemplateType {
  OrgChartEdge = 'orgChartEdge',
}

export enum OrgChartRole {
  PlantDirector = 'Plant Director',
  OperationsManager = 'Operations Manager',
  HseSafetyLead = 'HSE & Safety Lead',
  HseInspector = 'HSE Inspector',
  MaintenanceHead = 'Maintenance Head',
  HrPayrollManager = 'HR & Payroll Manager',
  ShiftASupervisor = 'Shift A Supervisor',
  ShiftBSupervisor = 'Shift B (Night) Supervisor',
  ShiftALead = 'Shift A Lead',
  ShiftBLead = 'Shift B (Night) Lead',
  SeniorElectrician = 'Senior Electrician',
  MaintenanceTechnician = 'Maintenance Technician',
  UnionRepresentative = 'Union Representative',
  ProductionCoordinator = 'Production Coordinator',
}

export const ORG_CHART_ROLE_COLORS: Record<OrgChartRole, string> = {
  [OrgChartRole.PlantDirector]: 'var(--ngd-role-plant-director)',
  [OrgChartRole.OperationsManager]: 'var(--ngd-role-operations-manager)',
  [OrgChartRole.HseSafetyLead]: 'var(--ngd-role-hse-safety-lead)',
  [OrgChartRole.HseInspector]: 'var(--ngd-role-hse-inspector)',
  [OrgChartRole.MaintenanceHead]: 'var(--ngd-role-maintenance-head)',
  [OrgChartRole.HrPayrollManager]: 'var(--ngd-role-hr-payroll-manager)',
  [OrgChartRole.ShiftASupervisor]: 'var(--ngd-role-shift-a-supervisor)',
  [OrgChartRole.ShiftBSupervisor]: 'var(--ngd-role-shift-b-supervisor)',
  [OrgChartRole.ShiftALead]: 'var(--ngd-role-shift-a-lead)',
  [OrgChartRole.ShiftBLead]: 'var(--ngd-role-shift-b-lead)',
  [OrgChartRole.SeniorElectrician]: 'var(--ngd-role-senior-electrician)',
  [OrgChartRole.MaintenanceTechnician]: 'var(--ngd-role-maintenance-technician)',
  [OrgChartRole.UnionRepresentative]: 'var(--ngd-role-union-representative)',
  [OrgChartRole.ProductionCoordinator]: 'var(--ngd-role-production-coordinator)',
};

export function getColorForRole(role: OrgChartRole | undefined): string | undefined {
  return role ? ORG_CHART_ROLE_COLORS[role] : undefined;
}

export type OrgChartNodeData = OrgChartOccupiedNodeData | OrgChartVacantNodeData;

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
  span: number;
  shiftCapacity: number;
  sortOrder?: number;
  isCollapsed?: boolean;
  collapsedChildrenCount?: number;
  hasChildren?: boolean;
  isHidden?: boolean;
}
