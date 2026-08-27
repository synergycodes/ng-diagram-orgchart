import { inject, type Provider } from '@angular/core';
import {
  MODAL_FOCUS_RESTORE,
  type ModalFocusRestore,
} from '../../../shared/modal-dialog/modal-focus-restore';
import { NODE_HOST_SELECTOR } from './diagram-focus-level';
import { DiagramFocusService } from './diagram-focus.service';

/**
 * The action buttons of a node leave the DOM when the focus leaves that node. The host element
 * of the node stays in the DOM, and the modal returns the focus to that host element.
 *
 * If the focus target is not in the DOM, the focus goes to the entry node. The diagram does not
 * keep a record of the node that had the focus before.
 */
export function provideDiagramModalFocusRestore(): Provider {
  return {
    provide: MODAL_FOCUS_RESTORE,
    useFactory: (): ModalFocusRestore => {
      const diagramFocus = inject(DiagramFocusService);
      return {
        normalize: (target) => target?.closest<HTMLElement>(NODE_HOST_SELECTOR) ?? target,
        recover: () => diagramFocus.focusEntryNode(),
      };
    },
  };
}
