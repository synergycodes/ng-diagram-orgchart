import { inject, Injectable } from '@angular/core';
import { DragService } from '../../drag-reorder/drag.service';
import { visibleDropSides } from '../../drag-reorder/visible-drop-sides';
import type { DropZone } from '../../drag-reorder/zone-detection/index';
import { HierarchyService } from '../../diagram/model/hierarchy.service';
import { SortOrderService } from '../../diagram/model/sort-order.service';
import { NavigationOrderService } from '../../diagram/keyboard-navigation/order/navigation-order.service';
import {
  groupCandidatesByNode,
  projectChildOrder,
  type MoveCandidate,
  type MoveCandidates,
} from './move-candidates';

/** Enumerates every position a node can be moved to. */
@Injectable()
export class MoveCandidatesService {
  private readonly hierarchyService = inject(HierarchyService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly navigationService = inject(NavigationOrderService);
  private readonly dragService = inject(DragService);

  /**
   * One pass over the visible tree, in the same depth-first order `Tab` between nodes uses, with
   * the same side rule the pointer path draws.
   *
   * Not bounded by distance, unlike the pointer path: reaching a position the pointer can only
   * get to by scrolling first is the reason this feature exists.
   */
  build(movingId: string): MoveCandidates {
    const hiddenSides = this.dragService.getHiddenSides(movingId);
    const all: MoveCandidate[] = [];

    for (const nodeId of this.navigationService.visibleTreeOrder()) {
      for (const side of visibleDropSides(hiddenSides.get(nodeId))) {
        const candidate = this.toCandidate(nodeId, side);
        if (candidate && !this.changesNothing(candidate, movingId)) all.push(candidate);
      }
    }

    return { all, ...groupCandidatesByNode(all) };
  }

  /** A side position needs the target's parent, and a root has none. */
  private toCandidate(nodeId: string, side: DropZone): MoveCandidate | null {
    if (side === 'bottom') return { nodeId, side, parentId: nodeId };
    const parentId = this.hierarchyService.getParentId(nodeId);
    return parentId === null ? null : { nodeId, side, parentId };
  }

  /**
   * True when a commit would rebuild the same child list, which happens either side of the moved
   * node's own slot. Offering those positions would let the user choose a move and get nothing.
   */
  private changesNothing(candidate: MoveCandidate, movingId: string): boolean {
    if (this.hierarchyService.getParentId(movingId) !== candidate.parentId) return false;
    const childIds = this.sortOrderService.getSortedChildren(candidate.parentId).map((c) => c.id);
    const projected = projectChildOrder(childIds, movingId, candidate);
    return projected.length === childIds.length && projected.every((id, i) => id === childIds[i]);
  }
}
