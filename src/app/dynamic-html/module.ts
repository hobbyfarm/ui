import { NgModule, ModuleWithProviders } from '@angular/core';
import { DynamicHTMLComponent } from './dynamic-html.component';
import { DynamicHTMLOptions } from './options';
import { DynamicHTMLRenderer } from './renderer';

@NgModule({
    declarations: [DynamicHTMLComponent],
    exports: [DynamicHTMLComponent],
})
export class DynamicHTMLModule {
    static forRoot(options: DynamicHTMLOptions): ModuleWithProviders<DynamicHTMLModule> {
        return {
            ngModule: DynamicHTMLModule,
            providers: [
                DynamicHTMLRenderer,
                { provide: DynamicHTMLOptions, useValue: options },
            ],
        };
    }
}