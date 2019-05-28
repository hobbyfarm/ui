import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges } from '@angular/core';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';

@Component({
    selector: 'terminal',
    templateUrl: './terminal.component.html',
    styleUrls: [
        'terminal.component.css'
    ]
})
export class TerminalComponent implements OnInit, OnChanges {
    private term: any;
    constructor() {

    }

    @ViewChild("terminal") terminalDiv: ElementRef;

    public resize() {
        setTimeout(() => this.term.resize(40, 30), 150);
    }

    ngOnInit() {
        Terminal.applyAddon(attach);
        Terminal.applyAddon(fit);
        this.term = new Terminal();

        
        var socket = new WebSocket('ws://localhost:5000/shell');

        socket.onopen = (e) => {
            this.term.attach(socket, true, true);
            this.term.open(this.terminalDiv.nativeElement);
        }
    }

    ngOnChanges() {
        console.log("changes");
    }
}