import { inject } from '@angular/core';
import { HierarchyService } from '../../diagram/model/hierarchy.service';
import { SortOrderService } from '../../diagram/model/sort-order.service';
import type { DropZone } from '../zone-detection/index';
import type { DropActionStrategy } from './drop-strategy.interface';
import { createChildDropAction } from './strategies/child-drop-action';
import { createSiblingDropAction } from './strategies/sibling-drop-action';

type DropStrategies = Record<DropZone, DropActionStrategy>;

/** Selects the drop strategy for the given side. */
export function getDropStrategy(strategies: DropStrategies, side: DropZone): DropActionStrategy {
  return strategies[side];
}

/** Injects dependencies and wires up the strategy map (left/right → sibling, bottom → child). */
export function injectDropStrategies(): DropStrategies {
  const deps = {
    hierarchyService: inject(HierarchyService),
    sortOrderService: inject(SortOrderService),
  };

  return {
    bottom: createChildDropAction(deps),
    left: createSiblingDropAction(deps),
    right: createSiblingDropAction(deps),
  };
}
