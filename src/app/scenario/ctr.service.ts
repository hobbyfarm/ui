import {Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {CodeExec} from './CodeExec';


@Injectable()
export class CtrService {
    private ctrstream = new Subject<CodeExec>();

    public sendCode(ctr: CodeExec) {
        if (!ctr) return;
        this.ctrstream.next(ctr);
    }

    public getCodeStream() {
        return this.ctrstream.asObservable();
    }
}