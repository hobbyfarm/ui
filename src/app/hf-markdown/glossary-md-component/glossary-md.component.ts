import { Component, HostListener, Input, OnChanges } from "@angular/core";
import { MarkdownService } from "ngx-markdown";


@Component({
    selector: 'app-glossary-md',
    templateUrl: './glossary-md.component.html',
    styleUrls: ['./glossary-md.component.scss'],
  })
  export class GlossaryMdComponent implements OnChanges {
    @Input() term: string;
    @Input() code: string;
    parsedContent: Promise<string>;

    constructor(private markdownService: MarkdownService) {}
    ngOnChanges(): void {
      this.parsedContent = Promise.resolve(this.markdownService.parse(this.code));
    }
  }