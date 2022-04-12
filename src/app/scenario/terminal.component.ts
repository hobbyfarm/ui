import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  ViewEncapsulation,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon, ITerminalDimensions } from 'xterm-addon-fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { ShellService } from '../services/shell.service';
import { environment } from 'src/environments/environment';
import { HostListener } from '@angular/core';
import { interval, Subscription, timer } from 'rxjs';
import { themes } from './terminal-themes/themes';
import { SettingsService } from '../services/settings.service';

const WS_CODE_NORMAL_CLOSURE = 1000;

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['terminal.component.scss'],
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
  private firstTabChange = true;
  private isVisible = false;
  public mutationObserver: MutationObserver;
  private subscription = new Subscription();

  private DEFAULT_FONT_SIZE = 16;

  @ViewChild('terminal', { static: true }) terminalDiv: ElementRef;

  constructor(
    private jwtHelper: JwtHelperService,
    private ctrService: CtrService,
    private shellService: ShellService,
    private settingsService: SettingsService,
  ) {}

  @HostListener('window:resize')
  public resize() {
    if (
      this.isVisible &&
      this.socket &&
      this.socket.readyState == WebSocket.OPEN
    ) {
      this.dimensions = this.fitAddon.proposeDimensions();
      const height = this.dimensions.rows;
      const width = this.dimensions.cols;
      this.socket.send(`\u001b[8;${height};${width}t`);
      this.fitAddon.fit();
    }
  }

  private buildSocket() {
    if (
      !this.endpoint.startsWith('wss://') &&
      !this.endpoint.startsWith('ws://')
    ) {
      if (environment.server.startsWith('https')) {
        this.endpoint = 'wss://' + this.endpoint;
      } else {
        this.endpoint = 'ws://' + this.endpoint;
      }
    }
    this.socket = new WebSocket(
      this.endpoint +
        '/shell/' +
        this.vmid +
        '/connect?auth=' +
        this.jwtHelper.tokenGetter(),
    );

    // Check if current browser is firefox by useragent and use "duck-typing" as a fallback.
    const regExp = /firefox|fxios/i;
    const isFirefox: boolean =
      regExp.test(navigator.userAgent.toLowerCase()) ||
      'InstallTrigger' in window;
    this.term = new Terminal({
      fontFamily: 'monospace',
      fontSize: 16,
      letterSpacing: 1.1,
      rendererType: isFirefox ? 'dom' : 'canvas',
    });
    this.settingsService.settings$.subscribe(({ terminal_theme }) => {
      this.setTerminalTheme(terminal_theme);
    });
    this.settingsService.settings$.subscribe(({ terminal_fontSize }) => {
      this.setFontSize(terminal_fontSize);
    });
    this.attachAddon = new AttachAddon(this.socket);
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalDiv.nativeElement);

    this.socket.onclose = (e) => {
      this.term.dispose(); // destroy the terminal on the page to avoid bad display
      this.shellService.setStatus(this.vmname, 'Disconnected (' + e.code + ')');
      if (e.code !== WS_CODE_NORMAL_CLOSURE) {
        this.shellService.setStatus(
          this.vmname,
          'Reconnecting ' + new Date().toLocaleTimeString(),
        );
        // we're going to try and rebuild things
        // but only after waiting an appropriate mourning period...
        this.subscription.add(timer(5000).subscribe(() => this.buildSocket()));
      }
    };

    this.socket.onopen = () => {
      this.shellService.setStatus(this.vmname, 'Connected');
      this.term.loadAddon(this.attachAddon);
      this.term.focus();
      // In case the socket takes longer to load than the terminal on the first start, do a resize here
      this.resize();

      this.subscription = this.ctrService
        .getCodeStream()
        .subscribe((c: CodeExec) => {
          // if the code exec is target at us,execute it
          if (c.target.toLowerCase() == this.vmname.toLowerCase()) {
            // break up the code by lines
            const codeArray: string[] = c.code.split('\n');
            // drop each line
            codeArray.forEach((s: string) => {
              // this.term.writeln(s)
              this.socket.send(s + '\n');
            });
          }
        });

      this.subscription.add(
        interval(5000).subscribe(() => {
          this.socket.send(''); // websocket keepalive
        }),
      );
    };
  }

  private closeSocket() {
    if (!this.socket) return;
    this.socket.close(WS_CODE_NORMAL_CLOSURE);
  }

  ngOnChanges() {
    if (this.vmid != null && this.endpoint != null) {
      this.closeSocket();
      this.buildSocket();
    }
  }

  ngOnDestroy() {
    this.closeSocket();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    // Options for the observer (which mutations to observe)
    const config: MutationObserverInit = {
      attributes: true,
      childList: true,
      subtree: true,
    };

    // Callback function to execute when mutations are observed
    const callback: MutationCallback = (mutationsList: MutationRecord[]) => {
      mutationsList.forEach((mutation) => {
        // After the first start of the scenario, wait until the visible terminal element is added to the DOM.
        if (mutation.type === 'childList') {
          if (
            this.term &&
            this.term.element &&
            this.term.element.offsetParent &&
            !this.isVisible
          ) {
            this.isVisible = true;
            this.firstTabChange = false;
            this.resize();
          } else if (
            !(
              this.term &&
              this.term.element &&
              this.term.element.offsetParent
            ) &&
            this.isVisible
          ) {
            this.isVisible = false;
          }
        } else if (mutation.type === 'attributes') {
          // Is triggered if aria-selected changes (on tab button) and terminal should be visible.
          // Should only be called after the first tab change.
          if (
            this.term &&
            this.term.element &&
            this.term.element.offsetParent &&
            !this.isVisible &&
            !this.firstTabChange
          ) {
            this.isVisible = true;
            this.resize();

            // After the first switch between tabs, do not change the terminal's visibility before the (xterm) canvas element attributes are changed.
            // The terminal is now visible and the xterm.fit() function can be called without throwing errors.
          } else if (
            this.term &&
            this.term.element &&
            this.term.element.offsetParent &&
            !this.isVisible &&
            mutation.target.nodeName == 'CANVAS'
          ) {
            this.isVisible = true;
            this.firstTabChange = false;
            this.resize();

            // Is triggered if aria-selected changes (on tab button) and terminal should not be visible anymore.
          } else if (
            !(
              this.term &&
              this.term.element &&
              this.term.element.offsetParent
            ) &&
            this.isVisible
          ) {
            this.isVisible = false;
          }
        }
      });
    };
    // Create an observer instance linked to the callback function
    this.mutationObserver = new MutationObserver(callback);

    this.mutationObserver.observe(
      this.terminalDiv.nativeElement.offsetParent,
      config,
    );
  }

  private setTerminalTheme(themeId: string) {
    if (!this.term) return;
    const theme = themes.find((t) => t.id === themeId) || themes[0];
    this.term.setOption('theme', theme.styles);
  }

  private setFontSize(size: number) {
    if (!this.term) return;
    this.term.setOption('fontSize', size ?? this.DEFAULT_FONT_SIZE);
    this.resize();
  }
}
