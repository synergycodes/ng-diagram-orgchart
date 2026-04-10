import { inject } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { ExpandCollapseService } from '../../diagram/model/expand-collapse.service';
import { HierarchyService } from '../../diagram/model/hierarchy.service';
import { SortOrderService } from '../../diagram/model/sort-order.service';
import type { DropZone } from '../zone-detection/index';
import type { DropActionStrategy } from './drop-strategy.interface';
import { createChildDropAction } from './strategies/child-drop-action';
import { createSiblingDropAction } from './strategies/sibling-drop-action';

type DropStrategies = Record<DropZone, DropActionStrategy>;

export function getDropStrategy(strategies: DropStrategies, side: DropZone): DropActionStrategy {
  return strategies[side];
}

export function injectDropStrategies(): DropStrategies {
  const modelService = inject(NgDiagramModelService);
  const hierarchyService = inject(HierarchyService);
  const sortOrderService = inject(SortOrderService);
  const expandCollapseService = inject(ExpandCollapseService);

  const deps = { modelService, hierarchyService, sortOrderService, expandCollapseService };

  const siblingDrop = createSiblingDropAction(deps);
  const childDrop = createChildDropAction(deps);

  return {
    bottom: childDrop,
    left: siblingDrop,
    right: siblingDrop,
  };
}
