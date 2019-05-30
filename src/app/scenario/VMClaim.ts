import { VMClaimVM } from './VMClaimVM';

export class VMClaim {
    id: string;
    user: string;
    vm: Map<string, VMClaimVM>;
    vm_class_id: string;
    bound: boolean;
    ready: boolean;
}