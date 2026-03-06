import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NodeHeaderComponent } from '../node-header/node-header.component';

@Component({
  selector: 'app-full-node',
  imports: [NodeHeaderComponent],
  templateUrl: './full-node.component.html',
  styleUrls: ['./full-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullNodeComponent {
  fullName = input<string>();
  role = input<string>();
  color = input<string>();
  reports = input<number>();
  span = input<number>();
  shiftCapacity = input<number>();
}
