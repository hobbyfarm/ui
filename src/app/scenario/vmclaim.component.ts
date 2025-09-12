import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { concatMap, switchMap, takeWhile } from 'rxjs/operators';
import { timer } from 'rxjs';
import { VM } from '../VM';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';
import { VMService } from '../services/vm.service';
import { VMClaimVM } from '../VMClaimVM';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tbody[vmclaim]',
  templateUrl: 'vmclaim.component.html',
  standalone: false,
})
export class VMClaimComponent implements OnChanges {
  @Input()
  vmclaim: VMClaim = new VMClaim();

  @Output()
  ready: EventEmitter<string> = new EventEmitter(false);

  private vms: Map<string, VM> = new Map();

  constructor(
    private vmClaimService: VMClaimService,
    private vmService: VMService,
  ) {}

  getVm(key: string) {
    return this.vms.get(key);
  }

  ngOnChanges() {
    if (!this.vmclaim.id) return;

    const pollInterval = 5000; // Test if vmclaim is ready every 5 seconds

    // Start a timer to poll every 'pollInterval' milliseconds
    timer(0, pollInterval)
      .pipe(
        // On every tick of the timer, call vmClaimService.get()
        switchMap(() => this.vmClaimService.get(this.vmclaim.id)),
        // Continue the Observable chain if vmclaim is not ready
        takeWhile((s: VMClaim) => !s.ready, true),
        // Convert object to Map and emit the VMs if vmclaim is ready
        concatMap((s: VMClaim) => {
          this.vmclaim = s;
          if (!s.ready) return [];
          this.ready.emit(s.id);
          return s.vm.values();
        }),
        concatMap((vcv: VMClaimVM) => {
          if (!vcv) return [];
          return this.vmService.get(vcv.vm_id);
        }),
      )
      .subscribe((vm: VM) => {
        if (vm && vm.id) this.vms.set(vm.id, vm);
      });
  }
}
