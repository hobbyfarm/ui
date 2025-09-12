import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  standalone: false,
})
export class TooltipComponent implements AfterViewInit {
  @Input() content: string;
  @Output() heightChange = new EventEmitter<number>();
  @ViewChild('tooltip') tooltipElementRef: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.heightChange.emit(
      this.tooltipElementRef.nativeElement.getBoundingClientRect().height,
    );
  }
}
