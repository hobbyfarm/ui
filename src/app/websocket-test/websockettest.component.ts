import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HfMarkdownRenderContext } from '../hf-markdown/hf-markdown.component';
import { AppConfigService } from '../app-config.service';

@Component({
  selector: 'app-websockettest',
  templateUrl: './websockettest.component.html',
  styleUrls: ['./websockettest.component.css'],
})
export class WebsocketTestComponent implements OnInit {
  target: string;
  wsEndpoint: string;
  endpoint: string;

  completed: boolean;

  mermaidString = 'sequenceDiagram';
  markdownString = '';
  mdContext: HfMarkdownRenderContext = { vmInfo: {}, session: '' };

  private Config = this.config.getConfig();
  public title = this.Config.title || "Rancher's Hobby Farm";

  constructor(
    private config: AppConfigService,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}
  ngOnInit(): void {
    this.target = this.route.snapshot.params['url'];
    this.endpoint = 'https://' + this.target + '/shell/healthz';
    this.wsEndpoint = 'wss://' + this.target + '/shell/websocketTest';
    this.testConnection();
  }

  testConnection() {
    this.addMermaidString('you', this.target, '/shell/healthz');
    this.http.get(this.endpoint).subscribe({
      next: () => {
        this.addMermaidString(this.target, 'you', '200, OK');
        this.testWSConnection();
      },
      error: (msg) => {
        console.log(msg);
        this.addMermaidString(this.target, 'you', msg.code);
      },
    });
  }

  testWSConnection() {
    this.addMermaidString('you', this.target, 'open websocket', '+');
    const socket = new WebSocket(this.wsEndpoint);
    socket.onmessage = (event) => {
      if (event.data == 'pong') {
        this.addMermaidString(this.target, 'you', 'pong', '-');
        this.completed = true;
      }
    };

    socket.onopen = () => {
      this.addMermaidString(this.target, 'you', 'websocket opened');
      socket.send('ping');
      this.addMermaidString('you', this.target, 'ping');
    };
  }

  addMermaidString(
    from: string,
    to: string,
    content: string,
    opChar: string = '',
  ) {
    this.mermaidString += '\n  ' + from + '->>' + opChar + to + ': ' + content;
    this.markdownString = '```mermaid\n' + this.mermaidString + '\n```';
  }
}
