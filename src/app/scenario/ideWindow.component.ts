import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
    selector: 'app-ide-window',
    templateUrl: 'ideWindow.component.html',
  })


  export class IdeWindowComponent  {
    @Input()
    vmid: string;
  
    @Input()
    endpoint: string;

    @ViewChild('ideIframe', { static: true }) ideIframe: ElementRef;


    constructor(
      private jwtHelper: JwtHelperService
    ) {}

    ngOnInit() {
      var token = this.jwtHelper.tokenGetter()
      this.ideIframe.nativeElement.src = "https://"+this.endpoint+"/code/"+this.vmid+"/connect/8080/"+token+"/"
    }
  
  }