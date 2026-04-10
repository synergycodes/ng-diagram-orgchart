import type { NgDiagramModelService } from 'ng-diagram';
import type { ExpandCollapseService } from '../../diagram/expand-collapse/expand-collapse.service';
import type { VisibilityHint } from '../../diagram/layout/layout.service';
import type { ModelChanges } from '../../diagram/model-changes';
import type { SortOrderService } from '../../diagram/sort-order/sort-order.service';
import type { HierarchyService } from '../../hierarchy/hierarchy.service';
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
