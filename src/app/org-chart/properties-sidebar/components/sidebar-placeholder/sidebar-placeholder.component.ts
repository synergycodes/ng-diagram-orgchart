import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-sidebar-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-placeholder.component.html',
  styleUrl: './sidebar-placeholder.component.scss',
})
export class SidebarPlaceholderComponent {
  title = input.required<string>();
  description = input.required<string>();
}
