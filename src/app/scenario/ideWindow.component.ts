import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';

@Component({
  selector: 'app-ide-window',
  templateUrl: 'ideWindow.component.html',
  styleUrls: ['./ideWindow.component.scss'],
})


export class IdeWindowComponent implements OnInit {
  private token: string;
  public isOK = false;
  private url: string = "";
  public isLoading = true;
  public isConnError = false;

  @Input()
  vmid: string;

  @Input()
  endpoint: string;

  @Input()
  port: number

  @ViewChild('ideIframe', { static: true }) ideIframe: ElementRef;


  constructor(
    private jwtHelper: JwtHelperService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.token = this.jwtHelper.tokenGetter()
    this.url = "https://" + this.endpoint + "/code/" + this.vmid + "/connect/"+this.port+"/" + this.token + "/"
    this.callEndpoint()    
    this.ideIframe.nativeElement.innerText = "Loading"    
  }

  callEndpoint() {
    console.log("Call Endpoint")
    this.isOK = false;
    this.isLoading = true;
    this.isConnError = false;

    const req = this.http.get(this.url, {observe: 'response', responseType: 'text'}).pipe(
      retryWhen(genericRetryStrategy())
    )

    req.subscribe(
      res => {
      console.log("Subscribe")
      if (res.status == 200) {
        this.isOK = true
        this.isLoading = false
        this.ideIframe.nativeElement.src = this.url
      }
      else {
        this.isLoading = false
        this.isOK = false
        this.isConnError = true
      }
      console.log("Success: ", res)
    }, err => { 
      //TODO: Better Error handling, still getting 403 => Probably from the calls from inside the iFrame, not here (before showing iFrame)
        this.isLoading = false
        this.isOK = false
        this.isConnError = true
        console.log(err)
    })
  }
}

export const genericRetryStrategy = ({
  maxRetryAttempts = 7,
  scalingDuration = 1000,
}: {
  maxRetryAttempts?: number,
  scalingDuration?: number,
} = {}) => (attempts: Observable<any>) => {
  return attempts.pipe(
    mergeMap((error, i) => {
      const retryAttempt = i + 1;
      if (
        retryAttempt > maxRetryAttempts) {
        return throwError(error);
      }
      return timer(retryAttempt * scalingDuration);
    })
  );
};

