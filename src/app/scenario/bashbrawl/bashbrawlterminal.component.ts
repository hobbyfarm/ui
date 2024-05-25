import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon, ITerminalDimensions } from 'xterm-addon-fit';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HostListener } from '@angular/core';
import { themes } from '../terminal-themes/themes';
import { SettingsService } from '../../services/settings.service';
import { CanvasAddon } from 'xterm-addon-canvas';
import { Keycodes } from './keycodes';
import { sleep } from '@cds/core/internal';

@Component({
  selector: 'app-bashbrawl-terminal',
  templateUrl: './bashbrawlterminal.component.html',
  styleUrls: ['bashbrawlterminal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BashbrawlterminalComponent implements OnInit, AfterViewInit {
  private term: Terminal;
  private fitAddon: FitAddon = new FitAddon();
  private attachAddon: AttachAddon;
  private dimensions: ITerminalDimensions;
  private firstTabChange = true;
  private isVisible = false;
  public mutationObserver: MutationObserver;

  private command = '';
  private commandFn: (command: string, params: string) => void =
    this.menuCommandsFn;
  private inputFn: (command: string) => void = this.handleCommandWithNewline;
  private cursorPosition = 0;
  private DEFAULT_FONT_SIZE = 16;
  private DEFAULT_TERMINAL_THEME = 'default';
  private DEFAULT_TERMINAL_SYMBOL = '#';

  private terminalSymbol = '#';
  private input_blocked = true;
  private interrupted = false;
  private TERMINAL_CHAR_DELAY = 40;
  private TERMINAL_WHITESPACE_DELAY = 2;

  // Game related
  private DEFAULT_GAME_TIME = 10;
  private gameMode: 'easy' | 'medium' | 'hard' = 'easy';
  private gameRunning = false;

  @ViewChild('terminal', { static: true }) terminalDiv: ElementRef;

  constructor(
    private jwtHelper: JwtHelperService,
    private settingsService: SettingsService,
  ) {}

  @HostListener('window:resize')
  public resize() {
    const newDimensions = this.fitAddon.proposeDimensions();
    if (this.isVisible && newDimensions) {
      this.dimensions = newDimensions;
      this.fitAddon.fit();
    }
  }

  private buildTerminal() {
    // Check if current browser is firefox by useragent and use "duck-typing" as a fallback.
    const regExp = /firefox|fxios/i;
    const isFirefox: boolean =
      regExp.test(navigator.userAgent.toLowerCase()) ||
      'InstallTrigger' in window;
    this.term = new Terminal({
      fontFamily: 'monospace',
      fontSize: this.DEFAULT_FONT_SIZE,
      letterSpacing: 1.1,
      cursorBlink: true,
    });
    if (!isFirefox) {
      // The default renderer is the dom renderer
      // Use the more performant canvas renderer if the current browser is not Firefox
      this.term.loadAddon(new CanvasAddon());
    }
    this.settingsService.settings$.subscribe(
      ({ terminal_theme = this.DEFAULT_TERMINAL_THEME }) => {
        this.setTerminalTheme(terminal_theme);
      },
    );
    this.settingsService.settings$.subscribe(
      ({ terminal_fontSize = this.DEFAULT_FONT_SIZE }) => {
        this.setFontSize(terminal_fontSize);
      },
    );
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalDiv.nativeElement);

    this.term.focus();
    this.resize();
    //this.term.write('welcome to Xterm.js Demo');

    this.handleCommand('help');

    this.term.onData((e) => {
      if (e === Keycodes.CTR_C) {
        console.log('interrupted');
        this.resetToDefaultShell();
        this.interrupted = true;

        return;
      }

      if (this.input_blocked) {
        return;
      }

      if (e === Keycodes.ENTER) {
        this.cursorPosition = 0;
        this.inputFn(this.command.trim());
        this.command = ''; // Reset command buffer
      } else if (e === Keycodes.BACKSPACE) {
        if (this.command.length > 0) {
          const beforeChar = this.command.slice(0, this.cursorPosition - 1);
          const afterChar = this.command.slice(this.cursorPosition);
          this.term.write(
            '\b' + afterChar + ' \b' + '\b'.repeat(afterChar.length),
          ); // Move cursor back, erase character, move cursor back again
          this.command = beforeChar + afterChar;
          // Remove last character from command buffer
          console.log(this.command);
          this.cursorPosition -= 1;
        }
      } else if (e === Keycodes.DELETE) {
        if (this.command.length > 0) {
          const beforeChar = this.command.slice(0, this.cursorPosition);
          const afterChar = this.command.slice(this.cursorPosition + 1);
          this.term.write(afterChar + ' \b' + '\b'.repeat(afterChar.length)); // Move cursor back, erase character, move cursor back again
          this.command = beforeChar + afterChar;
          // Remove last character from command buffer
          console.log(this.command);
          this.cursorPosition -= 1;
        }
      } else if (e === Keycodes.LEFT_ARROW) {
        if (this.cursorPosition > 0) {
          this.cursorPosition -= 1;
          this.term.write(Keycodes.LEFT_ARROW);
        }
        console.log('LEFT');
      } else if (e === Keycodes.RIGHT_ARROW) {
        if (this.cursorPosition < this.command.length) {
          this.cursorPosition += 1;
          this.term.write(Keycodes.RIGHT_ARROW);
        }
        console.log('RIGHT');
      } else if (e === Keycodes.UP_ARROW) {
        // TODO implement some weird logic here
        console.log('UP');
      } else if (e === Keycodes.DOWN_ARROW) {
        // TODO implement some weird logic here
        console.log('DOWN');
      } else {
        console.log(e);
        const beforeChar = this.command.slice(0, this.cursorPosition);
        const afterChar = this.command.slice(this.cursorPosition);
        this.term.write(e + afterChar + '\b'.repeat(afterChar.length));
        this.cursorPosition += 1;
        //this.term.write(e); // Echo the typed character
        this.command = beforeChar + e + afterChar; // Add typed character to command buffer
      }
    });
  }

  async startGame() {
    this.terminalSymbol = 'brawl#';

    this.commandFn = this.selectGameMode;
    await this.writeDelayed('Select the game mode');
    await this.writeDelayed('-easy');
    await this.writeDelayed('-medium (default)');
    await this.writeDelayed('-hard');
  }

  async selectLanguage() {}

  async beginGame() {
    await this.writeDelayed('Make yourself ready ... ', false);
    await sleep(1000);
    this.term.write('3 ');
    await sleep(1000);
    this.term.write('2 ');
    await sleep(1000);
    this.term.write('1');
    await sleep(1000);
    this.term.write('\r\n');

    this.gameRunning = true;
    this.inputFn = this.handleCommand;
    this.commandFn = this.gameCommand;
    this.input_blocked = false;
    this.term.write(` ${this.terminalSymbol} `);
    await sleep(this.DEFAULT_GAME_TIME * 1000);

    this.gameRunning = false;
    this.input_blocked = true;
    this.inputFn = this.handleCommandWithNewline;
    this.commandFn = this.noop;
    await this.endGame();
  }

  async endGame() {
    this.term.write('\r\n');
    await this.writeDelayed('Time is up!');
    await sleep(1000);
    await this.displayLeaderboard();
    this.resetToDefaultShell();
  }

  async displayLeaderboard() {
    await this.writeDelayed('Leaderboard');
    await this.writeDelayed('1. Jan');
    await this.writeDelayed('2. Jan');
    await this.writeDelayed('3. Jan');
  }

  async gameCommand(cmd: string, args: string) {
    // TODO Game logic
    this.term.write(' ✔ (' + cmd + ')');
    this.term.write('\r\n');
  }

  async selectGameMode(mode: string, args: string) {
    switch (mode) {
      case 'easy':
        this.gameMode = 'easy';
        await this.beginGame();
        break;
      case '':
      case 'medium':
        this.gameMode = 'medium';
        this.commandFn = this.selectLanguage;
        this.term.writeln('medium it is');
        break;
      case 'hard':
        this.gameMode = 'hard';
        this.term.writeln('hard it is');
        break;
      default:
        await this.writeDelayed(
          'Invalid option. Available options are: easy, medium and hard.',
        );
    }
  }

  async menuCommandsFn(command: string, args: string) {
    switch (command) {
      case '':
        break;
      case 'echo':
        this.term.writeln(args);
        break;
      case 'clear':
        this.term.clear();
        break;
      case 'play':
        await this.startGame();
        break;
      case 'leaderboard':
        await this.displayLeaderboard();
        break;
      case 'help':
        await this.writeDelayed(
          'Welcome to the arena! Type "play" to start the brawl!',
          true,
        );
        break;
      default:
        this.term.writeln(`Command not found: ${command}`);
    }
  }
  async handleCommand(input: string) {
    const args = input.split(' ');
    const command = args[0];
    const params = args.slice(1).join(' ');

    this.input_blocked = true;
    this.interrupted = false;

    await this.commandFn(command, params);

    this.term.write(` ${this.terminalSymbol} `);
    this.interrupted = false;
    this.input_blocked = false;
  }

  async handleCommandWithNewline(input: string) {
    this.term.write('\r\n');
    await this.handleCommand(input);
  }

  resetToDefaultShell() {
    this.command = '';
    this.terminalSymbol = this.DEFAULT_TERMINAL_SYMBOL;
    this.cursorPosition = 0;

    if (!this.input_blocked) {
      // We are inside a shell. Abort
      this.term.write(`\r\n ${this.terminalSymbol} `);
    }
    this.input_blocked = false;
    this.commandFn = this.menuCommandsFn;
  }

  async noop(command: string, args: string) {
    // none
  }

  async writeDelayed(
    text: string,
    newline: boolean = true,
    offset: number = 0,
  ) {
    if (text.length == offset || this.interrupted) {
      if (newline && offset != 0) {
        this.term.write(`\r\n`);
      }
      return;
    }

    const chars = text.split('');
    this.term.write(chars[offset]);
    const nextIsWhitespace =
      chars.length > offset + 1 && chars[offset + 1].match(/\s/);
    await sleep(
      nextIsWhitespace
        ? this.TERMINAL_WHITESPACE_DELAY
        : this.TERMINAL_CHAR_DELAY,
    );
    await this.writeDelayed(text, newline, offset + 1);
  }

  ngOnInit() {
    this.buildTerminal();
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
    this.term.options.theme = theme.styles;
  }

  private setFontSize(size: number) {
    if (!this.term) return;
    this.term.options.fontSize = size ?? this.DEFAULT_FONT_SIZE;
    this.resize();
  }
}
