import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
    selector: 'home-component',
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {
    private scenarios: string[];
    constructor(
        private helper: JwtHelperService
    ) {
    }

    ngOnInit() {
        var tok = this.helper.decodeToken(this.helper.tokenGetter());
        this.scenarios = tok.scenarios;
    }
}