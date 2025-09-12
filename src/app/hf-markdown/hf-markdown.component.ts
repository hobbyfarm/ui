import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { CtrService } from '../scenario/ctr.service';
import { VM } from '../VM';
import { escape, uniqueString } from '../utils';

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
import { isNoteType, NoteType } from '../notetype';
import 'prismjs/components/prism-hcl';

export interface HfMarkdownRenderContext {
  vmInfo: { [vmName: string]: VM };
  session: string;
}

@Component({
  selector: 'app-hf-markdown',
  template: `
    @if (processedContent | async; as content) {
      <ngx-dynamic-hooks
        class="hf-md-content"
        [content]="content"
        [context]="context"
      ></ngx-dynamic-hooks>
    }
  `,
  styleUrls: ['./hf-markdown.component.scss'],
  standalone: false,
})
export class HfMarkdownComponent implements OnChanges, OnInit {
  @Input() content: string;
  @Input() context: HfMarkdownRenderContext = { vmInfo: {}, session: '' };

  processedContent: Promise<string>;

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
      // ngx-dynamic-hooks can only process stringified input objects
      const ctxString = JSON.stringify(this.context);
      return `<app-hidden-md [summary]="'${summary}'" [code]="'${escape(code)}'" [ctx]='${ctxString}'></app-hidden-md>`;
    },

    glossary(code: string, term: string) {
      return `<app-glossary-md [term]="'${term}'" [code]="'${escape(code)}'"></app-glossary-md>`;
    },

    note(code: string, type: string, message: string) {
      let noteType: NoteType = 'info';
      if (isNoteType(type)) {
        noteType = type;
      }
      const ctxString = JSON.stringify(this.context);
      return `<app-note-md [noteType]="'${noteType}'" [message]="'${message}'" [code]="'${escape(code)}'" [ctx]='${ctxString}'></app-note-md>`;
    },

    file(code: string, language: string, filepath: string, target: string) {
      const parts = filepath.split('/');
      const filename = parts[parts.length - 1];
      const n = 5; //Length of randomized token
      // Using only EOF as a token can cause trouble when the token is inside the file content. Let's use EOL together with a random string
      const token = 'EOF_' + uniqueString(n);
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
      return `<app-mermaid-md [code]="'${escape(code)}'"></app-mermaid-md>`;
    },

    quiz(
      code: string,
      quizTitle: string,
      allowedAttempts?: string,
      count?: string | null,
      shuffle?: string | null,
    ) {
      if (!count) {
        count = '0';
      }
      if (shuffle != 'true' && shuffle != 'false') {
        shuffle = 'false';
      }
      const tempAtts = Number(allowedAttempts);
      const allowedAtts = isNaN(tempAtts) || tempAtts < 1 ? 1 : tempAtts;
      const tmpCount = Number(count);
      const questionCount = isNaN(tmpCount) ? 0 : tmpCount;
      return `
      <quiz
        quizTitle="${quizTitle}"
        questionsRaw="${code}"
        [allowedAtts]="${allowedAtts}"
        [questionCount]="${questionCount}"
        [shuffle]="${shuffle}"
      >
      </quiz>
      `;
    },

    verifyTask(code: string, target: string, taskName: string) {
      return `<app-single-task-verification-markdown
        target="${target}" 
        message="${code}" 
        taskName="${taskName}"
        ></app-single-task-verification-markdown>`;
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
        const [infoString, ...codeParts] = codePart.split('\n');
        const processedCodePart = codeParts.join('\n');
        if (infoString.trim().length > 0) {
          content += this.markdownService.renderer.code(
            processedCodePart,
            infoString,
            false,
          );
        } else {
          content += this.markdownService.renderer.code(
            processedCodePart,
            undefined,
            false,
          );
        }
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

  constructor(
    public markdownService: MarkdownService,
    private ctrService: CtrService,
  ) {}

  ngOnInit(): void {
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

  ngOnChanges() {
    if (!this.content) {
      return;
    }

    const contentWithReplacedTokens = this.replaceSessionToken(
      this.replaceVmInfoTokens(this.content),
    );
    // the parse method internally uses the Angular Dom Sanitizer and is therefore safe to use
    const parsedContent = this.markdownService.parse(contentWithReplacedTokens);

    if (typeof parsedContent === 'string') {
      this.processedContent = Promise.resolve(parsedContent);
    } else {
      this.processedContent = parsedContent
        .then((processed) => processed)
        .catch((err) => {
          console.error('Failed to parse Markdown content: ', err);
          return 'Failed to parse Markdown content';
        });
    }
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
}
