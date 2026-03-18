import { Injectable, computed, signal } from '@angular/core';
import { NodeDragStartedEvent } from 'ng-diagram';

@Injectable()
export class DragStateService {
  private readonly draggedNodeIds = signal<Set<string>>(new Set());

  readonly isDragging = computed(() => this.draggedNodeIds().size > 0);

  setDraggedNodes(event: NodeDragStartedEvent): void {
    const newDraggedNodesIds = new Set(event.nodes.map((n) => n.id));
    this.draggedNodeIds.set(newDraggedNodesIds);
  }

  clearDrag(): void {
    this.draggedNodeIds.set(new Set());
  }

  isNodeDragged(nodeId: string): boolean {
    return this.draggedNodeIds().has(nodeId);
  }
}
