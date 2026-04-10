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
  [OrgChartRole.PlantDirector]: '#2D9B4E',
  [OrgChartRole.OperationsManager]: '#3AB0F6',
  [OrgChartRole.HseSafetyLead]: '#EB8147',
  [OrgChartRole.HseInspector]: '#E8963A',
  [OrgChartRole.MaintenanceHead]: '#D45D5D',
  [OrgChartRole.HrPayrollManager]: '#A977FF',
  [OrgChartRole.ShiftASupervisor]: '#3A8FD6',
  [OrgChartRole.ShiftBSupervisor]: '#5B7FC7',
  [OrgChartRole.ShiftALead]: '#54B8D9',
  [OrgChartRole.ShiftBLead]: '#7B9ED4',
  [OrgChartRole.SeniorElectrician]: '#C75D8A',
  [OrgChartRole.MaintenanceTechnician]: '#D97B5D',
  [OrgChartRole.UnionRepresentative]: '#9C6BD6',
  [OrgChartRole.ProductionCoordinator]: '#4DB89A',
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
