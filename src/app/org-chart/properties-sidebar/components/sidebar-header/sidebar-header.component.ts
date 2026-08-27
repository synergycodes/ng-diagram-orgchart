import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-sidebar-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-header.component.html',
  styleUrl: './sidebar-header.component.scss',
})
export class SidebarHeaderComponent {
  isExpanded = input.required<boolean>();
  toggled = output<HTMLElement>();

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');

  protected onToggle(): void {
    const btn = this.toggleButton()?.nativeElement;
    if (btn) this.toggled.emit(btn);
  }
}
