import type { NgDiagramModelService } from 'ng-diagram';
import type { HierarchyService } from '../../hierarchy/hierarchy.service';

export interface DropParams {
  newParentId: string | null;
  sortOrder: number;
  shouldExpand: boolean;
}

export interface DropContext {
  targetNodeId: string;
  modelService: NgDiagramModelService;
  hierarchyService: HierarchyService;
}

export interface DropActionStrategy {
  getDropParams(context: DropContext): DropParams;
}
