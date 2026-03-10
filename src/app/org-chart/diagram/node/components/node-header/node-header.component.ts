import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InitialsAvatarComponent } from '../../../../shared/initials-avatar/initials-avatar.component';

@Component({
  selector: 'app-node-header',
  imports: [InitialsAvatarComponent],
  templateUrl: './node-header.component.html',
  styleUrls: ['./node-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'node-header' },
})
export class NodeHeaderComponent {
  fullName = input<string>();
  role = input<string>();
  color = input<string>();
  vacant = input(false);

  displayName = computed(() => (this.vacant() ? 'Vacant Position' : (this.fullName() ?? '')));
}
