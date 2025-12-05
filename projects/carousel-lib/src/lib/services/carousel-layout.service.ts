import { ElementRef, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselTransformService } from './carousel-transform.service';
import { CarouselLoopService } from './carousel-loop.service';

@Injectable()
export class CarouselLayoutService {
  constructor(
    private readonly store: CarouselStore,
    private readonly transformService: CarouselTransformService,
    private readonly loopService: CarouselLoopService
  ) {}

  updateLayoutFromSlides(
    slidesEls: ReadonlyArray<ElementRef<HTMLElement>>
  ): boolean {
    if (!slidesEls.length) {
      return false;
    }

    const firstWidth = slidesEls[0]?.nativeElement?.clientWidth ?? 0;
    if (!firstWidth) {
      return false;
    }

    this.store.patch({
      slidesElements: [...slidesEls],
    });

    this.store.resetSlidesIndexOrder();

    this.transformService.calculateInitialTranslations();
    this.loopService.initializeLoopCenter();

    return true;
  }
}
