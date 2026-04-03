import { type Provider } from '@angular/core';
import { AddNodeService } from './add-node.service';

export interface AddNodeConfig {
  onNodeAdded?: (nodeId: string) => void;
}

export function provideAddNode(configFactory?: () => AddNodeConfig): Provider {
  return {
    provide: AddNodeService,
    useFactory: () => new AddNodeService(configFactory?.()),
  };
}
