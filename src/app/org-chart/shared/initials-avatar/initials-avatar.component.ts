import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-initials-avatar',
  template: `{{ initials() }}`,
  styleUrl: './initials-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.size-sm]': 'size() === "sm"',
    '[class.size-md]': 'size() === "md"',
    '[class.vacant]': '!fullName()',
    '[style.--avatar-accent]': 'color()',
  },
})
export class InitialsAvatarComponent {
  fullName = input<string>();
  color = input<string>();
  size = input.required<'sm' | 'md'>();

  protected readonly initials = computed(() => {
    const name = this.fullName();
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  });
}
