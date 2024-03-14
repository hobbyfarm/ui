import { Component, Input, OnChanges } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { CtrService } from '../scenario/ctr.service';
import { VM } from '../VM';

import Prism from 'prismjs';
import mermaid from 'mermaid';
// Load desired languages
// TODO: Import all available languages
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-yaml';

// Replacement for lodash's escape
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export interface HfMarkdownRenderContext {
  vmInfo: { [vmName: string]: VM };
  session: string;
}

@Component({
  selector: 'app-hf-markdown',
  template: `
    <ngx-dynamic-hooks
      class="hf-md-content"
      [content]="processedContent"
      [context]="context"
    ></ngx-dynamic-hooks>
  `,
  styleUrls: ['./hf-markdown.component.scss'],
})
export class HfMarkdownComponent implements OnChanges {
  @Input() content: string;
  @Input() context: HfMarkdownRenderContext = { vmInfo: {}, session: '' };

  processedContent: string;

  constructor(
    public markdownService: MarkdownService,
    private ctrService: CtrService,
  ) {
    mermaid.initialize({
      startOnLoad: false,
    });
    this.markdownService.renderer.code = (code: string, language = '') => {
      const [tag, ...args] = language.split(':');
      if (tag in this.taggedCodeRenderers) {
        const renderer = this.taggedCodeRenderers[tag];
        return renderer.call(this, code, ...args);
      } else if (language.length > 0) {
        return this.renderHighlightedCode(code, tag, ...args);
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
      const id = this.ctrService.registerCode(code);
      return `<ctr
        target="${target}"
        ctrId="${id}"
        ${isNaN(count) ? '' : `[count]="${count}"`}
      >${escape(code)}</ctr>`;
    },

    hidden(code: string, summary: string) {
      return `
        <details>
          <summary>${summary}</summary>
          ${this.markdownService.parse(code)}
        </details>
      `;
    },

    glossary(code: string, term: string) {
      return `
        <div class="glossary">
          ${term}
          <span class='glossary-content'>
            ${this.markdownService.parse(code)}
          </span>
        </div>
      `;
    },

    quiz(
      code: string,
      quizTitle: string,
    ) {
      return `
      <quiz
        quizTitle="${quizTitle}"
        questionsRaw="${code}"
      >
      </quiz>
      `;
    },

    note(code: string, type: string, message: string) {
      return `
        <div class="note ${type}">
          <ng-container class='note-title'>
          ${message ?? type.toUpperCase()}:
          </ng-container>
          <div class='note-content'>
            ${this.markdownService.parse(code)}
          </div>
        </div>
      `;
    },

    file(code: string, language: string, filepath: string, target: string) {
      const parts = filepath.split('/');
      const filename = parts[parts.length - 1];
      const n = 5; //Length of randomized token
      // Using only EOF as a token can cause trouble when the token is inside the file content. Let's use EOL together with a random string
      const token = 'EOF_' + this.uniqueString(n);
      const fileContent = `cat << ${token} > ${filepath}
${code}
${token}`;
      const id = this.ctrService.registerCode(fileContent);
      return `<ctr
        target="${target}"
        ctrId="${id}"
        filename="${filepath}"
        title="Click to create ${filepath} on ${target}"
      >${this.renderHighlightedCode(code, language, filename)}</ctr>`;
    },

    mermaid(code: string) {
      const n = 5;
      const containerId = `mermaid-${this.uniqueString(n)}`;
      // Start the async rendering process
      setTimeout(() => this.renderMermaidGraph(code, containerId), 0);
      // Return a placeholder with the unique ID
      return `<div id="${containerId}">Loading mermaid graph...</div>`;
    },
  };

  private renderHighlightedCode(
    code: string,
    language: string,
    fileName?: string,
  ) {
    const fileNameTag = fileName
      ? `<p class="filename" (click)=createFile(code,node)>${fileName}</p>`
      : `<p class="language">${language}</p>`;
    const classAttr = `language-${language}`;

    if (Prism.languages[language]) {
      code = Prism.highlight(code, Prism.languages[language], language);
    }

    return `<pre>${fileNameTag}<code class=${classAttr}>${code}</code></pre>`;
  }

  private renderMermaidGraph(code: string, containerId: string) {
    mermaid
      .render('svg-' + containerId, code)
      .then((renderResult) => {
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = renderResult.svg;
        }
      })
      .catch((error) => {
        console.error('Mermaid rendering failed:', error);
      });
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
        content += this.markdownService.parse('~~~' + codePart + '~~~');
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
    const contentWithReplacedTokens = this.replaceSessionToken(
      this.replaceVmInfoTokens(this.content),
    );
    // the parse method internally uses the Angular Dom Sanitizer and is therefore safe to use
    this.processedContent = this.markdownService.parse(
      contentWithReplacedTokens,
    );
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

  private replaceSessionToken(content: string) {
    return content.replace(/\$\{session\}/g, this.context.session);
  }

  private uniqueString(n: number) {
    return `${(Math.random().toString(36) + '0000').slice(2, n + 2)}`;
  }
}
