import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-glossary-md',
  templateUrl: './glossary-md.component.html',
  styleUrls: ['./glossary-md.component.scss'],
})
export class GlossaryMdComponent {
  @Input() term: string;
  @Input() code: string;
}
