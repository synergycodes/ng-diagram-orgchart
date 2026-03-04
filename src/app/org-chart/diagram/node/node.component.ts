import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { type TreeNodeData } from '../interfaces';
import { LayoutService } from '../layout/layout.service';

/**
 * Custom tree node template.
 *
 * Renders a labeled node with top/bottom ports for edge connections.
 * When the node has children (`hasChildren` flag), a toggle button is
 * shown to expand or collapse the subtree. Hidden nodes (children of a
 * collapsed parent) are made invisible via host bindings.
 */
@Component({
  imports: [NgDiagramPortComponent, NgDiagramBaseNodeTemplateComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
    // Hide nodes whose parent is collapsed.
    // Important: ng-diagram does not work correctly with display: none —
    // it breaks internal measurements. Use visibility: hidden instead.
    // A proper fix is incoming.
    '[style.visibility]': 'node().data.isHidden ? "hidden" : null',
    '[style.pointer-events]': 'node().data.isHidden ? "none" : null',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<TreeNodeData> {
  private readonly layoutService = inject(LayoutService);

  node = input.required<Node<TreeNodeData>>();

  /** Toggle the collapsed state of this node's subtree and re-layout. */
  async onToggle(event: MouseEvent): Promise<void> {
    // Prevent the click from also selecting/dragging the node.
    event.stopPropagation();
    await this.layoutService.toggleCollapsed(this.node().id);
  }
}
