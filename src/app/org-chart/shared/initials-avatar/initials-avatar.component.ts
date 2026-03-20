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
    return this.getInitials(name);
  });

  private getInitials(name: string, maxInitials = 2): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return '';

    const picks = [parts[0], ...parts.slice(1).reverse()];
    const uniqueValues = [...new Map(picks.map((p) => [p, p])).values()];

    return uniqueValues
      .slice(0, maxInitials)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }
}
