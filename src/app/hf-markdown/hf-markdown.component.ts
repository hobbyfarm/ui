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
      // block text
      if (language.length == 0) {
        if (/~~~([\s\S]*?)~~~/.test(code)) {
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
          return '<pre>' + content + '</pre>';
        } else {
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

      // determine what kind of special injection we need to do
      if (language.split(':')[0] == 'ctr') {
        // generate a new ID
        var id = ctrService.generateId();
        let maxCount = Number.POSITIVE_INFINITY;
        ctrService.setCode(id, code);
        // split the language (ctr:target)
        ctrService.setTarget(id, language.split(':')[1]);

        if (
          language.split(':').length > 2 &&
          !isNaN(Number(language.split(':')[2]))
        ) {
          maxCount = Number(language.split(':')[2]);
        }

        ctrService.setCount(id, maxCount);

        return '<ctr ctrid="' + id + '"></ctr>';
      } else if (language.split(':')[0] == 'vminfo') {
        var config = new VMInfoConfig();
        config.id = this.vmInfoService.generateId();
        config.name = language.split(':')[1];
        config.info = language.split(':')[2];
        config.ss = this.sessionId;
        config.mode = language.split(':')[3];
        config.code = code;
        this.vmInfoService.setConfig(config);

        return `<vminfo id="${config.id}"></vminfo>`;
      } else if (language.split(':')[0] == 'hidden') {
        return (
          '<details>' +
          '<summary>' +
          language.split(':')[1] +
          '</summary>' +
          this.markdownService.compile(code) +
          '</details>'
        );
      } else if (language.split(':')[0] == 'glossary') {
        return (
          "<div class='glossary'>" +
          language.split(':')[1] +
          "<span class='glossary-content'>" +
          this.markdownService.compile(code) +
          '</span></div>'
        );
      } else {
        // highlighted code
        return (
          "<pre class='language-" +
          language +
          "'>" +
          "<code class='language-" +
          language +
          "'>" +
          escape(code) +
          '</code>' +
          '</pre>'
        );
      }
    };
  }
}
