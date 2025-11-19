import { inject, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselTransformService } from './carousel-transform.service';
import { positiveModulo } from '../helpers/utils.helper';
import { CarouselNavigationService } from './carousel-navigation.service';

@Injectable()
export class CarouselSwipeService {
  private navigationService = inject(CarouselNavigationService);

  constructor(
    private store: CarouselStore,
    private transformService: CarouselTransformService
  ) {}

  public calculateTargetPositionAfterSwipe(
    lastMoveTime: number,
    isReachEnd: boolean,
    isReachStart: boolean
  ): number {
    const isSwipe = Date.now() - lastMoveTime < 100;

    const { position, exactPosition } =
      this.transformService.getNewPositionFromTranslate(isSwipe);

    const virtualPosition =
      this.getVirtualPositionFromExactPosition(exactPosition);
    const currentVirtualPosition = this.getVirtualPositionFromExactPosition(
      this.store.currentPosition()
    );

    if (isSwipe) {
      return this.handleSwipeGesture(
        position,
        virtualPosition,
        currentVirtualPosition
      );
    }

    if (isReachEnd) {
      return this.handleEndReached(
        position,
        isSwipe,
        exactPosition,
        virtualPosition,
        currentVirtualPosition
      );
    }

    if (isReachStart) {
      return this.handleStartReached(
        position,
        isSwipe,
        exactPosition,
        virtualPosition,
        currentVirtualPosition
      );
    }

    return position ?? this.store.currentPosition();
  }

  private handleEndReached(
    position: number | undefined,
    isSwipe: boolean,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number
  ): number {
    if (isSwipe || virtualPosition > currentVirtualPosition) {
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
    isSwipe: boolean,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number
  ): number {
    if (isSwipe || virtualPosition < currentVirtualPosition) {
      // Minimum reached.
      if (this.store.state().rewind) {
        return this.store.totalSlides() - 1;
      }
      return Math.floor(exactPosition);
    }
    return position ?? this.store.currentPosition();
  }

  private handleSwipeGesture(
    position: number | undefined,
    virtualPosition: number,
    currentVirtualPosition: number
  ): number {
    const velocity = this.store.state().velocity;

    const positionNext = virtualPosition > currentVirtualPosition;
    const positionPrev = virtualPosition < currentVirtualPosition;
    const velocityNext = velocity < -0.1;
    const velocityPrev = velocity > 0.1;

    const isSlidingNext = positionNext || velocityNext;
    const isSlidingPrev = positionPrev || velocityPrev;

    if (isSlidingNext) {
      return this.navigationService.calculateNewPositionAfterNavigation(true);
    }

    if (isSlidingPrev) {
      return this.navigationService.calculateNewPositionAfterNavigation(false);
    }

    return position ?? this.store.currentPosition();
  }

  //   private handleSwipeGesture(
  //     position: number | undefined,
  //     virtualPosition: number,
  //     currentVirtualPosition: number
  //   ): number {
  //     const isSlidingNext = virtualPosition > currentVirtualPosition;
  //     const isSlidingPrev = virtualPosition < currentVirtualPosition;
  //     if (isSlidingNext || isSlidingPrev) {
  //       return this.navigationService.calculateNewPositionAfterNavigation(
  //         isSlidingNext
  //       );
  //     }
  //     return position ?? this.store.currentPosition();
  //   }

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
