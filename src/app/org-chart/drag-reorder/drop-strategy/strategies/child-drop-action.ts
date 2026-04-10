import type { DropActionStrategy, DropDeps } from '../drop-strategy.interface';

/** Drop as child: reparents the dragged node under the target, expanding it if collapsed. */
export function createChildDropAction(deps: DropDeps): DropActionStrategy {
  const { hierarchyService } = deps;

  return {
    execute({ draggedNodeId, targetNodeId: newParentId }) {
      return hierarchyService.updateNodeParent(draggedNodeId, newParentId);
    },
  };
}
