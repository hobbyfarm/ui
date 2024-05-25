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
import { LanguageCommandService } from './languages/language-command.service';

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
  private DEFAULT_GAME_TIME = 5; // TODO this is temporary for testing
  private gameLanguage: string;
  private gameRunning = false;
  private commandsEntered: string[] = [];
  private commandsEnteredAtTimepoint: number[] = [];
  private streak = 0;
  private highestStreak = 0;
  private gameTime = 0;
  private score = 0;

  // Leaderboards maps a list of score entries to the language they competed in.
  private leaderboard: Map<string, { name: string; score: number }[]> =
    new Map();

  @ViewChild('terminal', { static: true }) terminalDiv: ElementRef;

  constructor(
    private jwtHelper: JwtHelperService,
    private settingsService: SettingsService,
    private languageCommandService: LanguageCommandService,
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

    this.handleCommand('brawl welcome');

    this.term.onData((e) => {
      if (e === Keycodes.CTR_C) {
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
          this.cursorPosition -= 1;
        }
      } else if (e === Keycodes.DELETE) {
        if (this.command.length > 0) {
          if (this.cursorPosition >= this.command.length) {
            //We are one position behind the command, we can not delete something
            return;
          }
          const beforeChar = this.command.slice(0, this.cursorPosition);
          const afterChar = this.command.slice(this.cursorPosition + 1);
          this.term.write(afterChar + ' \b' + '\b'.repeat(afterChar.length)); // Move cursor back, erase character, move cursor back again
          this.command = beforeChar + afterChar;
        }
      } else if (e === Keycodes.LEFT_ARROW) {
        if (this.cursorPosition > 0) {
          this.cursorPosition -= 1;
          this.term.write(Keycodes.LEFT_ARROW);
        }
      } else if (e === Keycodes.RIGHT_ARROW) {
        if (this.cursorPosition < this.command.length) {
          this.cursorPosition += 1;
          this.term.write(Keycodes.RIGHT_ARROW);
        }
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

  async welcome() {
    return; // TODO remove

    await this.writeDelayed(
      'Welcome to the bashbrawl arena! Compete against the mighty and glory',
    );
    await this.writeDelayed(
      "Make a fast entry into the arena by typing 'brawl play' or view 'brawl help' for all options",
    );
  }
  async helpGame() {
    await this.term.writeln(
      'Start the game with one of the following option modes:',
    );

    await this.term.writeln('\nUsage:');
    await this.writeMatrix([
      ['brawl play', 'Commands from all languages are accepted'],
      [
        'brawl play [language]',
        'Enter the arena and compete with a single language',
      ],
      ['brawl list', 'View all available languages'],
      ['brawl top', 'View the leaderboard'],
    ]);
  }
  async startGame(option: string) {
    if (option && option != '') {
      await this.selectGameOption(option, '');
      return;
    } else {
      await this.helpGame();
    }
  }

  async beginGame(language: string) {
    // set language array here;
    this.score = 0;
    this.streak = 0;
    this.highestStreak = 0;
    this.commandsEntered = [];
    this.commandsEnteredAtTimepoint = [];
    this.gameTime = this.DEFAULT_GAME_TIME;
    this.gameLanguage = language;

    this.term.clear();
    await this.writeScore();

    this.terminalSymbol = 'brawl#';
    await this.moveToInputLine();
    await this.writeDelayed('Prepare yourself ... ', false);
    await sleep(1000);
    this.term.write('3 ');
    await sleep(1000);
    this.term.write('2 ');
    await sleep(1000);
    this.term.write('1');
    await sleep(1000);

    this.gameRunning = true;
    //this.inputFn = this.handleCommand;
    this.commandFn = this.gameCommand;
    this.input_blocked = false;

    await this.moveToInputLine();

    this.term.write(` ${this.terminalSymbol} `);

    while (this.gameTime > 0) {
      if (this.interrupted) {
        return;
      }
      await sleep(1000);
      this.gameTime -= 1;
      await this.writeScore();
    }

    this.gameRunning = false;
    this.input_blocked = true;
    //this.inputFn = this.handleCommandWithNewline;
    this.commandFn = this.noop;
    await this.endGame();
  }

  async writeScore() {
    // Save the current cursor position before making any changes
    this.term.write('\x1b[s');

    // Move to the first line of the viewport
    this.term.write('\x1b[1;1H'); // CSI H moves the cursor to the specified position (1;1 is top left)

    // Clear the first line
    this.term.write('\x1b[2K'); // CSI K clears part of the line. '2' clears the entire line.

    const strScore = '' + this.score;
    let scoreFormatted = strScore;
    if (strScore.length < 8) {
      scoreFormatted = ' '.repeat(8 - strScore.length) + strScore;
    }

    // Write the new scoreboard text
    this.term.write(' SCORE: ' + scoreFormatted);
    this.term.write(' TIME LEFT: ' + this.gameTime);
    this.term.write(
      ' LANGUAGE: ' +
        this.languageCommandService.getLanguageNameById(this.gameLanguage),
    );

    // write empty line below score line and clear the row
    this.term.write('\x1b[2;1H\x1b[2K');

    // Restore the previously saved cursor position
    this.term.write('\x1b[u');
  }

  async endGame() {
    this.term.write('\r\n');
    await this.writeDelayed('Time is up!');
    await sleep(2000);
    await this.writeDelayed('You scored ' + this.score + '!');
    await this.writeDelayed(
      'Your highest Streak was ' + this.highestStreak + '.',
    );
    // TODO print new highscrore

    await this.writeDelayed('Truly incredible. Enter your name:');

    this.commandFn = this.enterNameForLeaderboard;
    this.input_blocked = false;

    await this.moveToInputLine();
    this.terminalSymbol = ' Name: ';
  }

  async enterNameForLeaderboard(name: string, args: string) {
    if (!name || name == '') {
      await this.writeDelayed('Please enter your Name:');
      return;
    }

    let fullName = name;
    if (args) {
      fullName += ' ' + args;
    }
    this.input_blocked = true;

    const score = { name: fullName, score: this.score };
    if (this.leaderboard.has(this.gameLanguage)) {
      this.leaderboard.get(this.gameLanguage)?.push(score);
    } else {
      // first score for this language

      this.leaderboard.set(this.gameLanguage, [score]);
    }

    // TODO store leaderboard here

    await this.writeDelayed(`Thank you for playing, ${fullName}!`);
    await this.writeDelayed(`Let's view the Leaderboard.`);

    await this.displayLeaderboard(this.gameLanguage);
    this.resetToDefaultShell();
  }

  async displayLeaderboard(language: string) {
    if (!language || language == '') {
      language = 'all';
    }
    if (!this.leaderboard.has(language)) {
      await this.writeDelayed(`No Leaderboard for this language present.`);
      return;
    }

    await this.writeDelayed('Leaderboard');

    const scores = this.getTopPlayersByLanguage(this.leaderboard, language);

    const longestScore = scores[0][1]?.length ?? 0;
    scores.forEach((scoreEntry, index) => {
      const pad = longestScore - scoreEntry[1].length;
      scores[index][1] = ' '.repeat(pad) + scoreEntry[1];
    });

    await this.writeMatrix(scores, true);
  }

  getTopPlayersByLanguage(
    leaderboard: Map<string, { name: string; score: number }[]>,
    language: string,
  ): string[][] {
    // Retrieve the list of players for the specified language
    const entries = leaderboard.get(language);

    if (!entries) {
      console.log('No entries found for this language.');
      return [];
    }

    // Sort the entries by score in descending order
    const sortedEntries = entries.sort((a, b) => b.score - a.score);

    // Take the top 10 players
    const topPlayers = sortedEntries.slice(0, 10);

    // Convert to a two-dimensional array format: [name, score]
    return topPlayers.map((player) => [player.name, player.score.toString()]);
  }

  async displayAvailableLanguages() {
    const languages = this.languageCommandService
      .getLanguageKeys()
      .sort((a, b) => {
        return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
      });

    const matrix = this.convertToMatrix(languages, 7);
    await this.writeMatrix(matrix, false);
    //await this.writeMatrix(this.convertToMatrix(newLang, 4), false);
  }

  async gameCommand(cmd: string, args: string) {
    const r = this.languageCommandService.find(cmd, this.gameLanguage);

    let score: {
      base: number;
      fire: number;
      streak: number;
      streakPoints: number;
      total: number;
    } = {
      base: 0,
      fire: 0,
      streak: 0,
      streakPoints: 0,
      total: 0,
    };
    let outputString;

    const timePassed = this.DEFAULT_GAME_TIME - this.gameTime;

    if (r.found && !this.commandsEntered.includes(r.cmd)) {
      this.commandsEntered.push(r.cmd);
      this.streak += 1;
      this.highestStreak = Math.max(this.highestStreak, this.streak);

      if (this.commandsEnteredAtTimepoint[timePassed]) {
        this.commandsEnteredAtTimepoint[timePassed] += 1;
      } else {
        this.commandsEnteredAtTimepoint[timePassed] = 1;
      }

      score = this.getCommandScore();
      this.score += score.total;

      outputString = ' ✔ ' + r.cmd;

      if (this.gameLanguage == 'all') {
        outputString += ' | (' + r.lang.join(', ') + ')';
      }

      outputString += ' | + ' + score.total;

      if (score.fire > 0) {
        outputString += ' 🔥x' + score.fire;
      }
    } else if (this.commandsEntered.includes(r.cmd)) {
      this.commandsEnteredAtTimepoint = []; // Reset so the streak gets lost
      this.streak = 0;
      outputString = ' ✘ ' + cmd + '  | Duplicate to "' + r.cmd + '"';
    } else {
      this.commandsEnteredAtTimepoint = []; // Reset so the streak gets lost
      this.streak = 0;
      outputString = ' ✘ ' + cmd;
    }

    const totalRows = this.term.rows; // Total number of rows in the terminal
    const commandsAreaEnd = totalRows - 2; // The last line before the fixed input line

    // Write new command in the line just above the fixed input area
    this.term.write(`\x1b[${commandsAreaEnd};1H`); // Moves cursor and clears the line

    this.term.writeln(outputString); // Write the new command
    //this.term.writeln(''); // Write the new command
    // Update the scoreboard or perform other updates
    await this.writeScore();

    // Ensure the fixed input line is clean and the cursor is placed correctly
    this.term.write(`\x1b[${totalRows - 1};1H\x1b[2K`); // Optionally clear the input line
    await this.moveToInputLine();
  }

  // Calculate score based on the average count of commands over the last 5 seconds.
  getCommandScore() {
    const result: {
      base: number;
      fire: number;
      streak: number;
      streakPoints: number;
      total: number;
    } = {
      base: 128,
      fire: 0,
      streak: 0,
      streakPoints: 0,
      total: 0,
    };

    const timeSinceStart = this.DEFAULT_GAME_TIME - this.gameTime;
    const commandsInLastSeconds =
      this.commandsInLastSeconds(
        this.commandsEnteredAtTimepoint,
        timeSinceStart,
        7,
      ) - 3;

    const growthFactor = 2;
    let fireMultiplier = 1;
    if (commandsInLastSeconds >= 0) {
      fireMultiplier = Math.pow(growthFactor, commandsInLastSeconds + 1);
      result.fire = fireMultiplier;
    }

    result.streak = this.streak;
    result.streakPoints = result.base * (this.streak - 1);
    result.total = (result.base + result.streakPoints) * fireMultiplier;

    return result;
  }

  commandsInLastSeconds(
    commandsArray: number[],
    currentTimeIndex: number,
    seconds: number,
  ): number {
    let sum = 0;
    // Start from the current time index, go back up to 5 seconds if available
    for (
      let i = currentTimeIndex;
      i > currentTimeIndex - seconds && i >= 0;
      i--
    ) {
      sum += commandsArray[i] ?? 0;
    }
    return sum;
  }

  async moveToInputLine() {
    // Calculate the position for the new command line, which should be one line above the current input line
    const inputLinePosition =
      this.term.rows + this.term.buffer.active.viewportY - 1; // Position of the input line
    // Move back to the input line position
    this.term.write(`\x1b[${inputLinePosition + 1};1H`);
    this.term.write('\x1b[2K'); // Clear the line again to ensure it's clean for new input
  }

  async selectGameOption(input: string, _args: string) {
    const args = input.split(' ');
    const command = args[0];
    const params = args.slice(1).join(' ');

    switch (command) {
      case 'welcome':
        await this.welcome();
        break;
      case 'help':
        await this.helpGame();
        break;
      case 'play':
        await this.selectLanguage(params, '');
        break;
      case 'list':
        await this.displayAvailableLanguages();
        break;
      case 'leaderboard':
      case 'top':
        await this.displayLeaderboard(params);
        break;
      default:
        await this.term.writeln('Invalid Option: ' + input);
        await this.helpGame();
    }
  }

  async selectLanguage(language: string, args: string) {
    let languages = this.languageCommandService.getLanguageKeys();
    languages = languages.map((el) => {
      return el.toLowerCase();
    });
    if (languages.includes(language.toLowerCase())) {
      await this.beginGame(language.toLowerCase());
    } else if (language == '') {
      await this.beginGame('all');
    } else {
      await this.term.writeln('Invalid language. Available languages are: ');
      await this.displayAvailableLanguages();
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
      case 'brawl':
        await this.startGame(args);
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
    this.inputFn = this.handleCommandWithNewline;
    this.commandFn = this.menuCommandsFn;
  }

  async noop(command: string, args: string) {
    // none
  }

  async writeMatrix(text: string[][], writeDelayed: boolean = false) {
    const maxColumns = text.reduce((max, row) => Math.max(max, row.length), 0);
    // Calculate the longest string in each column
    const maxLengths: number[] = Array(maxColumns).fill(0);
    text.forEach((row) => {
      row.forEach((item, index) => {
        if (index < maxColumns) {
          // Ensure we don't exceed the number of columns
          maxLengths[index] = Math.max(maxLengths[index], item.length);
        }
      });
    });

    // Generate and write each row of the matrix
    for (const row of text) {
      let rowString = '';
      row.forEach((item, index) => {
        if (index < maxColumns) {
          // Ensure we don't exceed the number of columns
          const paddingLength = maxLengths[index] - item.length;
          rowString += `${item}${' '.repeat(paddingLength + 2)}`; // 2 spaces as gutter
        }
      });

      // Write the formatted row to the terminal
      if (writeDelayed) {
        await this.writeDelayed(rowString);
      } else {
        this.term.writeln(rowString);
      }
    }
  }

  // Simply convert a flat list to a matrix with numColumns
  // for advanced matrixes view convertToMatrixWithTerminalWidth
  convertToMatrix<T>(list: T[], numColumns: number): T[][] {
    const matrix: T[][] = [];
    for (let i = 0; i < list.length; i += numColumns) {
      matrix.push(list.slice(i, i + numColumns));
    }
    return matrix;
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

    const storedLeaderboard = localStorage.getItem('leaderboard');
    if (storedLeaderboard) {
      // Load leaderboard
      this.leaderboard = JSON.parse(storedLeaderboard);
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
    this.term.options.theme = theme.styles;
  }

  private setFontSize(size: number) {
    if (!this.term) return;
    this.term.options.fontSize = size ?? this.DEFAULT_FONT_SIZE;
    this.resize();
  }
}
