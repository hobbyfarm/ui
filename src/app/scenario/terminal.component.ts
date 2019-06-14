import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges } from '@angular/core';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import { tokenGetter } from '../app.module';

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

    private term: any;
    constructor() {

    }

    @ViewChild("terminal") terminalDiv: ElementRef;

    public resize() {
        setTimeout(() => this.term.resize(80, 30), 150);
    }

    ngOnInit() {
    }

    ngOnChanges() {
        if (this.vmid != null) {
            Terminal.applyAddon(attach);
            Terminal.applyAddon(fit);
            this.term = new Terminal();


            var socket = new WebSocket("ws://localhost/shell/" + this.vmid + "/connect?auth=" + tokenGetter());

            socket.onopen = (e) => {
                this.term.attach(socket, true, true);
                this.term.open(this.terminalDiv.nativeElement);
            }
        }
    }
}