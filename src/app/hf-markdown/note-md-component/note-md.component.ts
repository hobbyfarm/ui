import { Component, Input, OnChanges } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { NoteType } from 'src/app/notetype';

@Component({
  selector: 'app-note-md',
  templateUrl: './note-md.component.html',
  styleUrls: ['./note-md.component.scss'],
})
export class NoteMdComponent implements OnChanges {
  @Input() noteType: NoteType;
  @Input() message: string;
  @Input() code: string;
  parsedContent: Promise<string>;

  constructor(private markdownService: MarkdownService) {}
  ngOnChanges(): void {
    this.parsedContent = Promise.resolve(this.markdownService.parse(this.code));
  }
}