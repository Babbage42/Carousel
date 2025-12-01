import { Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { positiveModulo } from '../helpers/utils.helper';

@Injectable()
export class CarouselNavigationService {
  constructor(private store: CarouselStore) {}
  /**
   * Calculate new index after prev or next action.
   * @param isSlidingNext
   * @returns
   */
  public calculateNewPositionAfterNavigation(isSlidingNext = true) {
    if (this.store.navigateSlideBySlide()) {
      const newIndex = isSlidingNext
        ? this.store.currentRealPosition() + this.store.state().stepSlides
        : this.store.currentRealPosition() - this.store.state().stepSlides;
      return Math.max(0, Math.min(newIndex, this.store.totalSlides() - 1));
    }

    const newIndex = isSlidingNext
      ? this.store.currentPosition() + this.store.state().stepSlides
      : this.store.currentPosition() - this.store.state().stepSlides;

    if (this.store.loop()) {
      return positiveModulo(newIndex, this.store.totalSlides());
    }

    return Math.max(
      0,
      Math.min(
        newIndex,
        isSlidingNext
          ? this.store.lastSlideAnchor()
          : this.store.lastSlideAnchor() - 1
      )
    );
  }
}
