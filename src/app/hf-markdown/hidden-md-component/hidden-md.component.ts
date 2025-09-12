import { Component, Input } from '@angular/core';
import { HfMarkdownRenderContext } from '../hf-markdown.component';

@Component({
  selector: 'app-hidden-md',
  templateUrl: './hidden-md.component.html',
  styleUrls: ['./hidden-md.component.scss'],
  standalone: false,
})
export class HiddenMdComponent {
  @Input() summary: string;
  @Input() code: string;
  @Input() ctx: HfMarkdownRenderContext = { vmInfo: {}, session: '' };
}
