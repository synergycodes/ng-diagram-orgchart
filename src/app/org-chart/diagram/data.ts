import { type Edge, type Node } from 'ng-diagram';
import { OrgChartRole, type OrgChartEdgeData, type OrgChartNodeData } from './interfaces';

// Node IDs
const thomasWalterId = '0000-000000000001';
const sarahChenId = '0000-000000000002';
const marcusThompsonId = '0000-000000000003';
const jamesRodriguezId = '0000-000000000004';
const emilyWatsonId = '0000-000000000005';
const michaelDavisId = '0000-000000000006';
const dianaPatelId = '0000-000000000007';
const carlosMartinezId = '0000-000000000008';
const thomasGreenId = '0000-000000000009';
const vacantMaintenanceTechId = '0000-00000000000a';
const patriciaMooreId = '0000-00000000000b';

// Edge IDs
const edgeTwScId = '0001-000000000001';
const edgeTwMtId = '0001-000000000002';
const edgeTwJrId = '0001-000000000003';
const edgeTwEwId = '0001-000000000004';
const edgeScMdId = '0001-000000000005';
const edgeScDpId = '0001-000000000006';
const edgeMtCmId = '0001-000000000007';
const edgeJrTgId = '0001-000000000008';
const edgeJrVmId = '0001-000000000009';
const edgeEwPmId = '0001-00000000000a';

export const diagramModel: {
  nodes: Node<OrgChartNodeData>[];
  edges: Edge<OrgChartEdgeData>[];
} = {
  nodes: [
    {
      id: thomasWalterId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Thomas Walter',
        role: OrgChartRole.PlantDirector,
        description: '',
        reports: 4,
        span: 1230,
        shiftCapacity: 70,
        color: '#AF3',
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: sarahChenId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Sarah Chen',
        role: OrgChartRole.OperationsManager,
        description: '',
        reports: 2,
        span: 410,
        shiftCapacity: 85,
        color: '#3AB0F6',
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: marcusThompsonId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Marcus Thompson',
        role: OrgChartRole.HseSafetyLead,
        description: '',
        reports: 1,
        span: 180,
        shiftCapacity: 60,
        isCollapsed: false,
        hasChildren: true,
        color: '#EB8147',
      },
    },
    {
      id: jamesRodriguezId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'James Rodriguez',
        role: OrgChartRole.MaintenanceHead,
        description: '',
        reports: 2,
        span: 320,
        shiftCapacity: 45,
        color: '#EB8147',
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: emilyWatsonId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Emily Watson',
        role: OrgChartRole.HrPayrollManager,
        description: '',
        reports: 1,
        span: 150,
        shiftCapacity: 90,
        color: '#A977FF',
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: michaelDavisId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Michael Davis',
        role: OrgChartRole.ShiftASupervisor,
        description: '',
        reports: 0,
        span: 0,
        shiftCapacity: 75,
        color: '#3AB0F6',
      },
    },
    {
      id: dianaPatelId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Diana Patel',
        role: OrgChartRole.ShiftBLead,
        description: '',
        reports: 1,
        span: 120,
        shiftCapacity: 55,
        color: '#3AB0F6',
        isCollapsed: false,
      },
    },
    {
      id: carlosMartinezId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Carlos Martinez',
        role: OrgChartRole.HseInspector,
        description: '',
        reports: 0,
        span: 0,
        shiftCapacity: 65,
        color: '#EB8147',
      },
    },
    {
      id: thomasGreenId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Thomas Green',
        role: OrgChartRole.SeniorElectrician,
        description: '',
        reports: 0,
        span: 0,
        shiftCapacity: 80,
        color: '#EB8147',
      },
    },
    {
      id: vacantMaintenanceTechId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'vacant',
        role: OrgChartRole.MaintenanceTechnician,
        description: '',
        reports: 0,
        span: 0,
        shiftCapacity: 0,
      },
    },
    {
      id: patriciaMooreId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Patricia Moore',
        role: OrgChartRole.UnionRepresentative,
        description: '',
        reports: 0,
        span: 0,
        shiftCapacity: 50,
        color: '#A977FF',
      },
    },
  ],
  edges: [
    {
      id: edgeTwScId,
      source: thomasWalterId,
      sourcePort: 'port-out',
      target: sarahChenId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeTwMtId,
      source: thomasWalterId,
      sourcePort: 'port-out',
      target: marcusThompsonId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeTwJrId,
      source: thomasWalterId,
      sourcePort: 'port-out',
      target: jamesRodriguezId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeTwEwId,
      source: thomasWalterId,
      sourcePort: 'port-out',
      target: emilyWatsonId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeScMdId,
      source: sarahChenId,
      sourcePort: 'port-out',
      target: michaelDavisId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeScDpId,
      source: sarahChenId,
      sourcePort: 'port-out',
      target: dianaPatelId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeMtCmId,
      source: marcusThompsonId,
      sourcePort: 'port-out',
      target: carlosMartinezId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeJrTgId,
      source: jamesRodriguezId,
      sourcePort: 'port-out',
      target: thomasGreenId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeJrVmId,
      source: jamesRodriguezId,
      sourcePort: 'port-out',
      target: vacantMaintenanceTechId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeEwPmId,
      source: emilyWatsonId,
      sourcePort: 'port-out',
      target: patriciaMooreId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
  ],
};
