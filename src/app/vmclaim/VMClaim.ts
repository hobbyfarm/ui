import { VMClaimVM } from '../VMClaimVM';

export class VMClaim {
    id: string;
    user: string;
    vm: Map<string, VMClaimVM>;
    vm_class_id: string;
    bound: boolean;
    ready: boolean;
    restricted_bind: boolean;
    restricted_bind_value: string;
    dynamic_bind_capable: boolean;
    bind_mode: string;
    static_bind_attempts: number;
    dynamic_bind_request_id: string;
    tainted: boolean;
}
