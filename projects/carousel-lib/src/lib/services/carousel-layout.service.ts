import { ElementRef, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselTransformService } from './carousel-transform.service';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselVirtualService } from './carousel-virtual.service';

@Injectable()
export class CarouselLayoutService {
  constructor(
    private readonly store: CarouselStore,
    private readonly loopService: CarouselLoopService,
    private readonly virtualService: CarouselVirtualService
  ) {}

  updateLayoutFromSlides(
    slidesEls: ReadonlyArray<ElementRef<HTMLElement>>
  ): boolean {
    if (!slidesEls.length) {
      return false;
    }

    const firstSize = this.store
      .axisConf()
      .rectSize(slidesEls[0]?.nativeElement);
    if (!firstSize) {
      return false;
    }

    this.store.patch({
      slidesElements: [...slidesEls],
    });

    this.loopService.initializeLoopCenter();
    this.virtualService.initVirtualWindow();

    return true;
  }
}
