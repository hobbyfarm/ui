import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges } from '@angular/core';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CtrService } from '../services/ctr.service';
import { CodeExec } from '../ctr/CodeExec';
import { ShellService } from '../services/shell.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'terminal',
    templateUrl: './terminal.component.html',
    styleUrls: [
        'terminal.component.css'
    ]
})
export class TerminalComponent implements OnChanges {
    @Input()
    vmid: string;

    @Input()
    vmname: string;

    @Input()
    endpoint: string;

    public term: any;
    public socket: WebSocket;
    constructor(
        public jwtHelper: JwtHelperService,
        public ctrService: CtrService,
        public shellService: ShellService
    ) {

    }

    public paste(code: string) {
        this.term.write(code);
    }

    @ViewChild("terminal", { static: true }) terminalDiv: ElementRef;

    public resize() {
        // setTimeout(() => this.term.resize(80, 30), 150);
        // setTimeout(() => this.term.fit(), 150);
        // setTimeout(() => {
        //     let height = document.getElementById('terminal').offsetHeight;
        //     let width = document.getElementById('terminal').offsetWidth;
        //     console.log("width x height: " + height + " x " + width)
        //     this.term.resize(height, width)
        // }, 150);
        this.term.fit();
    }

    buildSocket() {
        Terminal.applyAddon(attach);
        Terminal.applyAddon(fit);
        this.term = new Terminal();

        if (environment.server.startsWith("https")) {
            this.endpoint = "wss://" + this.endpoint
        } else {
            this.endpoint = "ws://" + this.endpoint
        }
        this.socket = new WebSocket(this.endpoint + "/shell/" + this.vmid + "/connect?auth=" + this.jwtHelper.tokenGetter());

        this.socket.onclose = (e) => {
            this.term.dispose(); // destroy the terminal on the page to avoid bad display
            this.shellService.setStatus(this.vmname, "Disconnected (" + e.code + ")");
            if (!e.wasClean) {
                this.shellService.setStatus(this.vmname, "Reconnecting " + new Date().toLocaleTimeString());
                // we're going to try and rebuild things
                // but only after waiting an appropriate mourning period...
                setTimeout(() => this.buildSocket(), 5000);
            }
        }

        this.socket.onopen = (e) => {
            this.shellService.setStatus(this.vmname, "Connected");
            this.term.attach(this.socket, true, true);
            this.term.open(this.terminalDiv.nativeElement);

            this.ctrService.getCodeStream()
                .subscribe(
                    (c: CodeExec) => {
                        if (!c) {
                            return;
                        }
                        // if the code exec is target at us,execute it
                        if (c.target.toLowerCase() == this.vmname.toLowerCase()) {
                            // break up the code by lines
                            var codeArray: string[] = c.code.split("\n");
                            // drop each line
                            codeArray.forEach(
                                (s: string) => {
                                    // this.term.writeln(s)
                                    this.socket.send(s + "\n");
                                }
                            )
                        }
                    }
                )

            setInterval(() => {
                this.socket.send(''); // websocket keepalive
            }, 5000);
        }
    }

    ngOnChanges() {
        if (this.vmid != null && this.endpoint != null) {
            this.buildSocket();
        }
    }
}
