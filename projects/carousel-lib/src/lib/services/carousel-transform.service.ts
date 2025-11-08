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

    let position =
      Math.abs(
        this.store.currentTranslate() - this.store.state().minTranslate
      ) /
      (this.store.slidesWidths()[0] + this.store.state().spaceBetween);

    position = this.getRealPositionFromExactPosition(position);

    const isNewPosition =
      Math.abs(this.store.currentPosition() - position) >
      this.store.state().deltaPosition;

    return {
      exactPosition: position,
      position: isNewPosition ? Math.round(position) : undefined,
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
    if (this.store.state().center && this.store.state().notCenterBounds) {
      const isBefore =
        realIndexFromPosition <
        (this.store.state().slidesPerView as number) / 2;
      const isAfter =
        realIndexFromPosition >
        this.store.state().totalSlides -
          (this.store.state().slidesPerView as number) / 2;
      if (isBefore || isAfter) {
        return isBefore
          ? this.store.state().minTranslate
          : this.store.state().maxTranslate;
      }

      const centerValue =
        this.store.state().fullWidth / 2 -
        this.store.slidesWidths()[realIndexFromPosition] / 2;

      const posX = this.calculateTranslateValueFromIndex(index) + centerValue;
      return this.clampTranslateValue(posX);
    }

    // Calculate position from slides widths and space between.
    const posX = this.calculateTranslateValueFromIndex(index);

    if (this.store.state().loop) {
      // Authorize any translation without restriction.
      return posX;
    }

    // If not loop, we restrict translation to min and max.
    return this.clampTranslateValue(posX);
  }

  private calculateTranslateValueFromIndex(index: number) {
    return calculateTranslateValueFromIndex(index, this.store.state());
  }

  private clampTranslateValue(posX: number) {
    return Math.max(
      this.store.state().maxTranslate,
      Math.min(posX, this.store.state().minTranslate)
    );
  }

  public calculateInitialTranslations() {
    const realInitialSlide = this.store.state().initialSlide;
    const currentIndex =
      this.store.currentPosition() != -1 &&
      this.store.currentPosition() !== realInitialSlide
        ? this.store.currentPosition()
        : realInitialSlide;
    if (this.store.state().center) {
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
