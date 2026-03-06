import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-node-header',
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

  initials = computed(() => {
    const name = this.fullName();
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  });
}
