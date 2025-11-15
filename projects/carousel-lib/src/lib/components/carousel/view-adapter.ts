import { InjectionToken } from '@angular/core';

export interface CarouselViewActions {
  updateTransform(
    translateToApply: number,
    updatePosition?: boolean,
    detectChanges?: boolean
  ): void;
  disableTransition(): void;
}
export const CAROUSEL_VIEW = new InjectionToken<CarouselViewActions>(
  'CAROUSEL_VIEW'
);
