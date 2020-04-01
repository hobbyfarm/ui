import { Component, ViewChild, ElementRef, OnInit, Input, OnChanges } from '@angular/core';
import { Terminal } from 'xterm';
import * as attach from 'xterm/lib/addons/attach/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { ShellService } from '../services/shell.service';
import { environment } from 'src/environments/environment';
import { HostListener } from '@angular/core';

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

    terminalWidth: number = 80;

    public screenHeight: number;
    public screenWidth: number;

    public term: any;
    public socket: WebSocket;
    constructor(
        public jwtHelper: JwtHelperService,
        public ctrService: CtrService,
        public shellService: ShellService
    ) {
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event?) {
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;
        this.term.resize(this.terminalWidth, Math.floor(this.screenHeight * this.scalingFactor));
    }

    public paste(code: string) {
        this.term.write(code);
    }

    public get scalingFactor() {
        // determine scaling factor. 
        if (this.screenHeight >= 1200) {
            return 0.04;
        } else if (this.screenHeight >= 992) {
            return 0.03;
        } else if (this.screenHeight >= 768) {
            return 0.03;
        } else if (this.screenHeight >= 576) {
            return 0.03;
        } else if (this.screenHeight < 576) {
            return 0.025;
        } else {
            return 0.04;
        }
    }

    @ViewChild("terminal", { static: true }) terminalDiv: ElementRef;

    public resize() {
        setTimeout(() => this.term.resize(this.terminalWidth, Math.floor(this.screenHeight * this.scalingFactor)), 150);
    }

    buildSocket() {
        Terminal.applyAddon(attach);
        Terminal.applyAddon(fit);
        this.term = new Terminal();

        if (!this.endpoint.startsWith("wss://") && !this.endpoint.startsWith("ws://")) {
            if (environment.server.startsWith("https")) {
              this.endpoint = "wss://" + this.endpoint
            } else {
              this.endpoint = "ws://" + this.endpoint
            }
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
