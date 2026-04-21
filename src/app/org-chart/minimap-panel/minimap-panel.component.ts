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
  NgDiagramModelService,
  NgDiagramViewportService,
  Node,
} from 'ng-diagram';
import { getIsHidden } from '../diagram/model/data-getters';
import { ORG_CHART_CONFIG } from '../org-chart.config';

@Component({
  selector: 'app-minimap-panel',
  imports: [NgDiagramMinimapComponent],
  templateUrl: './minimap-panel.component.html',
  styleUrl: './minimap-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimapPanelComponent {
  private readonly config = inject(ORG_CHART_CONFIG);
  private readonly modelService = inject(NgDiagramModelService);
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

  protected readonly deferNodeUpdates = computed(() => this.modelService.nodes().length >= 200);

  protected readonly minimapNodeStyle: MinimapNodeStyleFn = (node: Node) => {
    if (getIsHidden(node)) {
      return { opacity: 0 };
    }
    return {};
  };

  protected zoomIn(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale + this.config.viewport.zoomStep) / currentScale;

    this.viewportService.zoom(factor);
  }

  protected zoomOut(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale - this.config.viewport.zoomStep) / currentScale;
    this.viewportService.zoom(factor);
  }

  protected toggleExpanded(): void {
    this.isExpanded.update((isExpanded) => !isExpanded);
  }
}
