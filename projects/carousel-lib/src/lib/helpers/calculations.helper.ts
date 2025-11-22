import { Carousel, SnapDom } from '../models/carousel.model';

export function extractVisibleSlides(
  snapDom: SnapDom[],
  currentTranslate: number,
  fullWidth: number,
  offset?: number,
  center = false
): SnapDom[] {
  return snapDom.filter((s) => {
    const leftInView =
      s.left + currentTranslate + (center ? fullWidth / 2 : 0) - (offset ?? 0);
    const rightInView = leftInView + s.width;
    return rightInView > 0 && leftInView < fullWidth;
  });
}
