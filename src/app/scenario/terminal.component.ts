import { Component, ViewChild, ElementRef, Input, OnChanges, ViewEncapsulation, AfterViewInit, OnDestroy } from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon, ITerminalDimensions } from 'xterm-addon-fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { ShellService } from '../services/shell.service';
import { environment } from 'src/environments/environment';
import { HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { themes } from './terminal-themes/themes';
import { SettingsService } from '../services/settings.service';

@Component({
    selector: 'terminal',
    templateUrl: './terminal.component.html',
    styleUrls: [
        'terminal.component.scss'
    ],
    encapsulation: ViewEncapsulation.None,
})
export class TerminalComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input()
    vmid: string;

    @Input()
    vmname: string;

    @Input()
    endpoint: string;

    private term: Terminal;
    private fitAddon: FitAddon = new FitAddon();
    private attachAddon: AttachAddon;
    private socket: WebSocket;
    private dimensions: ITerminalDimensions;
    private firstTabChange: boolean = true;
    private isVisible: boolean = false;
    public mutationObserver: MutationObserver;
    private subscription: Subscription

    constructor(
        private jwtHelper: JwtHelperService,
        private ctrService: CtrService,
        private shellService: ShellService,
        private settingsService: SettingsService
    ) {
    }

    @ViewChild("terminal", { static: true }) terminalDiv: ElementRef;

    @HostListener('window:resize')
    public resize() {
        if (this.isVisible && this.socket && this.socket.readyState == WebSocket.OPEN) {
            this.dimensions = this.fitAddon.proposeDimensions()
            let height = this.dimensions.rows
            let width = this.dimensions.cols
            this.socket.send(`\u001b[8;${height};${width}t`)
            this.fitAddon.fit();
        }
    }

    private buildSocket() {
        if (!this.endpoint.startsWith("wss://") && !this.endpoint.startsWith("ws://")) {
            if (environment.server.startsWith("https")) {
                this.endpoint = "wss://" + this.endpoint
            } else {
                this.endpoint = "ws://" + this.endpoint
            }
        }
        this.socket = new WebSocket(this.endpoint + "/shell/" + this.vmid + "/connect?auth=" + this.jwtHelper.tokenGetter());

        // Check if current browser is firefox by useragent and use "duck-typing" as a fallback.
        const regExp: RegExp = /firefox|fxios/i;
        const isFirefox: boolean = regExp.test(navigator.userAgent.toLowerCase()) || 'InstallTrigger' in window;
        this.term = new Terminal({
            fontFamily: "monospace",
            fontSize: 16,
            letterSpacing: 1.1,
            rendererType: isFirefox ? 'dom' : 'canvas',
        });
        this.settingsService.settings$
            .subscribe(({ terminal_theme }) => {
                this.setTerminalTheme(terminal_theme);
            });
        this.attachAddon = new AttachAddon(this.socket);
        this.term.loadAddon(this.fitAddon)
        this.term.open(this.terminalDiv.nativeElement);

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
            this.term.loadAddon(this.attachAddon);
            this.term.focus();
            // In case the socket takes longer to load than the terminal on the first start, do a resize here
            this.resize();

            this.subscription = this.ctrService.getCodeStream()
                .subscribe(
                    (c: CodeExec) => {
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

    ngOnDestroy() {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    ngAfterViewInit(): void {
        // Options for the observer (which mutations to observe)
        const config: MutationObserverInit = { attributes: true, childList: true, subtree: true };

        // Callback function to execute when mutations are observed
        const callback: MutationCallback = (mutationsList: MutationRecord[], _observer: MutationObserver) => {
            mutationsList.forEach(mutation => {
                // After the first start of the scenario, wait until the visible terminal element is added to the DOM.
                if (mutation.type === 'childList') {
                    if (this.term && this.term.element && this.term.element.offsetParent && !this.isVisible) {
                        this.isVisible = true;
                        this.firstTabChange = false;
                        this.resize();
                    } else if (!(this.term && this.term.element && this.term.element.offsetParent) && this.isVisible) {
                        this.isVisible = false;
                    }
                }
                else if (mutation.type === 'attributes') {
                    // Is triggered if aria-selected changes (on tab button) and terminal should be visible.
                    // Should only be called after the first tab change.
                    if (this.term && this.term.element && this.term.element.offsetParent && !this.isVisible && !this.firstTabChange) {
                        this.isVisible = true;
                        this.resize();
                    
                    // After the first switch between tabs, do not change the terminal's visibility before the (xterm) canvas element attributes are changed. 
                    // The terminal is now visible and the xterm.fit() function can be called without throwing errors.
                    } else if (this.term && this.term.element && this.term.element.offsetParent && !this.isVisible && mutation.target.nodeName == "CANVAS") {
                        this.isVisible = true;
                        this.firstTabChange = false;
                        this.resize();

                    // Is triggered if aria-selected changes (on tab button) and terminal should not be visible anymore.
                    } else if (!(this.term && this.term.element && this.term.element.offsetParent) && this.isVisible) {
                        this.isVisible = false;
                    }
                }
            })
        };
        // Create an observer instance linked to the callback function
        this.mutationObserver = new MutationObserver(callback);

        this.mutationObserver.observe(this.terminalDiv.nativeElement.offsetParent, config);
    }

    private setTerminalTheme(themeId: string) {
        if (!this.term) return;
        const theme = themes.find(t => t.id === themeId) || themes[0];
        this.term.setOption('theme', theme.styles);
    }
}
