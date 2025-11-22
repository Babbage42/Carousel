import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';

@Injectable()
export class CarouselTransformService {
  private store = inject(CarouselStore, { self: true });
  private injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }
  constructor() {}

  public getNewPositionFromTranslate() {
    const currentTranslate = this.store.currentTranslate();
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
    const posX = this.store.slideTranslates()[index];

    if (this.store.loop()) {
      // Authorize any translation without restriction.
      return posX;
    }

    // If not loop, we restrict translation to min and max.
    return this.clampTranslateValue(posX);
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

  public calculateTargetPositionAfterTranslation(
    isReachEnd: boolean,
    isReachStart: boolean
  ): number {
    const { position, exactPosition } = this.getNewPositionFromTranslate();

    const realPosition = this.getVirtualPositionFromExactPosition(
      position ?? this.store.currentPosition()
    );

    const virtualPosition =
      this.getVirtualPositionFromExactPosition(exactPosition);
    const currentVirtualPosition = this.getVirtualPositionFromExactPosition(
      this.store.currentPosition()
    );

    if (isReachEnd) {
      return this.handleEndReached(
        realPosition,
        exactPosition,
        virtualPosition,
        currentVirtualPosition
      );
    }

    if (isReachStart) {
      return this.handleStartReached(
        realPosition,
        exactPosition,
        virtualPosition,
        currentVirtualPosition
      );
    }

    return realPosition;
  }

  private handleEndReached(
    position: number | undefined,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number
  ): number {
    if (virtualPosition > currentVirtualPosition) {
      // Maximum reached.
      if (this.store.state().rewind) {
        return 0;
      }
      return Math.ceil(exactPosition);
    }
    return position ?? this.store.currentPosition();
  }

  private handleStartReached(
    position: number | undefined,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number
  ): number {
    if (virtualPosition < currentVirtualPosition) {
      // Minimum reached.
      if (this.store.state().rewind) {
        return this.store.totalSlides() - 1;
      }
      return Math.floor(exactPosition);
    }
    return position ?? this.store.currentPosition();
  }

  private getVirtualPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const virtualPosition = this.store
      .slidesIndexOrder()
      .indexOf(roundPosition);
    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = virtualPosition + decimalPart;
    return position;
  }
}
