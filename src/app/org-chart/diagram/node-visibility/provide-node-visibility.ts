import { type Provider } from '@angular/core';
import { NodeVisibilityService, type NodeVisibilityConfig } from './node-visibility.service';

export function provideNodeVisibility(configFactory?: () => NodeVisibilityConfig): Provider {
  return {
    provide: NodeVisibilityService,
    useFactory: () => new NodeVisibilityService(configFactory?.()),
  };
}
