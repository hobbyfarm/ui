import { Component, Input } from '@angular/core';
import { NoteType } from 'src/app/notetype';
import { HfMarkdownRenderContext } from '../hf-markdown.component';

@Component({
  selector: 'app-note-md',
  templateUrl: './note-md.component.html',
  styleUrls: ['./note-md.component.scss'],
})
export class NoteMdComponent {
  @Input() noteType: NoteType;
  @Input() message: string;
  @Input() code: string;
  @Input() ctx: HfMarkdownRenderContext = { vmInfo: {}, session: '' };
}
