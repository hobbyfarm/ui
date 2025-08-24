import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, timer } from 'rxjs';
import { RetryConfig, retry } from 'rxjs/operators';
import { webinterfaceTabIdentifier } from './step.component';

@Component({
  selector: 'app-ide-window',
  templateUrl: 'ideWindow.component.html',
  styleUrls: ['./ideWindow.component.scss'],
  standalone: false,
})
export class IdeWindowComponent implements OnInit {
  private token: string;
  public isOK = false;
  private url: string;
  public isLoading = true;
  public isConnError = false;

  @Input()
  vmid: string;

  @Input()
  endpoint: string;

  @Input()
  port = 80;

  @Input()
  path = '/';

  @Input()
  disallowIFrame = false;

  @Output()
  openWebinterfaceFn: EventEmitter<string> = new EventEmitter(false);

  @Input()
  reloadEvent: Observable<webinterfaceTabIdentifier>;

  @ViewChild('ideIframe', { static: true }) ideIframe: ElementRef;

  constructor(
    private jwtHelper: JwtHelperService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    if (this.disallowIFrame) {
      return;
    }
    // we always load our token synchronously from local storage
    // for symplicity we are using type assertion to string here, avoiding to handle promises we're not expecting
    this.token = this.jwtHelper.tokenGetter() as string;
    this.reloadEvent.subscribe((data: webinterfaceTabIdentifier) => {
      if (this.vmid == data.vmId && this.port == data.port) {
        this.callEndpoint();
      }
    });
    this.url =
      'https://' +
      this.endpoint +
      '/pa/' +
      this.token +
      '/' +
      this.vmid +
      '/' +
      this.port +
      this.path;
    this.callEndpoint();
  }

  callEndpoint() {
    this.isOK = false;
    this.isLoading = true;
    this.isConnError = false;

    const req = this.http
      .get(this.url, { observe: 'response', responseType: 'text' })
      .pipe(retry(retryConfig));

    req.subscribe({
      next: (res) => {
        if (res.status == 200) {
          this.isOK = true;
          this.isLoading = false;
          this.ideIframe.nativeElement.src = this.url;
        } else {
          this.isLoading = false;
          this.isOK = false;
          this.isConnError = true;
        }
      },
      error: () => {
        // This only Errors if the Proxy in gargantua-shell throws an Error, not if the Service on the VM fails
        this.isLoading = false;
        this.isOK = false;
        this.isConnError = true;
      },
    });
  }
}

export const retryConfig: RetryConfig = {
  count: 7,
  delay: (_error: any, retryCount: number) => {
    const scalingDuration = 1000;
    return timer(retryCount * scalingDuration);
  },
};
