import { inject, Injectable } from '@angular/core';
import { DiagramFocusService } from '../keyboard-navigation/focus/diagram-focus.service';
import { HierarchyService } from '../model/hierarchy.service';
import { SortOrderService } from '../model/sort-order.service';

/**
 * Where the focus goes when a node is deleted.
 *
 * Keep the two steps apart. A focus request lands one change-detection pass later, and a
 * collapsed root's first child cannot take the focus until the deletion makes it visible.
 */
@Injectable()
export class ConfirmDeleteFocusService {
  private readonly hierarchyService = inject(HierarchyService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly diagramFocusService = inject(DiagramFocusService);

  /** Where the dialog hands the focus back, for a delete that removes the element it came from. */
  get returnTarget(): HTMLElement | null {
    return this.diagramFocusService.diagramSurface;
  }

  /** Step 1, before the deletion. */
  resolveSuccessor(nodeId: string): string | null {
    const parentId = this.hierarchyService.getParentId(nodeId);
    if (parentId) return parentId;
    return this.sortOrderService.getSortedChildren(nodeId).at(0)?.id ?? null;
  }

  /** Step 2, after the deletion. */
  focusSuccessor(successorId: string | null): void {
    if (successorId) {
      this.diagramFocusService.focusNode(successorId);
      return;
    }
    this.diagramFocusService.focusEntryNode();
  }
}
