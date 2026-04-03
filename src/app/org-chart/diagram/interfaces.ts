import { type Edge as DiagramEdge, type Node as DiagramNode } from 'ng-diagram';

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
  type: 'orgChart';
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
  sortOrder?: number;
  isCollapsed?: boolean;
  collapsedChildrenCount?: number;
  hasChildren?: boolean;
  isHidden?: boolean;
}

export interface ModelMutations {
  newNodes?: DiagramNode<OrgChartNodeData>[];
  newEdges?: DiagramEdge<OrgChartEdgeData>[];
  nodeUpdates?: (Partial<DiagramNode<OrgChartNodeData>> & { id: string })[];
  edgeUpdates?: (Partial<DiagramEdge<OrgChartEdgeData>> & { id: string })[];
  deleteNodeIds?: string[];
  deleteEdgeIds?: string[];
}
