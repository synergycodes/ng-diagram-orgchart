import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  MinimapNodeStyleFn,
  NgDiagramMinimapComponent,
  NgDiagramViewportService,
  Node,
} from 'ng-diagram';
import { OrgChartNodeData } from '../diagram/interfaces';

const ZOOM_STEP = 0.1;

@Component({
  selector: 'app-minimap-panel',
  imports: [NgDiagramMinimapComponent],
  templateUrl: './minimap-panel.component.html',
  styleUrl: './minimap-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimapPanelComponent {
  private readonly viewportService = inject(NgDiagramViewportService);

  protected readonly isReady = signal(false);
  protected readonly isExpanded = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isReady.set(true);
    });
  }
  protected readonly canZoomIn = this.viewportService.canZoomIn;
  protected readonly canZoomOut = this.viewportService.canZoomOut;
  protected readonly zoomPercent = computed(
    () => Math.round(this.viewportService.scale() * 100) + '%',
  );

  protected readonly minimapNodeStyle: MinimapNodeStyleFn = (node: Node) => {
    const data = node.data as OrgChartNodeData;
    if (data.isHidden) {
      return { opacity: 0 };
    }
    return {};
  };

  protected zoomIn(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale + ZOOM_STEP) / currentScale;

    this.viewportService.zoom(factor);
  }

  protected zoomOut(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale - ZOOM_STEP) / currentScale;
    this.viewportService.zoom(factor);
  }

  protected toggleExpanded(): void {
    this.isExpanded.update((isExpanded) => !isExpanded);
  }
}
