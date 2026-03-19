import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { DiagramComponent } from '../diagram/diagram.component';
<<<<<<< HEAD
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { PropertiesSidebarService } from '../properties-sidebar/properties-sidebar.service';
=======
import { LayoutDirectionService } from '../layout-direction.service';
import { ToolbarHorizontalComponent } from '../toolbar-horizontal/toolbar-horizontal.component';
>>>>>>> 01fae54 ([NGD-97] Updates)
import { TopNavbarComponent } from '../top-navbar/top-navbar.component';

@Component({
  selector: 'app-org-chart-page',
<<<<<<< HEAD
  imports: [DiagramComponent, PropertiesSidebarComponent, TopNavbarComponent],
=======
  imports: [DiagramComponent, ToolbarHorizontalComponent, TopNavbarComponent],
  providers: [LayoutDirectionService],
>>>>>>> 01fae54 ([NGD-97] Updates)
  templateUrl: './org-chart-page.component.html',
  styleUrl: './org-chart-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNgDiagram(), PropertiesSidebarService],
})
export class OrgChartPageComponent {
  private readonly topNavbar = viewChild('topNavbar', { read: ElementRef });
  private readonly host = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      const navEl = this.topNavbar()?.nativeElement;
      const hostEl = this.host.nativeElement;
      if (navEl && hostEl) {
        const navBottom = navEl.getBoundingClientRect().bottom;
        const hostTop = hostEl.getBoundingClientRect().top;
        const gap = 14; // matches navbar-wrapper gap between top-navbar and toolbar
        document.documentElement.style.setProperty('--sidebar-top', `${navBottom - hostTop + gap}px`);
      }
    });
  }
}
