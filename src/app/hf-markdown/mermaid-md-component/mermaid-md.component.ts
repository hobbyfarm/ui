import { Component, Input, OnChanges } from '@angular/core';
import mermaid, { RenderResult } from 'mermaid';
import { uniqueString, unescape } from 'src/app/utils';

@Component({
  selector: 'app-mermaid-md',
  templateUrl: './mermaid-md.component.html',
  styleUrls: ['./mermaid-md.component.scss'],
  standalone: false,
})
export class MermaidMdComponent implements OnChanges {
  @Input() code: string;
  public svgContent: Promise<RenderResult>;

  ngOnChanges(): void {
    mermaid.initialize({
      startOnLoad: false,
    });
    const n = 5;
    const uniqueSvgId = `svg-mermaid-${uniqueString(n)}`;
    this.svgContent = mermaid.render(uniqueSvgId, unescape(this.code));
  }
}
