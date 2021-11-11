import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { VMInfoConfig } from '../VMInfoConfig';
import { ReplaySubject } from 'rxjs';


@Injectable()
export class VMInfoService {
    private configStream: ReplaySubject<VMInfoConfig> = new ReplaySubject();

    constructor(
    ) {
    }

    public generateId() {
        return Guid.create().toString();
    }

    public setConfig(config: VMInfoConfig) {
        this.configStream.next(config);
    }

    public getConfigStream() {
        return this.configStream.asObservable();
    }

}