import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from './ServerResponse';
import { Scenario } from './scenario/Scenario';
import { environment } from 'src/environments/environment';
import { UserService } from './services/user.service';
import { ScenarioService } from './services/scenario.service';

@Component({
    selector: 'home-component',
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {
    public scenarios: Scenario[] = [];
    constructor(
        public helper: JwtHelperService,
        public http: HttpClient,
        public userService: UserService,
        public scenarioService: ScenarioService
    ) {
    }

    _refresh() {
        this.scenarioService.list().subscribe(
            (s: Scenario[]) => {
                this.scenarios = s
            }
        )
    }

    ngOnInit() {
        this._refresh();
        this.userService.getModifiedObservable()
        .subscribe(
            (_) => {
                // values push when adjustments made to access code list
                // thus, refresh the scenario list
                this._refresh();
            }
        )
    }
}