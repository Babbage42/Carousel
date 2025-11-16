import { Carousel, SnapDom } from '../models/carousel.model';

export function extractVisibleSlides(
  snapDom: SnapDom[],
  currentTranslate: number,
  fullWidth: number,
  offset?: number
): SnapDom[] {
  return snapDom.filter((s) => {
    const leftInView = s.left + currentTranslate - (offset ?? 0);
    const rightInView = leftInView + s.width;
    return rightInView > 0 && leftInView < fullWidth;
  });
}

export function calculateTranslateValueFromIndex(
  index: number,
  {
    minTranslate,
    marginStart,
    marginEnd,
    slidesIndexOrder,
    slidesWidths,
    spaceBetween,
    totalSlides,
  }: Pick<
    Carousel,
    | 'minTranslate'
    | 'marginStart'
    | 'marginEnd'
    | 'slidesIndexOrder'
    | 'slidesWidths'
    | 'spaceBetween'
    | 'totalSlides'
  >
) {
  let posX = index === 0 ? minTranslate : minTranslate - marginStart;
  const realIndexFromPosition = slidesIndexOrder.findIndex(
    (element) => element === index
  );
  for (let i = 0; i < realIndexFromPosition; i++) {
    posX -= slidesWidths[i] + spaceBetween;
  }
  if (index === totalSlides - 1) {
    posX -= marginEnd;
  }
  return posX;
}
