import { Component, Input } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { CtrService } from '../scenario/ctr.service';
import { VMInfoService } from '../scenario/vminfo.service';
import { VMInfoConfig } from '../VMInfoConfig';

// Replacement for lodash's escape
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

@Component({
  selector: 'app-hf-markdown',
  template: `
    <ngx-dynamic-hooks
      class="hf-md-content"
      [content]="content | markdown"
    ></ngx-dynamic-hooks>
  `,
  styleUrls: ['./hf-markdown.component.scss'],
})
export class HfMarkdownComponent {
  @Input() content: string;
  @Input() sessionId: string;

  constructor(
    public ctrService: CtrService,
    public vmInfoService: VMInfoService,
    public markdownService: MarkdownService
  ) {
    this.markdownService.renderer.code = (code: string, language: string) => {
      const [tag, ...args] = language.split(':');
      if (tag in this.taggedCodeRenderers) {
        const renderer = this.taggedCodeRenderers[tag];
        return renderer.call(this, code, ...args);
      } else if (language.length > 0) {
        return this.renderHighlightedCode(code, language);
      } else if (/~~~([\s\S]*?)~~~/.test(code)) {
        return this.renderNestedPlainCode(code);
      } else {
        return this.renderSimplePlainCode(code);
      }
    };
  }

  private readonly taggedCodeRenderers: {
    [tag: string]: (this: HfMarkdownComponent, code: string, ...args: string[]) => string;
  } = {
    ctr(code: string, target: string, countStr: string) {
      var id = this.ctrService.generateId();
      this.ctrService.setCode(id, code);
      this.ctrService.setTarget(id, target);

      let count = Number(countStr);
      if (isNaN(count)) {
        count = Number.POSITIVE_INFINITY;
      }
      this.ctrService.setCount(id, count);

      return `<ctr ctrid="${id}"></ctr>`;
    },

    vminfo(code: string, name: string, info: string, mode: string) {
      const config = new VMInfoConfig();
      config.id = this.vmInfoService.generateId();
      config.name = name;
      config.info = info;
      config.ss = this.sessionId;
      config.mode = mode;
      config.code = code;
      this.vmInfoService.setConfig(config);

      return `<vminfo id="${config.id}"></vminfo>`;
    },

    hidden(code: string, summary: string) {
      return `
        <details>
          <summary>${summary}</summary>
          ${this.markdownService.compile(code)}
        </details>
      `;
    },

    glossary(code: string, term: string) {
      return `
        <div class="glossary">
          ${term}
          <span class='glossary-content'>
            ${this.markdownService.compile(code)}
          </span>
        </div>
      `;
    },
  };

  private renderHighlightedCode(code: string, language: string) {
    const classAttr = `class="language-${language}"`;
    const codeNode = `<code ${classAttr}>${escape(code)}</code>`;
    return `<pre ${classAttr}>${codeNode}</pre>`;
  }

  private renderNestedPlainCode(code: string) {
    let content: string = '';
    const codeArray: string[] = code.split('~~~');
    codeArray.forEach((codePart: string, index: number) => {
      // First part inside a block outside nested blocks
      if (index == 0) {
        content += escape('\n' + codePart);

        // This case occurs outside nested blocks
      } else if (index % 2 == 0) {
        content += escape(codePart).replace(/^\s/, '');

        // This case occurs when an odd number of tildes appear within a fenced block
        // and therefore not all of them can be resolved.
      } else if (index % 2 != 0 && index == codeArray.length - 1) {
        content += escape('~~~' + codePart);

        // This case occurs inside nested blocks
      } else if (codePart) {
        content += this.markdownService.compile('~~~' + codePart + '~~~');
      } else {
        content += '~~~~~~';
      }
    });
    return `<pre>${content}</pre>`;
  }

  private renderSimplePlainCode(code: string) {
    // code block is empty or only contains white spaces
    if (!code.trim()) {
      return '<pre></pre>';
    }
    // Prevent leading blank lines from being removed on non-empty code blocks
    else if (/^\n/.test(code)) {
      return '<pre>' + '\n' + escape(code) + '</pre>';
    } else {
      return '<pre>' + escape(code) + '</pre>';
    }
  }
}
