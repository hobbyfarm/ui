import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { delay, concatMap, retry } from 'rxjs/operators';
import { from } from 'rxjs';
import { VM } from '../VM';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';
import { VMService } from '../services/vm.service';
import { VMClaimVM } from '../VMClaimVM';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tbody[vmclaim]',
  templateUrl: 'vmclaim.component.html',
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

    this.vmClaimService
      .get(this.vmclaim.id)
      .pipe(
        concatMap((s: VMClaim) => {
          this.vmclaim = s;
          if (!s.ready) throw 1;

          this.ready.emit(s.id);
          return from(s.vm.values());
        }),
        concatMap((vcv: VMClaimVM) => {
          if (!vcv) throw 1;
          return this.vmService.get(vcv.vm_id);
        }),
        retry({ delay: 5000 }),
      )
      .subscribe((vm: VM) => {
        this.vms.set(vm.id, vm);
      });
  }
}
