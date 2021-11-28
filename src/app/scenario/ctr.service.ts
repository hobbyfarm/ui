import {Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {CodeExec} from './CodeExec';


@Injectable()
export class CtrService {
    private ctrstream: BehaviorSubject<CodeExec> = new BehaviorSubject(null);

    public sendCode(ctr: CodeExec) {
        this.ctrstream.next(ctr);
    }

    public getCodeStream() {
        return this.ctrstream.asObservable();
    }
}