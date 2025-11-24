import { SafeHtml } from '@angular/platform-browser';
import { Pagination } from '../../public-api';
import { ElementRef } from '@angular/core';

export const TRANSITION_DURATION = 400; // ms

export interface Slide {}

export type AutoplayOptions = {
  delay?: number; // ms entre 2 avances (par défaut 2500)
  pauseOnHover?: boolean; // pause quand la souris est dessus
  pauseOnFocus?: boolean; // pause quand un élément interne a le focus
  stopOnInteraction?: boolean; // stop définitif si l’utilisateur interagit (flèche, drag, dot…)
  disableOnHidden?: boolean; // stop quand l’onglet n’est pas visible
  resumeOnMouseLeave?: boolean; // relance à la sortie si pas stop
};

export interface CarouselResponsiveConfig {
  [mediaQuery: string]: {
    slidesPerView?: number;
    spaceBetween?: number;
  };
}

export type PeekEdges =
  | undefined
  | {
      absoluteOffset?: number;
      relativeOffset?: number;
    };

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

  lazyLoading: boolean;

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

  stepSlides: number;

  autoplay: boolean | AutoplayOptions;

  draggable: boolean;

  peekEdges: PeekEdges;

  dragIgnoreSelector?: string;
}

export const CAROUSEL_SLIDE_CLASS = 'slide';
