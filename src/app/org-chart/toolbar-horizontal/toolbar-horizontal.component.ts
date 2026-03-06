import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutDirectionService } from '../layout-direction.service';

@Component({
  selector: 'app-toolbar-horizontal',
  templateUrl: './toolbar-horizontal.component.html',
  styleUrl: './toolbar-horizontal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarHorizontalComponent {
  protected readonly layoutDirectionService = inject(LayoutDirectionService);
}
