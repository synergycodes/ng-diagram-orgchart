import { inject, InjectionToken, Injector } from '@angular/core';
import { PropertiesSidebarService } from '../../properties-sidebar/properties-sidebar.service';
import { TopBarService } from '../../top-navbar/top-bar.service';
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
          const sidebar = injector.get(PropertiesSidebarService);
          const topBar = injector.get(TopBarService);
          return {
            top: topBar.height,
            right: sidebar.isExpanded() ? sidebar.width : 0,
          };
        },
      };
    },
  };
}
