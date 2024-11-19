import { Component, Input, OnChanges } from "@angular/core";
import { MarkdownService } from "ngx-markdown";


@Component({
    selector: 'app-hidden-md',
    templateUrl: './hidden-md.component.html',
    styleUrls: ['./hidden-md.component.scss'],
  })
  export class HiddenMdComponent implements OnChanges {
    @Input() summary: string;
    @Input() code: string;
    parsedContent: Promise<string>;

    constructor(private markdownService: MarkdownService) {}
    ngOnChanges(): void {
      this.parsedContent = Promise.resolve(this.markdownService.parse(this.code));
    }
  }