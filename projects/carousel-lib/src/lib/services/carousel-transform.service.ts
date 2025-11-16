import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { positiveModulo } from '../helpers/utils.helper';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { calculateTranslateValueFromIndex } from '../helpers/calculations.helper';

@Injectable()
export class CarouselTransformService {
  private store = inject(CarouselStore, { self: true });
  private injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }
  constructor() {}

  public getNewPositionFromTranslate(velocity = false) {
    if (!this.store.state().loop) {
      this.store.patch({
        currentTranslate: Math.max(
          this.store.state().maxTranslate,
          Math.min(
            this.store.currentTranslate() +
              (velocity ? this.store.state().velocity : 0),
            this.store.state().minTranslate
          )
        ),
      });
    } else {
      this.store.patch({
        currentTranslate:
          this.store.currentTranslate() +
          (velocity ? this.store.state().velocity : 0),
      });
    }

    const currentTranslate =
      this.store.currentTranslate() +
      (velocity ? this.store.state().velocity : 0);
    let closestIndex = 0;
    let smallestDiff = Infinity;

    const snapPoints = this.store.slideTranslates();

    for (let i = 0; i < snapPoints.length; i++) {
      const diff = Math.abs(currentTranslate - snapPoints[i]);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = i;
      }
    }
    closestIndex = this.getRealPositionFromExactPosition(closestIndex);

    const isNewPosition =
      Math.abs(this.store.currentPosition() - closestIndex) >
      this.store.state().deltaPosition;

    return {
      exactPosition: closestIndex,
      position: isNewPosition ? Math.round(closestIndex) : undefined,
    };
  }

  public getRealPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const realPosition = this.store.slidesIndexOrder()[roundPosition];
    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = realPosition + decimalPart;
    return position;
  }

  /**
   * Get posX from slide index position.
   * @param index
   * @returns
   */
  public getTranslateFromPosition(
    index = this.store.currentRealPosition()
  ): number {
    const realIndexFromPosition = this.store
      .slidesIndexOrder()
      .findIndex((element) => element === index);

    // For centering without centering at bounds.
    if (this.store.center() && this.store.notCenterBounds()) {
      const isBefore =
        realIndexFromPosition < (this.store.slidesPerView() as number) / 2;
      const isAfter =
        realIndexFromPosition >
        this.store.totalSlides() - (this.store.slidesPerView() as number) / 2;
      if (isBefore || isAfter) {
        return isBefore ? this.store.minTranslate() : this.store.maxTranslate();
      }

      const centerValue =
        this.store.fullWidth() / 2 -
        this.store.slidesWidths()[realIndexFromPosition] / 2;

      const posX = this.calculateTranslateValueFromIndex(index) + centerValue;
      return this.clampTranslateValue(posX);
    }

    // Calculate position from slides widths and space between.
    const posX = this.calculateTranslateValueFromIndex(index);

    if (this.store.loop()) {
      // Authorize any translation without restriction.
      return posX;
    }

    // If not loop, we restrict translation to min and max.
    return this.clampTranslateValue(posX);
  }

  private calculateTranslateValueFromIndex(index: number) {
    return calculateTranslateValueFromIndex(index, {
      minTranslate: this.store.minTranslate(),
      marginStart: this.store.marginStart(),
      marginEnd: this.store.marginEnd(),
      spaceBetween: this.store.spaceBetween(),
      slidesWidths: this.store.slidesWidths(),
      totalSlides: this.store.totalSlides(),
      slidesIndexOrder: this.store.slidesIndexOrder(),
    });
  }

  private clampTranslateValue(posX: number) {
    return Math.max(
      this.store.maxTranslate(),
      Math.min(posX, this.store.minTranslate())
    );
  }

  public calculateInitialTranslations() {
    const realInitialSlide = this.store.state().initialSlide;
    const currentIndex =
      this.store.currentPosition() != -1 &&
      this.store.currentPosition() !== realInitialSlide
        ? this.store.currentPosition()
        : realInitialSlide;
    if (this.store.center()) {
      //@todo issue with initialslide
      const translateToApply = currentIndex
        ? this.getTranslateFromPosition(currentIndex)
        : this.store.minTranslate();
      this.view.updateTransform(translateToApply, false);
    } else {
      this.view.updateTransform(
        this.getTranslateFromPosition(currentIndex),
        false
      );
    }
  }
}
