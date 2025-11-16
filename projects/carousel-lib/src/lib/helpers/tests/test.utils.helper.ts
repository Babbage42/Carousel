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

  currentPosition = () => this._currentPosition;

  state = () =>
    ({
      stepSlides: this._stepSlides,
      loop: this._loop,
      lazyLoading: this._lazyLoading,
      center: this._center,
    } as any);

  loop = () => this._loop;
  totalSlides = () => this._totalSlides;
  lastSlideAnchor = () => this._lastSlideAnchor;

  allSlides = () => this._allSlides;
  slidesElements = () => this._slidesElements;
  slidesPerView = () => this._slidesPerView;
  spaceBetween = () => this._spaceBetween;

  // --- setters pour les tests ---

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
}
