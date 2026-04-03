import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { NgDiagramService } from 'ng-diagram';
import { DragService } from './drag.service';
import { DropService } from './drop.service';
import type { HighlightedIndicator } from './interfaces';
import type { DropZone } from './zone-detection/index';

@Injectable()
export class DragReorderService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly diagramService = inject(NgDiagramService);
  private readonly dragService = inject(DragService);
  private readonly dropService = inject(DropService);

  private readonly _highlightedIndicator = signal<HighlightedIndicator | null>(null);
  readonly highlightedIndicator = this._highlightedIndicator.asReadonly();

  private readonly _isReorderActive = signal(false);
  readonly isReorderActive = this._isReorderActive.asReadonly();

  readonly isDragging = this.dragService.isDragging;

  private draggedNodeId: string | null = null;
  private hiddenSides = new Map<string, Set<DropZone>>();
  private pointerMoveHandler: ((event: PointerEvent) => void) | null = null;

  private readonly onDragStartedBound = (event: { nodes: { id: string }[] }) =>
    this.onDragStarted(event);
  private readonly onDragEndedBound = (event: { nodes: { id: string }[] }) =>
    this.onDragEnded(event);

  init(): void {
    this.diagramService.addEventListener('nodeDragStarted', this.onDragStartedBound);
    this.diagramService.addEventListener('nodeDragEnded', this.onDragEndedBound);
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.diagramService.removeEventListener('nodeDragStarted', this.onDragStartedBound);
    this.diagramService.removeEventListener('nodeDragEnded', this.onDragEndedBound);
  }

  private onDragStarted(event: { nodes: { id: string }[] }): void {
    this.dragService.setDraggedNodes(event as Parameters<DragService['setDraggedNodes']>[0]);

    if (event.nodes.length > 1) {
      return;
    }

    this.draggedNodeId = event.nodes.at(0)?.id ?? null;
    if (this.draggedNodeId === null) {
      return;
    }
    this._isReorderActive.set(true);
    this.hiddenSides = this.dragService.getHiddenSides(this.draggedNodeId);

    this.pointerMoveHandler = () => this.onPointerMove();
    this.document.addEventListener('pointermove', this.pointerMoveHandler);
  }

  private onPointerMove(): void {
    if (!this.draggedNodeId) return;

    const result = this.dragService.resolveZone(this.draggedNodeId, this.hiddenSides);
    this._highlightedIndicator.set(result);
  }

  private onDragEnded(_event: { nodes: { id: string }[] }): void {
    const indicator = this._highlightedIndicator();
    const draggedNodeId = this.draggedNodeId;

    this.cleanup();
    this.dragService.clearDrag();

    if (indicator && draggedNodeId) {
      this.dropService.dropNode(draggedNodeId, indicator);
    }
  }

  isSideHidden(nodeId: string, side: DropZone): boolean {
    return this.hiddenSides.get(nodeId)?.has(side) ?? false;
  }

  private cleanup(): void {
    if (this.pointerMoveHandler) {
      this.document.removeEventListener('pointermove', this.pointerMoveHandler);
      this.pointerMoveHandler = null;
    }
    this._highlightedIndicator.set(null);
    this.hiddenSides = new Map();
    this._isReorderActive.set(false);
    this.draggedNodeId = null;
  }
}
