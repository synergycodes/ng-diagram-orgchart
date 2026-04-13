import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { DropZone } from '../../../../drag-reorder/zone-detection/index';
import { LayoutGate } from '../../../layout/layout-gate';
import { LayoutService } from '../../../layout/layout.service';
import type { AddNodeAction } from '../../../model/add-node.service';
import { AddButtonService } from './add-button.service';

const ACTION_MAP: Record<DropZone, AddNodeAction> = {
  left: 'siblingBefore',
  right: 'siblingAfter',
  bottom: 'child',
};

@Component({
  selector: 'app-add-button',
  templateUrl: './add-button.component.html',
  styleUrls: ['./add-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[class.layout-horizontal]': 'isHorizontal()',
  },
})
export class AddButtonComponent {
  private readonly addButtonService = inject(AddButtonService);
  private readonly layoutGate = inject(LayoutGate);
  private readonly layoutService = inject(LayoutService);

  nodeId = input.required<string>();
  position = input.required<DropZone>();

  protected isHorizontal = this.layoutService.isHorizontal;
  protected isDisabled = computed(() => !this.layoutGate.isIdle());

  async onAdd(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.addButtonService.addNode(this.nodeId(), ACTION_MAP[this.position()]);
  }
}
