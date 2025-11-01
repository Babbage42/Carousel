import { SafeHtml } from '@angular/platform-browser';
import { CarouselResponsiveConfig, Pagination } from '../../public-api';

export interface Slide {}

export interface Carousel {
  slidePositions: number[];
  resistance: boolean;
  slides: Slide[];
  slidesPerView: number | 'auto';
  spaceBetween: number;
  showControls: boolean;
  alwaysShowControls: boolean;
  iconSize: number;
  pagination?: Pagination;
  initialSlide: number;
  freeMode: boolean;
  mouseWheel:
    | boolean
    | {
        horizontal?: boolean;
        vertical?: boolean;
      };
  deltaPosition: number;
  showProgress: boolean;
  dotsControl: boolean;
  rewind: boolean;
  loop: boolean;
  center: boolean;
  notCenterBounds: boolean;
  slideOnClick: boolean;

  marginEnd?: number;
  marginStart?: number;

  lazyLoading?: boolean;

  breakpoints?: CarouselResponsiveConfig;

  customStyle?: SafeHtml;

  currentPosition: number;

  hasReachedEnd: boolean;

  hasReachedStart: boolean;

  totalSlidesVisible: number;

  totalSlides: number;

  fullWidth?: number;

  scrollWidth?: number;

  currentTranslate?: number;
  minTranslate?: number;
  maxTranslate?: number;

  slidesWidths?: number[];

  uniqueCarouselId: string;
}
