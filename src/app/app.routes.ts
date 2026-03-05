import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./org-chart/pages/org-chart-page.component').then((m) => m.OrgChartPageComponent),
  },
];
