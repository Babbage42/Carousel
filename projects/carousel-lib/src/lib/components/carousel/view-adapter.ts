import { InjectionToken } from '@angular/core';

export interface CarouselViewActions {
  updateTransform(
    translateToApply?: number,
    updatePosition?: boolean,
    detectChanges?: boolean
  ): void;
  disableTransition(): void;
  slideToNext(): void;
  slideToPrev(): void;
  slideToNearest(): void;
  clickOnSlide(event: Event): void;
}
export const CAROUSEL_VIEW = new InjectionToken<CarouselViewActions>(
  'CAROUSEL_VIEW'
);
