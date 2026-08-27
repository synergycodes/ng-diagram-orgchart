import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { isOccupiedNodeData } from '../model/guards';
import { type OrgChartNodeData } from '../model/interfaces';

/** The wording the confirm-delete dialog shows for one node. */
export interface DeleteMessage {
  readonly title: string;
  readonly sentences: readonly string[];
}

/** What the dialog can name a node by. Both are null for a vacant position with no role. */
interface DeleteSubject {
  readonly name: string | null;
  readonly role: string | null;
}

/** Reads a node from the model and words the question the dialog asks about it. */
@Injectable()
export class ConfirmDeleteMessageService {
  private readonly modelService = inject(NgDiagramModelService);

  /** Null if the node is not in the model. */
  build(nodeId: string): DeleteMessage | null {
    const node = this.modelService.getNodeById<OrgChartNodeData>(nodeId);
    if (!node) return null;

    const data = node.data;
    const subject: DeleteSubject = {
      name: isOccupiedNodeData(data) ? data.fullName : null,
      role: data.role ?? null,
    };

    return {
      title: this.title(subject),
      sentences: [this.removalSentence(subject), 'This cannot be undone.'],
    };
  }

  private title(subject: DeleteSubject): string {
    return subject.name ? `Delete ${subject.name}?` : 'Delete this vacant position?';
  }

  private removalSentence(subject: DeleteSubject): string {
    if (subject.name) return `${subject.name} will be removed from the chart.`;
    const role = subject.role ? `${subject.role} ` : '';
    return `This vacant ${role}position will be removed from the chart.`;
  }
}
