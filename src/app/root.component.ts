import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html'
})
export class RootComponent {
    constructor(private router: Router){
        
    }
}