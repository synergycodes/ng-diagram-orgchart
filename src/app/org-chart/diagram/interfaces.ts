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

export type OrgChartNodeData = OrgChartOccupiedNodeData | OrgChartVacantNodeData;

export interface OrgChartEdgeData {
  isHidden?: boolean;
}

export interface OrgChartOccupiedNodeData extends OrgChartBaseNodeData {
  type: 'occupied';
  fullName: string;
  color?: string;
}

export interface OrgChartVacantNodeData extends OrgChartBaseNodeData {
  type: 'vacant';
}

interface OrgChartBaseNodeData {
  role?: OrgChartRole;
  description?: string;
  reports: number;
  span: number;
  shiftCapacity: number;
  sortOrder: string;
  isCollapsed?: boolean;
  collapsedChildrenCount?: number;
  hasChildren?: boolean;
  isHidden?: boolean;
}
