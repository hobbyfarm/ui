import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Title }  from '@angular/platform-browser';
import { AppComponent } from './app.component';

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html'
})
export class RootComponent {
    constructor(
      private router: Router,
      private titleService: Title,
      private appComponent: AppComponent,
    ) {

        this.titleService.setTitle( this.appComponent.title );
    }
}
