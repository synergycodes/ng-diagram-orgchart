import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NodeHeaderComponent } from '../node-header/node-header.component';

@Component({
  selector: 'app-compact-node',
  imports: [NodeHeaderComponent],
  templateUrl: './compact-node.component.html',
  styleUrls: ['./compact-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactNodeComponent {
  fullName = input<string>();
  role = input<string>();
  color = input<string>();
}
