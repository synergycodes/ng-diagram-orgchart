import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { DragService } from './drag.service';
import { DropService } from './drop.service';
import type { HighlightedIndicator } from './interfaces';
import type { DropZone } from './zone-detection/index';

const INDICATOR_RANGE = 400;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

@Injectable()
export class DragReorderService implements OnDestroy {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly dragService = inject(DragService);
  private readonly dropService = inject(DropService);

  private readonly _highlightedIndicator = signal<HighlightedIndicator | null>(null, {
    equal: (a, b) => a?.nodeId === b?.nodeId && a?.side === b?.side,
  });
  readonly highlightedIndicator = this._highlightedIndicator.asReadonly();

  private readonly _isReorderActive = signal(false);
  readonly isReorderActive = this._isReorderActive.asReadonly();

  private readonly _nodesInRange = signal<Set<string>>(new Set(), { equal: setsEqual });

  private draggedNodeId: string | null = null;
  private hiddenSides = new Map<string, Set<DropZone>>();
  private pendingDrop: Promise<void> = Promise.resolve();

  private readonly onDragStartedBound = (event: { nodes: { id: string }[] }) =>
    this.onDragStarted(event);
  private readonly onDragEndedBound = (event: { nodes: { id: string }[] }) =>
    this.onDragEnded(event);
  private readonly onSelectionMovedBound = () => this.onSelectionMoved();

  init(): void {
    this.diagramService.addEventListener('nodeDragStarted', this.onDragStartedBound);
    this.diagramService.addEventListener('nodeDragEnded', this.onDragEndedBound);
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.diagramService.removeEventListener('nodeDragStarted', this.onDragStartedBound);
    this.diagramService.removeEventListener('nodeDragEnded', this.onDragEndedBound);
  }

  private async onDragStarted(event: { nodes: { id: string }[] }): Promise<void> {
    await this.pendingDrop;

    if (event.nodes.length > 1) {
      return;
    }

    this.draggedNodeId = event.nodes.at(0)?.id ?? null;
    if (this.draggedNodeId === null) {
      return;
    }
    this._isReorderActive.set(true);
    this.hiddenSides = this.dragService.getHiddenSides(this.draggedNodeId);
    this.updateNodesInRange();

    this.diagramService.addEventListener('selectionMoved', this.onSelectionMovedBound);
  }

  private onSelectionMoved(): void {
    if (!this.draggedNodeId) return;

    this.updateNodesInRange();
    const result = this.dragService.resolveZone(this.draggedNodeId, this.hiddenSides);
    this._highlightedIndicator.set(result);
  }

  private onDragEnded(_event: { nodes: { id: string }[] }): void {
    const indicator = this._highlightedIndicator();
    const draggedNodeId = this.draggedNodeId;

    this.cleanup();

    if (indicator && draggedNodeId) {
      this.pendingDrop = this.dropService.dropNode(draggedNodeId, indicator);
    }
  }

  isSideHidden(nodeId: string, side: DropZone): boolean {
    return this.hiddenSides.get(nodeId)?.has(side) ?? false;
  }

  isNodeInDropRange(nodeId: string): boolean {
    return this._nodesInRange().has(nodeId);
  }

  private updateNodesInRange(): void {
    if (!this.draggedNodeId) return;

    const draggedNode = this.modelService.getNodeById(this.draggedNodeId);
    if (!draggedNode) return;

    const size = draggedNode.size ?? { width: 0, height: 0 };
    const center = {
      x: draggedNode.position.x + size.width / 2,
      y: draggedNode.position.y + size.height / 2,
    };

    const nearby = this.modelService.getNodesInRange(center, INDICATOR_RANGE);
    this._nodesInRange.set(new Set(nearby.map((n) => n.id)));
  }

  private cleanup(): void {
    this.diagramService.removeEventListener('selectionMoved', this.onSelectionMovedBound);
    this._highlightedIndicator.set(null);
    this._nodesInRange.set(new Set());
    this.hiddenSides = new Map();
    this._isReorderActive.set(false);
    this.draggedNodeId = null;
  }
}
