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
  [OrgChartRole.PlantDirector]: '#AF3',
  [OrgChartRole.OperationsManager]: '#3AB0F6',
  [OrgChartRole.HseSafetyLead]: '#EB8147',
  [OrgChartRole.HseInspector]: '#EB8147',
  [OrgChartRole.MaintenanceHead]: '#EB8147',
  [OrgChartRole.HrPayrollManager]: '#A977FF',
  [OrgChartRole.ShiftASupervisor]: '#3AB0F6',
  [OrgChartRole.ShiftBSupervisor]: '#D45D5D', // New generated
  [OrgChartRole.ShiftALead]: '#54B8D9', // New generated
  [OrgChartRole.ShiftBLead]: '#3AB0F6',
  [OrgChartRole.SeniorElectrician]: '#EB8147',
  [OrgChartRole.MaintenanceTechnician]: '#D97B5D', // New generated
  [OrgChartRole.UnionRepresentative]: '#A977FF',
  [OrgChartRole.ProductionCoordinator]: '#4DB89A', // New generated
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
