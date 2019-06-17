import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges } from '@angular/core';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'terminal',
    templateUrl: './terminal.component.html',
    styleUrls: [
        'terminal.component.css'
    ]
})
export class TerminalComponent implements OnInit, OnChanges {
    @Input()
    vmid: string;

    @Input()
    endpoint: string;

    private term: any;
    constructor(
        public jwtHelper: JwtHelperService
    ) {

    }

    @ViewChild("terminal") terminalDiv: ElementRef;

    public resize() {
        setTimeout(() => this.term.resize(80, 30), 150);
    }

    ngOnInit() {
    }

    ngOnChanges() {
        if (this.vmid != null && this.endpoint != null) {
            Terminal.applyAddon(attach);
            Terminal.applyAddon(fit);
            this.term = new Terminal();


            var socket = new WebSocket("wss://" + this.endpoint + "/shell/" + this.vmid + "/connect?auth=" + this.jwtHelper.tokenGetter());

            socket.onopen = (e) => {
                this.term.attach(socket, true, true);
                this.term.open(this.terminalDiv.nativeElement);

                setInterval(() => {
                    socket.send(''); // keepalive
                }, 5000);
            }
        }
    }
}