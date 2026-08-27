import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { HierarchyService } from '../../diagram/model/hierarchy.service';
import { isOccupiedNodeData } from '../../diagram/model/guards';
import type { OrgChartNodeData } from '../../diagram/model/interfaces';
import type { MoveCandidate } from '../candidates/move-candidates';
import { moveSubjectName } from './move-messages';

/** Reads the model and names the nodes a move message talks about. */
@Injectable()
export class MoveMessageFactory {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);

  /** Falls back to a neutral word, so a message never reads as though a node has no name. */
  nodeName(nodeId: string): string {
    const node = this.modelService.getNodeById<OrgChartNodeData>(nodeId);
    if (!node) return 'This colleague';

    const data = node.data;
    return moveSubjectName({
      name: isOccupiedNodeData(data) ? data.fullName.trim() : null,
      role: data.role ?? null,
    });
  }

  /**
   * The manager the move would change to, or null when it keeps the current one.
   *
   * A `bottom` position needs no clause: its phrase already names the parent it moves under.
   */
  newManagerName(candidate: MoveCandidate, movingId: string): string | null {
    if (candidate.side === 'bottom') return null;
    if (candidate.parentId === this.hierarchyService.getParentId(movingId)) return null;
    return this.nodeName(candidate.parentId);
  }
}
