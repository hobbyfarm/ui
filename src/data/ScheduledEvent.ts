import { SharedVirtualMachine } from './sharedVM';

export class ScheduledEvent {
  id: string;
  name: string;
  description: string;
  end_timestamp: string;
  shared_vms: SharedVirtualMachine[];
}
