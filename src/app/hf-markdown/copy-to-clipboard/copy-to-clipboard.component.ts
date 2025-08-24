import { Component, Input } from '@angular/core';
import { CtrService } from 'src/app/scenario/ctr.service';

@Component({
  selector: 'app-copy-to-clipboard',
  templateUrl: './copy-to-clipboard.component.html',
  styleUrls: ['./copy-to-clipboard.component.scss'],
  standalone: false,
})
export class CopyToClipboardComponent {
  @Input() ctrId: string;

  wasClicked = false;

  constructor(private ctrService: CtrService) {}

  clicked() {
    const code = this.ctrService.getCodeById(this.ctrId);
    navigator.clipboard.writeText(code).then(() => {
      this.wasClicked = true;
      setTimeout(() => {
        this.wasClicked = false;
      }, 2500);
    });
  }
}
