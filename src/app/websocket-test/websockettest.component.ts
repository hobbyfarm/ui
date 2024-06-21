import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-websockettest',
  templateUrl: './websockettest.component.html',
  styleUrls: ['./websockettest.component.css'],
})
export class WebsocketTestComponent implements OnInit {
  wsEndpoint: string;
  endpoint: string;
  inProgress: boolean = false;
  success: boolean;
  socketInProgress: boolean = false;
  socketSuccess: boolean;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}
  ngOnInit(): void {
    this.endpoint =
      'https://' + this.route.snapshot.params['url'] + '/shell/healthz';
    this.wsEndpoint =
      'wss://' + this.route.snapshot.params['url'] + '/shell/websocketTest';
    this.testConnection();
  }

  testConnection() {
    this.inProgress = true;
    this.http.get(this.endpoint).subscribe(() => {
      this.success = true;
      this.testWSConnection();
      this.inProgress = false;
    });
  }

  testWSConnection() {
    var socket = new WebSocket(this.wsEndpoint);
    socket.onmessage = (event) => {
      if (event.data == 'pong') {
        this.socketSuccess = true;
      }
    };

    socket.onopen = () => {
      socket.send('ping');
    };

    socket.onerror = () => {
      this.socketInProgress = true;
    };

    socket.onerror = () => {
      this.socketInProgress = false;
      this.socketSuccess = false;
    };
  }
}
