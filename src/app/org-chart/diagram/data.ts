import { type Edge, type Node } from 'ng-diagram';
import { OrgChartRole, type OrgChartEdgeData, type OrgChartNodeData } from './model/interfaces';

// Node IDs
const nickFuryId = '0000-000000000001';
const tonyStarkId = '0000-000000000002';
const pepperPottsId = '0000-000000000003';
const steveRogersId = '0000-000000000004';
const natashaRomanoffId = '0000-000000000005';
const bruceBannerId = '0000-000000000006';
const peterParkerId = '0000-000000000007';
const rocketRaccoonId = '0000-000000000008';
const scottLangId = '0000-000000000009';
const grootId = '0000-00000000000a';
const buckyBarnesId = '0000-00000000000b';
const lokiId = '0000-00000000000c';
const vacantEhsTechId = '0000-00000000000d';

// Edge IDs
const edgeFuryStarkId = '0001-000000000001';
const edgeFuryPottsId = '0001-000000000002';
const edgeFuryRogersId = '0001-000000000003';
const edgeFuryRomanoffId = '0001-000000000004';
const edgeStarkBannerId = '0001-000000000005';
const edgeStarkParkerId = '0001-000000000006';
const edgeStarkRocketId = '0001-000000000007';
const edgePottsLangId = '0001-000000000008';
const edgePottsGrootId = '0001-000000000009';
const edgeRogersBarnesId = '0001-00000000000a';
const edgeRogersVacantId = '0001-00000000000b';
const edgeRomanoffLokiId = '0001-00000000000c';

export const diagramModel: {
  nodes: Node<OrgChartNodeData>[];
  edges: Edge<OrgChartEdgeData>[];
} = {
  nodes: [
    {
      id: nickFuryId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Nick Fury',
        role: OrgChartRole.PlantDirector,
        description: '',
        reports: 4,
        headcount: 12,
        utilization: 98,
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: tonyStarkId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Tony Stark',
        role: OrgChartRole.ChiefEngineer,
        description: '',
        reports: 3,
        headcount: 4,
        utilization: 87,
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: pepperPottsId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Pepper Potts',
        role: OrgChartRole.OperationsManager,
        description: '',
        reports: 2,
        headcount: 3,
        utilization: 95,
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: steveRogersId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Steve Rogers',
        role: OrgChartRole.SafetyComplianceLead,
        description: '',
        reports: 2,
        headcount: 2,
        utilization: 100,
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: natashaRomanoffId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Natasha Romanoff',
        role: OrgChartRole.HrManager,
        description: '',
        reports: 1,
        headcount: 1,
        utilization: 78,
        isCollapsed: false,
        hasChildren: true,
      },
    },
    {
      id: bruceBannerId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Bruce Banner',
        role: OrgChartRole.RdSpecialist,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 92,
      },
    },
    {
      id: peterParkerId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Peter Parker',
        role: OrgChartRole.EngineeringIntern,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 35,
      },
    },
    {
      id: rocketRaccoonId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Rocket Raccoon',
        role: OrgChartRole.MaintenanceTechnician,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 110,
      },
    },
    {
      id: scottLangId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Scott Lang',
        role: OrgChartRole.QaAuditor,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 88,
      },
    },
    {
      id: grootId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Groot',
        role: OrgChartRole.WarehouseOperator,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 15,
      },
    },
    {
      id: buckyBarnesId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Bucky Barnes',
        role: OrgChartRole.SafetyInspector,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 99,
      },
    },
    {
      id: lokiId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'occupied',
        fullName: 'Loki',
        role: OrgChartRole.ProcurementSpecialist,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 63,
      },
    },
    {
      id: vacantEhsTechId,
      position: { x: 0, y: 0 },
      type: 'orgChartNode',
      data: {
        type: 'vacant',
        role: OrgChartRole.ShiftSupervisor,
        description: '',
        reports: 0,
        headcount: 0,
        utilization: 0,
      },
    },
  ],
  edges: [
    {
      id: edgeFuryStarkId,
      source: nickFuryId,
      sourcePort: 'port-out',
      target: tonyStarkId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeFuryPottsId,
      source: nickFuryId,
      sourcePort: 'port-out',
      target: pepperPottsId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeFuryRogersId,
      source: nickFuryId,
      sourcePort: 'port-out',
      target: steveRogersId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeFuryRomanoffId,
      source: nickFuryId,
      sourcePort: 'port-out',
      target: natashaRomanoffId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeStarkBannerId,
      source: tonyStarkId,
      sourcePort: 'port-out',
      target: bruceBannerId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeStarkParkerId,
      source: tonyStarkId,
      sourcePort: 'port-out',
      target: peterParkerId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeStarkRocketId,
      source: tonyStarkId,
      sourcePort: 'port-out',
      target: rocketRaccoonId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgePottsLangId,
      source: pepperPottsId,
      sourcePort: 'port-out',
      target: scottLangId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgePottsGrootId,
      source: pepperPottsId,
      sourcePort: 'port-out',
      target: grootId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeRogersBarnesId,
      source: steveRogersId,
      sourcePort: 'port-out',
      target: buckyBarnesId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeRogersVacantId,
      source: steveRogersId,
      sourcePort: 'port-out',
      target: vacantEhsTechId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
    {
      id: edgeRomanoffLokiId,
      source: natashaRomanoffId,
      sourcePort: 'port-out',
      target: lokiId,
      targetPort: 'port-in',
      type: 'orgChartEdge',
      data: { type: 'orgChart' },
    },
  ],
};
