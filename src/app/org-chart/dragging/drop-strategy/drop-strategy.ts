import type { DropZone } from '../zone-detection/index';
import type { DropActionStrategy } from './drop-strategy.interface';
import { childDropAction } from './strategies/child-drop-action';
import { siblingAfterDropAction } from './strategies/sibling-after-drop-action';
import { siblingBeforeDropAction } from './strategies/sibling-before-drop-action';

const dropStrategies: Record<DropZone, DropActionStrategy> = {
  bottom: childDropAction,
  left: siblingBeforeDropAction,
  right: siblingAfterDropAction,
};

export function getDropStrategy(side: DropZone): DropActionStrategy {
  return dropStrategies[side];
}
