import type { VisibilityHint } from '../../diagram/layout/layout.service';
import type { ModelChanges } from '../../diagram/model/model-changes';
import type { DropZone } from '../zone-detection';

/** Input for a drop action: who was dragged, where, and on which side. */
export interface DropContext {
  draggedNodeId: string;
  targetNodeId: string;
  side: DropZone;
}

/** Output of a drop action: accumulated model changes and an optional visibility hint. */
export interface DropResult {
  changes: ModelChanges;
  visibilityHint?: VisibilityHint;
}

/** A strategy that produces model changes for a specific drop zone. */
export interface DropActionStrategy {
  execute(context: DropContext): DropResult;
}
