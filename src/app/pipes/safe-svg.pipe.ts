import { Pipe, PipeTransform } from '@angular/core';
// import { DomSanitizer } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

// If we do not need interactivity with mermaid graphs, returning a data url for img tags is considered more secure.
// This way the svg cannot interact with the DOM at all.
// On the other hand, if we need interactivity with svg graphs (like copying titles etc.), we need to bypass Angular DOM sanitization.
// This is, because Angular does not allow svg as innerHTML.
// By using DOMPurify with svg as target, this is also secure, as long as the sanitization process works correctly without vulnerabilities.
@Pipe({
  name: 'safeSvg',
})
export class SafeSvgPipe implements PipeTransform {
//   constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): string {
    const purifiedSvg = DOMPurify.sanitize(value, { USE_PROFILES: { svg: true } });
    return `data:image/svg+xml;base64,${btoa(purifiedSvg)}`;
    // return this.sanitizer.bypassSecurityTrustHtml(purifiedSvg); 
  }
}
