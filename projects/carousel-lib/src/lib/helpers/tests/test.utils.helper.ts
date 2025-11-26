import { ElementRef } from '@angular/core';

export class CarouselStoreFake {
  private _currentPosition = 0;
  private _stepSlides = 1;
  private _loop = false;
  private _totalSlides = 0;
  private _lastSlideAnchor = 0;
  private _spaceBetween = 0;

  private _allSlides?: ElementRef<HTMLElement>;
  private _slidesElements?: ElementRef<HTMLElement>[];

  private _lazyLoading = false;
  private _slidesPerView: number | 'auto' = 1;
  private _center = false;

  private _fullWidth = 0;
  private _marginStart = 0;
  private _initialSlide = 0;

  private _visibleDom: any[] = [];
  private _slidesIndexOrder: number[] = [];
  private _slidesWidths: number[] = [];
  private _slideTranslates: number[] = [];
  private _snapsDom: any[] = [];
  private _currentTranslate = 0;
  private _lastTranslate = 0;

  currentPosition = () => this._currentPosition;

  state = () =>
    ({
      stepSlides: this._stepSlides,
      loop: this._loop,
      lazyLoading: this._lazyLoading,
      center: this._center,
      fullWidth: this._fullWidth,
      marginStart: this._marginStart,
      spaceBetween: this._spaceBetween,
      initialSlide: this._initialSlide,
      allSlides: this._allSlides,
    } as any);

  loop = () => this._loop;
  totalSlides = () => this._totalSlides;
  lastSlideAnchor = () => this._lastSlideAnchor;

  allSlides = () => this._allSlides;
  slidesElements = () => this._slidesElements;
  slidesPerView = () => this._slidesPerView;
  spaceBetween = () => this._spaceBetween;
  center = () => this._center;

  visibleDom = () => this._visibleDom;
  slidesIndexOrder = () => this._slidesIndexOrder;
  slidesWidths = () => this._slidesWidths;
  slides = () => this._slidesElements;
  slideTranslates = () => this._slideTranslates;
  snapsDom = () => this._snapsDom;
  currentTranslate = () => this._currentTranslate;
  lastTranslate = () => this._lastTranslate;

  patch(partial: any) {
    if (partial.slidesIndexOrder) {
      this._slidesIndexOrder = partial.slidesIndexOrder;
    }
    if (typeof partial.currentTranslate === 'number') {
      this._currentTranslate = partial.currentTranslate;
    }
    if (typeof partial.lastTranslate === 'number') {
      this._lastTranslate = partial.lastTranslate;
    }
  }

  setCurrentPosition(pos: number) {
    this._currentPosition = pos;
  }

  setStepSlides(step: number) {
    this._stepSlides = step;
  }

  setLoop(loop: boolean) {
    this._loop = loop;
  }

  setTotalSlides(total: number) {
    this._totalSlides = total;
  }

  setLastSlideAnchor(anchor: number) {
    this._lastSlideAnchor = anchor;
  }

  setAllSlides(allSlides: ElementRef<HTMLElement> | undefined) {
    this._allSlides = allSlides;
  }

  setSlidesElements(slides: ElementRef<HTMLElement>[] | undefined) {
    this._slidesElements = slides;
  }

  setLazyLoading(lazy: boolean) {
    this._lazyLoading = lazy;
  }

  setSlidesPerView(spv: number | 'auto') {
    this._slidesPerView = spv;
  }

  setSpaceBetween(space: number) {
    this._spaceBetween = space;
  }

  setCenter(center: boolean) {
    this._center = center;
  }

  // --- nouveaux setters pour ce que le service / tests utilisent ---

  setFullWidth(value: number) {
    this._fullWidth = value;
  }

  setMarginStart(value: number) {
    this._marginStart = value;
  }

  setInitialSlide(value: number) {
    this._initialSlide = value;
  }

  setVisibleDom(snaps: any[]) {
    this._visibleDom = snaps;
  }

  setSlidesIndexOrder(order: number[]) {
    this._slidesIndexOrder = order;
  }

  setSlidesWidths(widths: number[]) {
    this._slidesWidths = widths;
  }

  setSlideTranslates(translates: number[]) {
    this._slideTranslates = translates;
  }

  setSnapsDom(snaps: any[]) {
    this._snapsDom = snaps;
  }

  setCurrentTranslate(value: number) {
    this._currentTranslate = value;
  }

  setLastTranslate(value: number) {
    this._lastTranslate = value;
  }
}

export function createSlideElement(width: number): ElementRef<HTMLElement> {
  const nativeElement = {
    getBoundingClientRect: () => ({ width }),
  } as any;
  return new ElementRef(nativeElement);
}
