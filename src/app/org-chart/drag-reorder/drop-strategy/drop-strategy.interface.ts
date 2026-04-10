import type { NgDiagramModelService } from 'ng-diagram';
import type { VisibilityHint } from '../../diagram/layout/layout.service';
import type { ExpandCollapseService } from '../../diagram/model/expand-collapse.service';
import type { HierarchyService } from '../../diagram/model/hierarchy.service';
import type { ModelChanges } from '../../diagram/model/model-changes';
import type { SortOrderService } from '../../diagram/model/sort-order.service';
import type { DropZone } from '../zone-detection';

export interface DropContext {
  draggedNodeId: string;
  targetNodeId: string;
  side: DropZone;
}

export interface DropResult {
  changes: ModelChanges;
  visibilityHint?: VisibilityHint;
}

export interface DropDeps {
  modelService: NgDiagramModelService;
  hierarchyService: HierarchyService;
  sortOrderService: SortOrderService;
  expandCollapseService: ExpandCollapseService;
}

export interface DropActionStrategy {
  execute(context: DropContext): DropResult;
}
