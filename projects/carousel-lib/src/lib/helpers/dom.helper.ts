import { ElementRef } from '@angular/core';
import { CAROUSEL_SLIDE_CLASS } from '../models/carousel.model';

export function extractSlidesFromContainer(
  container?: ElementRef<HTMLElement>
) {
  return container
    ? (Array.from(
        container?.nativeElement.querySelectorAll('.' + CAROUSEL_SLIDE_CLASS)
      ) as HTMLElement[])
    : [];
}
