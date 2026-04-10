import { computed, inject, Injectable, signal } from '@angular/core';
import { NgDiagramModelService, type NodeDragStartedEvent, type Rect } from 'ng-diagram';
import { LayoutService } from '../diagram/layout/layout.service';
import { HierarchyService } from '../diagram/model/hierarchy.service';
import type { HighlightedIndicator } from './interfaces';
import { edgeToEdgeDistance, rectFromNode } from './proximity';
import type { DropZone } from './zone-detection/index';
import { getZoneDetectionStrategy } from './zone-detection/index';

/** Max edge-to-edge distance for a candidate to be considered. Must be less than node spacing (ELK 'spacing.nodeNode'). */
const DETECTION_RANGE = 100;
/** Broad-phase range for getNodesInRange. Larger to account for node dimensions. */
const QUERY_RANGE = 400;

/**
 * Handles drag logic: tracks which nodes are being dragged, computes
 * hidden drop sides, and resolves the nearest valid drop zone.
 */
@Injectable()
export class DragService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);
  private readonly hierarchyService = inject(HierarchyService);

  private static readonly ALL_SIDES: ReadonlySet<DropZone> = new Set<DropZone>([
    'left',
    'right',
    'bottom',
  ]);

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

  /** Computes which drop sides to hide per node (own subtree, parent, root). */
  getHiddenSides(draggedNodeId: string): Map<string, Set<DropZone>> {
    return mergeMaps(
      this.getAllSidesForDraggedSubtree(draggedNodeId),
      this.getInvalidSidesForParent(draggedNodeId),
      this.getSiblingSidesForRootNode(),
    );
  }

  /** Finds the nearest valid drop zone for the dragged node, if any. */
  resolveZone(
    draggedNodeId: string,
    hiddenSides: Map<string, Set<DropZone>>,
  ): HighlightedIndicator | null {
    const draggedNode = this.modelService.getNodeById(draggedNodeId);
    if (!draggedNode) return null;

    const draggedSize = draggedNode.size ?? { width: 0, height: 0 };
    const draggedRect = rectFromNode(draggedNode.position, draggedSize);
    const draggedCenter = {
      x: draggedNode.position.x + draggedSize.width / 2,
      y: draggedNode.position.y + draggedSize.height / 2,
    };

    const candidate = this.findNearestValidNode(draggedCenter, draggedRect, hiddenSides);
    if (!candidate) return null;

    const candidateSize = candidate.size ?? { width: 0, height: 0 };
    const strategy = getZoneDetectionStrategy(this.layoutService.direction());
    const side = strategy.detect(draggedCenter, candidate.position, candidateSize);

    const candidateHidden = hiddenSides.get(candidate.id);
    if (candidateHidden?.has(side)) return null;

    return { nodeId: candidate.id, side };
  }

  private getAllSidesForDraggedSubtree(draggedNodeId: string): Map<string, Set<DropZone>> {
    const result = new Map<string, Set<DropZone>>();
    result.set(draggedNodeId, new Set(DragService.ALL_SIDES));
    for (const id of this.hierarchyService.getDescendantIds(draggedNodeId)) {
      result.set(id, new Set(DragService.ALL_SIDES));
    }
    return result;
  }

  private getInvalidSidesForParent(draggedNodeId: string): Map<string, Set<DropZone>> {
    const result = new Map<string, Set<DropZone>>();
    const parentId = this.hierarchyService.getParentId(draggedNodeId);
    if (!parentId) return result;

    if (this.isRootNode(parentId)) {
      result.set(parentId, new Set(DragService.ALL_SIDES));
    } else {
      result.set(parentId, new Set<DropZone>(['bottom']));
    }
    return result;
  }

  private getSiblingSidesForRootNode(): Map<string, Set<DropZone>> {
    const result = new Map<string, Set<DropZone>>();
    for (const node of this.modelService.nodes()) {
      if (this.isRootNode(node.id)) {
        result.set(node.id, new Set<DropZone>(['left', 'right']));
        break;
      }
    }
    return result;
  }

  private findNearestValidNode(
    draggedCenter: { x: number; y: number },
    draggedRect: Rect,
    hiddenSides: Map<string, Set<DropZone>>,
  ) {
    const nodesInRange = this.modelService.getNodesInRange(draggedCenter, QUERY_RANGE);

    let nearest = null;
    let minDistance = Infinity;

    for (const node of nodesInRange) {
      const hidden = hiddenSides.get(node.id);
      if (hidden?.size === DragService.ALL_SIDES.size) continue;

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

  private isRootNode(nodeId: string): boolean {
    const edges = this.modelService.getConnectedEdges(nodeId);
    return !edges.some((e) => e.target === nodeId);
  }
}

/** Merges multiple nodeId → hidden-sides maps, unioning the sets. */
function mergeMaps(...maps: Map<string, Set<DropZone>>[]): Map<string, Set<DropZone>> {
  const result = new Map<string, Set<DropZone>>();
  for (const map of maps) {
    for (const [nodeId, sides] of map) {
      const existing = result.get(nodeId);
      if (existing) {
        for (const side of sides) {
          existing.add(side);
        }
      } else {
        result.set(nodeId, new Set(sides));
      }
    }
  }
  return result;
}
