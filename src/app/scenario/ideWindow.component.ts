import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Component({
  selector: 'app-ide-window',
  templateUrl: 'ideWindow.component.html',
  styleUrls: ['./ideWindow.component.scss'],
})


export class IdeWindowComponent {
  private token: string;
  public isOK: boolean = false;
  private url: string = "";
  public isLoading: boolean = true;
  public connError: boolean = false;

  @Input()
  vmid: string;

  @Input()
  endpoint: string;

  @ViewChild('ideIframe', { static: true }) ideIframe: ElementRef;


  constructor(
    private jwtHelper: JwtHelperService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.token = this.jwtHelper.tokenGetter()
    this.url = "https://" + this.endpoint + "/code/" + this.vmid + "/connect/8080/" + this.token + "/"
    this.callEndpoint()    
      this.ideIframe.nativeElement.innerText = "Loading"    
  }

  callEndpoint() {

    this.isOK = false;
    this.isLoading = true;
    this.connError = false;

    const req = this.http.get(this.url, {observe: 'response', responseType: 'text'}).pipe(
      retry(5)      
    )

    req.subscribe(res => {
      if (res.status == 200) {
        this.isOK = true
        this.isLoading = false
        this.ideIframe.nativeElement.src = this.url
      }
      else {
        this.isLoading = false
        this.isOK = false
        this.connError = true
      }
    }, err => { 
      //TODO: Better Error handling, still getting 403 
        this.isLoading = false
        this.isOK = false
        this.connError = true
    })


  }

}
