import {
  Directive,
  Input,
  ElementRef,
  HostListener,
  ComponentRef,
  Injector,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  OverlayPositionBuilder,
  ScrollStrategyOptions,
  OverlayConfig,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { fromEvent, Subscription, take } from 'rxjs';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective {
  @Input('appTooltip') content: string;
  private overlayRef: OverlayRef;
  scrollSubscription: Subscription;
  tooltipHeightSubscription: Subscription;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private injector: Injector,
    private scrollStrategyOptions: ScrollStrategyOptions,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {}

  @HostListener('mouseenter')
  show() {
    if (!this.overlayRef) {
      // Position the overlay beneath its parent element
      const positionStrategy = this.overlayPositionBuilder
        .flexibleConnectedTo(this.elementRef)
        .withViewportMargin(10) // Add margin to prevent touching viewport edge
        .withFlexibleDimensions(false) // Allow resizing
        .withPush(false) // Pushes the overlay into view if near viewport edge
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 0,
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          },
        ]);
      // Overlay configuration with scroll strategy and position strategy
      const config = new OverlayConfig({
        positionStrategy, // Necessary for correct positioning
        width: 120, // This needs(!) to be set to the tooltip's width
        hasBackdrop: false,
        direction: 'ltr',
        disposeOnNavigation: true,
        // Repositions on scroll... this only works if the scrollable parent container is annotated with cdkScrollable!
        // Since we do not have access to the scrollable clarity modal body wrapper, this do not work in clarity modals.
        scrollStrategy: this.scrollStrategyOptions.reposition(),
      });

      // Create the overlay with the configuration
      this.overlayRef = this.overlay.create(config);
    }

    const tooltipPortal = new ComponentPortal(
      TooltipComponent,
      null,
      this.injector
    );
    const tooltipRef: ComponentRef<TooltipComponent> =
      this.overlayRef.attach(tooltipPortal);
    tooltipRef.instance.content = this.content;
    tooltipRef.instance.heightChange
      .pipe(take(1))
      .subscribe((height: number) => {
        if (this.overlayRef) {
          // To correctly position the overlay, it needs to acquire the tooltip height.
          this.overlayRef.updateSize({ height: `${height}px` });
        }
      });

    this.checkScrollInModal();
  }

  @HostListener('mouseleave')
  hide() {
    if (this.scrollSubscription && !this.scrollSubscription.closed) {
      this.scrollSubscription.unsubscribe();
    }
    this.overlayRef.detach();
  }

  // Automatic repositioning does not work within clarity modals ...
  // Therefore, simply detach the overlay on scroll events in modals
  private checkScrollInModal() {
    const scrollableModal: HTMLDivElement =
      this.elementRef.nativeElement.closest('.modal-body-wrapper');
    if (scrollableModal) {
      this.scrollSubscription = fromEvent(scrollableModal, 'scroll')
        .pipe(take(1))
        .subscribe(() => {
          if (this.overlayRef) {
            this.overlayRef.detach();
          }
        });
    }
  }
}
