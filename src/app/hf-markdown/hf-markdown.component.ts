import { Component, Input, OnChanges } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { VM } from '../VM';

// Replacement for lodash's escape
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export interface HfMarkdownRenderContext {
  vmInfo: { [vmName: string]: VM };
}

@Component({
  selector: 'app-hf-markdown',
  template: `
    <ngx-dynamic-hooks
      class="hf-md-content"
      [content]="processedContent | markdown"
      [context]="context"
    ></ngx-dynamic-hooks>
  `,
  styleUrls: ['./hf-markdown.component.scss'],
})
export class HfMarkdownComponent implements OnChanges {
  @Input() content: string;
  @Input() context: HfMarkdownRenderContext = { vmInfo: {} };

  processedContent: string;

  constructor(public markdownService: MarkdownService) {
    this.markdownService.renderer.code = (code: string, language = '') => {
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
    [tag: string]: (
      this: HfMarkdownComponent,
      code: string,
      ...args: string[]
    ) => string;
  } = {
    ctr(code: string, target: string, countStr: string) {
      const count = Number(countStr);
      return `<ctr
        target="${target}"
        ${isNaN(count) ? '' : `[count]="${count}"`}
      >${escape(code)}</ctr>`;
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

    quiz(code: string, quizType: string, title: string, helperText: string = "") {
      let correctAnswers: number = (code.match(/:\(x\)/g) || []).length;
      let qType: string = (quizType.toLowerCase() === "radio" && correctAnswers === 1) ? "radio" : "checkbox";
      return `
      <quiz-${qType}
        options="${code.slice(2)}"
        helperText="${helperText}"
        title="${title}"
      ></quiz-${qType}>
      `;
    },
  };

  private renderHighlightedCode(code: string, language: string) {
    const classAttr = `class="language-${language}"`;
    const codeNode = `<code ${classAttr}>${escape(code)}</code>`;
    return `<pre ${classAttr}>${codeNode}</pre>`;
  }

  private renderNestedPlainCode(code: string) {
    let content = '';
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

  ngOnChanges() {
    this.processedContent = this.replaceVmInfoTokens(this.content);
  }

  private replaceVmInfoTokens(content: string) {
    return content.replace(
      /\$\{vminfo:([^:]*):([^}]*)\}/g,
      (match, vmName, propName) => {
        const vm = this.context.vmInfo?.[vmName.toLowerCase()];
        return String(vm?.[propName as keyof VM] ?? match);
      },
    );
  }
}
