import { inject, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { positiveModulo } from '../helpers/utils.helper';
import { CarouselLoopService } from './carousel-loop.service';

@Injectable()
export class CarouselNavigationService {
  private readonly loopService = inject(CarouselLoopService);
  private readonly store = inject(CarouselStore);

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

  public isSlideDisabled(index: number): boolean {
    const slidesInput = this.store.slides();
    if (slidesInput && slidesInput.length) {
      return !!slidesInput[index]?.disabled;
    }

    const projected = this.store.state().projectedSlides ?? [];
    if (projected.length) {
      return !!projected[index]?.slideDisabled;
    }

    return false;
  }

  /**
   * Get next activated index from given index in given direction.
   */
  public findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const total = this.store.totalSlides();
    if (!total) return from;

    let index = from;
    for (let i = 0; i < total; i++) {
      index = positiveModulo(index + direction, total);
      if (!this.isSlideDisabled(index)) {
        return index;
      }
    }

    return from;
  }

  public getNextIndex() {
    let indexSlided = undefined;
    this.loopService.insertLoopSlides(indexSlided, false);

    const hasReachedEnd = this.store.hasReachedEnd();
    let newPosition: number | undefined = undefined;
    if (hasReachedEnd && this.store.rewind()) {
      newPosition = 0;
    } else {
      newPosition = this.calculateNewPositionAfterNavigation(true);
    }

    newPosition = this.isSlideDisabled(newPosition)
      ? this.findNextEnabledIndex(this.store.currentPosition(), +1)
      : newPosition;

    return newPosition;
  }

  public getPrevIndex() {
    this.loopService.insertLoopSlides(undefined, true);

    let indexSlided = undefined;
    if (this.store.state().stepSlides > 1) {
      indexSlided =
        this.store.state().currentPosition -
        (this.store.state().stepSlides - 1) -
        1;
      indexSlided = positiveModulo(indexSlided, this.store.totalSlides());
    }

    const hasReachedStart = this.store.hasReachedStart();
    let newPosition: number | undefined = undefined;
    if (hasReachedStart && this.store.rewind()) {
      newPosition = this.store.totalSlides() - 1;
    } else {
      newPosition = this.calculateNewPositionAfterNavigation(false);
    }

    newPosition = this.isSlideDisabled(newPosition)
      ? this.findNextEnabledIndex(this.store.currentPosition(), -1)
      : newPosition;

    return newPosition;
  }
}
