import {Injectable } from '@angular/core';
import {Guid} from 'guid-typescript';
import { BehaviorSubject } from 'rxjs';
import {CodeExec} from '../ctr/CodeExec';


@Injectable()
export class CtrService {
    private targets: Map<string, string> = new Map();
    private code: Map<string, string> = new Map();

    private ctrstream: BehaviorSubject<CodeExec> = new BehaviorSubject(null);

    public generateId() {
        return Guid.create().toString();
    }

    public setTarget(id: string, target: string) {
        this.targets.set(id, target);
    }

    public setCode(id: string, code: string) {
        this.code.set(id, code);
    }

    public getTarget(id: string) {
        return this.targets.get(id);
    }

    public getCode(id: string) {
        return this.code.get(id);
    }

    public sendCode(ctr: CodeExec) {
        this.ctrstream.next(ctr);
    }

    public getCodeStream() {
        return this.ctrstream.asObservable();
    }
}
