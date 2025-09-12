import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { ShellService } from '../services/shell.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import {
  Client,
  InputStream,
  Keyboard,
  Mouse,
  StringReader,
  Tunnel,
  WebSocketTunnel,
  Event,
} from 'guacamole-common-js';
import clipboard from './guacLibs/GuacClipboard';
import states from './guacLibs/states';
import { ClipboardCache } from './guacLibs/ClipboardCache';
import { Mimetype } from 'guacamole-common-js/lib/GuacCommon';
import {
  Settings,
  SettingsService,
  WindowsZoom,
} from '../services/settings.service';
//import {Modal} from '@/components/Modal'

@Component({
  selector: 'app-guac-terminal',
  templateUrl: './guacTerminal.component.html',
  styleUrls: ['guacTerminal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class GuacTerminalComponent implements OnInit, OnChanges {
  @Input()
  vmid: string;

  @Input()
  vmname: string;

  @Input()
  endpoint: string;

  public optimalWidth = 1024;
  public optimalHeight = 744;
  private zoom = window.devicePixelRatio;

  public connected = false;
  public display: any;
  public client: Client;
  public keyboard: Keyboard;
  public mouse: Mouse;
  public connectionState = states.IDLE;
  public errorMessage?: string;
  public arguments: any = {};
  private retryCount = 0;
  private scalingDuration = 1000;

  constructor(
    public ctrService: CtrService,
    public shellService: ShellService,
    public jwtHelper: JwtHelperService,
    private settingsService: SettingsService,
  ) {}

  @ViewChild('guacTerminal', { static: true }) terminalDiv: ElementRef;
  @ViewChild('viewport', { static: true }) viewport: ElementRef;

  async ngOnInit() {
    this.settingsService.settings$.subscribe((settings: Settings) => {
      if (settings.windowsZoom) {
        this.zoom = WindowsZoom[settings.windowsZoom];
        setTimeout(() => {
          this.resize();
        }, 1000);
      } else {
        this.zoom = window.devicePixelRatio;
      }
    });
  }

  queryObj() {
    // we always load our token synchronously from local storage
    // for symplicity we are using type assertion to string here, avoiding to handle promises we're not expecting
    const token = this.jwtHelper.tokenGetter() as string;
    return {
      width: this.optimalWidth,
      height: this.optimalHeight,
      auth: token,
    };
  }

  buildQuery() {
    const queryString = [];
    for (const [k, v] of Object.entries(this.queryObj())) {
      if (v) {
        queryString.push(`${k}=${encodeURIComponent(v)}`);
      }
    }
    return queryString.join('&');
  }

  connect() {
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
    const tunnel = new WebSocketTunnel(
      this.endpoint + '/guacShell/' + this.vmid + '/connect',
    );
    if (this.client) {
      this.display.scale(0);
      this.uninstallKeyboard();
    }
    this.client = new Client(tunnel);
    clipboard.install(this.client);
    tunnel.onerror = (status) => {
      // eslint-disable-next-line no-console
      console.error(`Tunnel failed ${JSON.stringify(status)}`);
      this.shellService.setStatus(this.vmname, 'Tunnel Error');
      this.connectionState = states.TUNNEL_ERROR;
      if (this.retryCount < 7) {
        ++this.retryCount;
        setTimeout(() => {
          this.reloadConnection();
        }, this.retryCount * this.scalingDuration);
      }
    };
    tunnel.onstatechange = (state: Tunnel.State) => {
      switch (state) {
        // Connection is being established
        case Tunnel.State.CONNECTING:
          this.connectionState = states.CONNECTING;
          break;
        // Connection is established / no longer unstable
        case Tunnel.State.OPEN:
          this.connectionState = states.CONNECTED;
          break;
        // Connection is established but misbehaving
        case Tunnel.State.UNSTABLE:
          // TODO
          break;
        // Connection has closed
        case Tunnel.State.CLOSED:
          this.connectionState = states.DISCONNECTED;
          break;
      }
    };

    this.client.onstatechange = (clientState: Client.State) => {
      switch (clientState) {
        case 0:
          this.connectionState = states.IDLE;
          this.shellService.setStatus(this.vmname, 'Idle');
          break;
        case 1:
          // connecting ignored for some reason?
          this.shellService.setStatus(this.vmname, 'Connecting...');
          break;
        case 2:
          this.connectionState = states.WAITING;
          this.shellService.setStatus(this.vmname, 'Waiting...');
          break;
        case 3:
          this.retryCount = 0;
          this.connectionState = states.CONNECTED;
          this.shellService.setStatus(this.vmname, 'Connected');
          window.addEventListener('resize', () => {
            this.resize();
          });
          this.viewport.nativeElement.addEventListener('mouseenter', () => {
            this.resize();
          });
          clipboard.setRemoteClipboard(this.client);
          this.resize();
          break;
        case 4:
          this.shellService.setStatus(this.vmname, 'Disconnecting...');
          break;
        case 5:
          // Client error
          this.shellService.setStatus(this.vmname, 'Disconnected');
          break;
      }
    };
    this.client.onerror = (error) => {
      this.client.disconnect();
      // eslint-disable-next-line no-console
      console.error(`Client error ${JSON.stringify(error)}`);
      this.shellService.setStatus(this.vmname, 'Client Error');
      this.errorMessage = error.message;
      this.connectionState = states.CLIENT_ERROR;
    };
    this.client.onsync = null;

    // Test for argument mutability whenever an argument value is received
    this.client.onargv = (stream, mimetype, name) => {
      if (mimetype !== 'text/plain') return;
      const reader = new StringReader(stream);
      // Assemble received data into a single string
      let value = '';
      reader.ontext = (text) => {
        value += text;
      };
      // Test mutability once stream is finished, storing the current value for the argument only if it is mutable
      reader.onend = () => {
        const stream = this.client.createArgumentValueStream(
          'text/plain',
          name,
        );
        stream.onack = (status) => {
          if (status.isError()) {
            // ignore reject
            return;
          }
          this.arguments[name] = value;
        };
      };
    };
    this.client.onclipboard = (
      clipboardStream: InputStream,
      mimetype: Mimetype,
    ) => {
      clipboard.onClipboard(clipboardStream, mimetype);
    };
    this.display = this.client.getDisplay();
    const displayElm = this.terminalDiv.nativeElement;
    displayElm.appendChild(this.display.getElement());
    displayElm.addEventListener(
      'contextmenu',
      (e: {
        stopPropagation: () => void;
        preventDefault: () => void;
        returnValue: boolean;
      }) => {
        e.stopPropagation();
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
      },
    );

    const optimalResolution = this.getOptimalResolution();
    this.optimalHeight = optimalResolution?.height ?? 1024;
    this.optimalWidth = optimalResolution?.width ?? 744;
    this.client.connect(this.buildQuery());

    this.ctrService.getCodeStream().subscribe((c: CodeExec) => {
      if (!c) {
        return;
      }
      // if the code exec is target at us,execute it
      if (c.target.toLowerCase() == this.vmname.toLowerCase()) {
        // break up the code by lines
        const codeArray: string[] = c.code.split('\n');
        let command = '';
        //Append a carriage return and newline to every command.
        codeArray.forEach((s: string) => {
          command += s + '\r\n';
        });
        this.send(command);
      }
    });

    window.onunload = () => this.client.disconnect();
    this.mouse = new Mouse(displayElm);
    // Hide software cursor when mouse leaves display
    this.mouse.on('onmouseout', () => {
      if (!this.display) return;
      this.display.showCursor(false);
    });
    // allows focusing on the display div so that keyboard doesn't always go to session
    displayElm.onclick = () => {
      displayElm.focus();
    };
    displayElm.onfocus = () => {
      displayElm.className = 'focus';
    };
    displayElm.onblur = () => {
      displayElm.className = '';
    };
    this.keyboard = new Keyboard(displayElm);
    this.installKeyboard();
    this.mouse.onEach(
      ['mousedown', 'mousemove', 'mouseup'],
      this.handleMouseState,
    );
    setTimeout(() => {
      this.resize();
      displayElm.focus();
    }, 1000); // $nextTick wasn't enough
  }

  installKeyboard() {
    this.keyboard.onkeydown = (keysym) => {
      this.client.sendKeyEvent(1, keysym);
    };
    this.keyboard.onkeyup = (keysym) => {
      this.client.sendKeyEvent(0, keysym);
    };
  }

  uninstallKeyboard() {
    this.keyboard.onkeydown = this.keyboard.onkeyup = null;
  }

  async sleep(time: number) {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }

  /*
   *  Send a command to the server
   *
   *  What this actually does is:
   *  1. store the current remote clipboard
   *  2. copy the command to the remote clipboard
   *  3. paste the command using LEFT_CONTROL and V
   *  4. copy the old remote clipboard back to the server
   *
   *  The sleep function is needed in order for Guacamole to fullfill all key pressed events,
   *  otherwise it will sometimes not recognize the key as pressed, or paste the wrong clipboard.
   */
  async send(cmd: string) {
    if (!this.client) {
      return;
    }

    //LEFT_CONTROL and V as of https://github.com/apache/guacamole-client/blob/master/guacamole-common-js/src/main/webapp/modules/Keyboard.js
    //As Defined in the X11 Window System Protocol: https://www.cl.cam.ac.uk/~mgk25/ucs/keysymdef.h
    const pasteKeys = [0xffe3, 0x76];

    const remoteClipboard = {
      mimetype: clipboard.remoteClipboard.mimetype,
      data: clipboard.remoteClipboard.data,
    };
    this.copy({ mimetype: 'text/plain', data: cmd });

    //Press Keys to paste clipboard, and release them afterwards
    //sendKeyEvent(1, X) = press, sendKeyEvent(0,X) = release
    for (let i: 0 | 1 = 1; i >= 0; i = 0) {
      await this.sleep(20);
      this.client.sendKeyEvent(i, pasteKeys[0]);
      this.client.sendKeyEvent(i, pasteKeys[1]);
    }

    await this.sleep(50);
    this.copy(remoteClipboard);
  }

  copy(data: ClipboardCache) {
    if (!this.client) {
      return;
    }
    clipboard.cache = {
      mimetype: data.mimetype,
      data: data.data,
    };
    clipboard.setRemoteClipboard(this.client);
  }

  handleMouseState = (event: Event) => {
    const mouseEvent = event as Mouse.Event;
    const scale = this.display.getScale();
    const scaledMouseState = Object.assign({}, mouseEvent.state, {
      x: mouseEvent.state.x / scale,
      y: mouseEvent.state.y / scale,
    });
    this.client.sendMouseState(scaledMouseState);
  };

  ngOnChanges() {
    if (!this.connected && this.endpoint != null) {
      this.connected = true;
      this.connect();
    }
  }

  getOptimalResolution() {
    const elm = this.viewport.nativeElement;
    if (!elm || !elm.offsetWidth) {
      // resize is being called on the hidden window
      return;
    }
    const width = Math.floor(elm.clientWidth * this.zoom);
    const height = Math.floor(elm.clientHeight * this.zoom);
    return { width: width, height: height };
  }

  reloadConnection() {
    this.shellService.setStatus(this.vmname, 'Reconnecting');
    this.client.disconnect();
    this.connect();
  }

  resize() {
    const elm = this.viewport.nativeElement;
    if (!elm || !elm.offsetWidth) {
      // resize is being called on the hidden window
      return;
    }
    const optimalResolution = this.getOptimalResolution();
    this.optimalHeight = optimalResolution?.height ?? 1024;
    this.optimalWidth = optimalResolution?.width ?? 744;

    if (
      this.display.getWidth() !== optimalResolution?.width ||
      this.display.getHeight() !== optimalResolution?.height
    ) {
      this.client.sendSize(
        optimalResolution?.width ?? 1024,
        optimalResolution?.height ?? 744,
      );
    }
    // setting timeout so display has time to get the correct size
    setTimeout(() => {
      const scale = Math.min(
        elm.clientWidth / Math.max(this.display.getWidth(), 1),
        elm.clientHeight / Math.max(this.display.getHeight(), 1),
      );
      this.display.scale(scale);
    }, 100);
  }

  onResize() {
    this.resize();
  }
}
