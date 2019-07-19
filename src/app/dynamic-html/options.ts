import { Type } from '@angular/core';

export interface ComponentWithSelector {
    selector: string;
    component: Type<any>;
}
export class DynamicHTMLOptions {
    components: Array<ComponentWithSelector>;
}