import { SafeHtml } from '@angular/platform-browser';
import { Pagination } from '../../public-api';
import { ElementRef } from '@angular/core';

export const TRANSITION_DURATION = 400; // ms

export interface Slide {}

export interface CarouselResponsiveConfig {
  [mediaQuery: string]: {
    slidesPerView?: number;
    spaceBetween?: number;
  };
}

export interface SnapDom {
  domIndex: number;
  logicalIndex: number;
  left: number;
  width: number;
  translate: number;
}

export interface Carousel {
  isProjected: boolean;
  snapsDom: SnapDom[];
  visibleDom: SnapDom[];
  resistance: boolean;
  slides: Slide[];
  slidesElements: ElementRef<HTMLElement>[];
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

  marginEnd: number;
  marginStart: number;

  lazyLoading?: boolean;

  breakpoints?: CarouselResponsiveConfig;

  customStyle?: SafeHtml;

  currentPosition: number;

  hasReachedEnd: boolean;

  hasReachedStart: boolean;

  totalSlidesVisible: number;

  totalSlides: number;

  fullWidth: number;

  scrollWidth: number;

  currentTranslate: number;
  currentRealPosition: number;
  lastTranslate: number;
  minTranslate: number;
  maxTranslate: number;

  slidesWidths: number[];

  uniqueCarouselId: string;

  allSlides: ElementRef<any> | undefined;

  slidesIndexOrder: number[];

  slideTranslates: number[];

  velocity: number;

  firstSlideAnchor: number;
  lastSlideAnchor: number;
}

export const CAROUSEL_SLIDE_CLASS = 'slide';
