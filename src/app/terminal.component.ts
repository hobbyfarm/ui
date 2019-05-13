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
        this.term = new Terminal();
        
        var socket = new WebSocket('ws://localhost');

        function setup(term) {
            writePrompt(term);
        }
    
        function writePrompt(term) {
            term.write('\r\n$ ');
        };

        socket.onopen = (e) => {
            setup(this.term);
            Terminal.applyAddon(fit);

            this.term.open(this.terminalDiv.nativeElement);
        }

        socket.onmessage = (m) => {
            this.term.writeln(m.data);
        }

        var buffer: string = "";


        this.term.on('key', function(key, ev) {
            const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

            if (ev.keyCode === 13) { // when the user hits enter, write to the socket
                socket.send(buffer);
                buffer = "";
                writePrompt(this);
            } else if (ev.keyCode === 8) {
                buffer = buffer.substring(0, buffer.length-1);
                // Do not delete the prompt
                if (this.term._core.buffer.x > 2) {
                    this.write('\b \b');
                }
            } else if (printable) {
                buffer += key;
                this.write(key);
            }
        });

        this.term.on('paste', function(data) {
            this.write(data);
        });
    }

    ngOnChanges() {
        console.log("changes");
    }
}