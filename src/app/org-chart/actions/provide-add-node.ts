import { type Provider } from '@angular/core';
import { type ViewportInsets } from '../diagram/utils/viewport';
import { AddNodeService } from './add-node.service';

export interface AddNodeConfig {
  onNodeAdded?: (nodeId: string) => void;
  getViewportInsets?: () => ViewportInsets;
}

export function provideAddNode(configFactory?: () => AddNodeConfig): Provider {
  return {
    provide: AddNodeService,
    useFactory: () => new AddNodeService(configFactory?.()),
  };
}
