import type { DropZone } from './zone-detection/index';

/** The currently active drop indicator: which node and which side the user is hovering over. */
export interface HighlightedIndicator {
  nodeId: string;
  side: DropZone;
}
