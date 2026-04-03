import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, type NodeDragStartedEvent, type Rect } from 'ng-diagram';
import { LayoutService } from '../diagram/layout/layout.service';
import type { HighlightedIndicator } from './interfaces';
import { edgeToEdgeDistance, rectFromNode } from './proximity';
import { getZoneDetectionStrategy } from './zone-detection/index';

/** Max edge-to-edge distance for a candidate to be considered. Must be less than node spacing (ELK 'spacing.nodeNode'). */
const DETECTION_RANGE = 100;
/** Broad-phase range for getNodesInRange. Larger to account for node dimensions. */
const QUERY_RANGE = 400;

@Injectable()
export class DragService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);

  private readonly draggedNodeIds = signal<Set<string>>(new Set());

  readonly isDragging = computed(() => this.draggedNodeIds().size > 0);

  setDraggedNodes(event: NodeDragStartedEvent): void {
    this.draggedNodeIds.set(new Set(event.nodes.map((n) => n.id)));
  }

  clearDrag(): void {
    this.draggedNodeIds.set(new Set());
  }

  isNodeDragged(nodeId: string): boolean {
    return this.draggedNodeIds().has(nodeId);
  }

  resolveZone(draggedNodeId: string, excludedNodeIds: Set<string>): HighlightedIndicator | null {
    const draggedNode = this.modelService.getNodeById(draggedNodeId);
    if (!draggedNode) return null;

    const draggedSize = draggedNode.size ?? { width: 0, height: 0 };
    const draggedRect = rectFromNode(draggedNode.position, draggedSize);
    const draggedCenter = {
      x: draggedNode.position.x + draggedSize.width / 2,
      y: draggedNode.position.y + draggedSize.height / 2,
    };

    const candidate = this.findNearestValidNode(draggedCenter, draggedRect, excludedNodeIds);
    if (!candidate) return null;

    const candidateSize = candidate.size ?? { width: 0, height: 0 };
    const strategy = getZoneDetectionStrategy(this.layoutService.direction());
    const side = strategy.detect(draggedCenter, candidate.position, candidateSize);

    return { nodeId: candidate.id, side };
  }

  private findNearestValidNode(
    draggedCenter: { x: number; y: number },
    draggedRect: Rect,
    excludedNodeIds: Set<string>,
  ) {
    const nodesInRange = this.modelService.getNodesInRange(draggedCenter, QUERY_RANGE);

    let nearest = null;
    let minDistance = Infinity;

    for (const node of nodesInRange) {
      if (excludedNodeIds.has(node.id)) continue;

      const nodeSize = node.size ?? { width: 0, height: 0 };
      const candidateRect = rectFromNode(node.position, nodeSize);
      const distance = edgeToEdgeDistance(draggedRect, candidateRect);

      if (distance > DETECTION_RANGE) continue;

      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }

    return nearest;
  }
}
