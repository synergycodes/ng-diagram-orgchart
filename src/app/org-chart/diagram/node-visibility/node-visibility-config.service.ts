import { inject, InjectionToken, Injector } from '@angular/core';
import { PropertiesSidebarComponent } from '../../properties-sidebar/properties-sidebar.component';
import { TopNavbarComponent } from '../../top-navbar/top-navbar.component';
import { type ViewportInsets } from '../utils/viewport';

export interface NodeVisibilityConfig {
  getViewportInsets?: () => ViewportInsets;
}

export const NODE_VISIBILITY_CONFIG = new InjectionToken<NodeVisibilityConfig>(
  'NodeVisibilityConfig',
);

export function provideNodeVisibilityConfig() {
  return {
    provide: NODE_VISIBILITY_CONFIG,
    useFactory: () => {
      const injector = inject(Injector);
      return {
        getViewportInsets: () => {
          const sidebar = injector.get(PropertiesSidebarComponent);
          const topBar = injector.get(TopNavbarComponent);
          return {
            top: topBar.height,
            right: sidebar.width,
          };
        },
      };
    },
  };
}
