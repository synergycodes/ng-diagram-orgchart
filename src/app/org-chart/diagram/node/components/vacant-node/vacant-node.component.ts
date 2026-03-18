import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NodeHeaderComponent } from '../node-header/node-header.component';

@Component({
  selector: 'app-vacant-node',
  imports: [NodeHeaderComponent],
  templateUrl: './vacant-node.component.html',
  styleUrls: ['./vacant-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacantNodeComponent {
  role = input<string>();
}
