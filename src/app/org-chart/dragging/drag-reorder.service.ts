import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { DragService } from './drag.service';
import { DropService } from './drop.service';
import type { HighlightedIndicator } from './interfaces';

@Injectable()
export class DragReorderService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly dragService = inject(DragService);
  private readonly dropService = inject(DropService);

  private readonly _highlightedIndicator = signal<HighlightedIndicator | null>(null);
  readonly highlightedIndicator = this._highlightedIndicator.asReadonly();

  private readonly _excludedNodeIds = signal<Set<string>>(new Set());
  readonly excludedNodeIds = this._excludedNodeIds.asReadonly();

  private readonly _isReorderActive = signal(false);
  readonly isReorderActive = this._isReorderActive.asReadonly();

  readonly isDragging = this.dragService.isDragging;

  private draggedNodeId: string | null = null;
  private pointermoveHandler: ((event: PointerEvent) => void) | null = null;

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
    this._excludedNodeIds.set(this.getExcluded(this.draggedNodeId));

    this.pointermoveHandler = () => this.onPointerMove();
    this.document.addEventListener('pointermove', this.pointermoveHandler);
  }

  private getExcluded(draggedNodeId: string) {
    const excluded = this.hierarchyService.getDescendantIds(draggedNodeId);
    excluded.add(draggedNodeId);

    const parentId = this.hierarchyService.getParentId(draggedNodeId);
    if (parentId) {
      excluded.add(parentId);
    }
    return excluded;
  }

  private onPointerMove(): void {
    if (!this.draggedNodeId) return;

    const result = this.dragService.resolveZone(this.draggedNodeId, this._excludedNodeIds());
    const isRootNodeSiblingDrop =
      !!result &&
      this.isRootNode(result.nodeId) &&
      (result.side === 'left' || result.side === 'right');

    if (!result || isRootNodeSiblingDrop) {
      this._highlightedIndicator.set(null);
      return;
    }

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

  private isRootNode(nodeId: string): boolean {
    const edges = this.modelService.getConnectedEdges(nodeId);
    return !edges.some((e) => e.target === nodeId);
  }

  private cleanup(): void {
    if (this.pointermoveHandler) {
      this.document.removeEventListener('pointermove', this.pointermoveHandler);
      this.pointermoveHandler = null;
    }
    this._highlightedIndicator.set(null);
    this._excludedNodeIds.set(new Set());
    this._isReorderActive.set(false);
    this.draggedNodeId = null;
  }
}
