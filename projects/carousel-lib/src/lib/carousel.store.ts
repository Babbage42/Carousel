import {
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injectable,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { Carousel, Slide, SnapDom } from './models/carousel.model';
import { extractVisibleSlides } from './helpers/calculations.helper';

@Injectable()
export class CarouselStore {
  // All initial values.
  private readonly _state = signal<Carousel>({
    isProjected: false,
    hasReachedEnd: false,
    hasReachedStart: false,
    scrollWidth: 0,
    velocity: 0,
    fullWidth: 0,
    slidesIndexOrder: [],
    slidesWidths: [],
    allSlides: undefined,
    slidesElements: [] as ElementRef<HTMLElement>[],
    snapsDom: [],
    visibleDom: [],
    slides: [],
    slidesPerView: 1,
    spaceBetween: 0,
    showControls: true,
    alwaysShowControls: false,
    iconSize: 50,
    initialSlide: 0,
    freeMode: true,
    mouseWheel: false,
    deltaPosition: 0.6,
    showProgress: true,
    dotsControl: true,
    rewind: false,
    loop: false,
    center: false,
    notCenterBounds: false,
    slideOnClick: true,
    resistance: true,
    lazyLoading: true,
    currentPosition: -1,
    totalSlidesVisible: 0,
    totalSlides: 0,
    uniqueCarouselId: '',
    currentTranslate: 0,
    currentRealPosition: 0,
    lastTranslate: 0,
    slideTranslates: [],
    minTranslate: 0,
    maxTranslate: 0,
    marginStart: 0,
    marginEnd: 0,
    firstSlideAnchor: 0,
    lastSlideAnchor: 0,
    stepSlides: 1,
    autoplay: false,
    draggable: true,
    canSwipe: true,
    peekEdges: undefined,
    keyboardNavigation: true,
    navigateSlideBySlide: false,
    thumbsOptions: undefined,
  });

  // Final state with all updated values.
  public readonly state: Signal<Carousel> = computed(() => ({
    ...this._state(),
    fullWidth: this.fullWidth(),
    scrollWidth: this.scrollWidth(),
    maxTranslate: this.maxTranslate(),
    minTranslate: this.minTranslate(),
    snapsDom: this.snapsDom(),
    visibleDom: this.visibleDom(),
    slideTranslates: this.slideTranslates(),
    slidesWidths: this.slidesWidths(),
    totalSlides: this.totalSlides(),
    totalSlidesVisible: this.totalSlidesVisible(),
    firstSlideAnchor: this.firstSlideAnchor(),
    lastSlideAnchor: this.lastSlideAnchor(),
  }));

  setCurrentPosition(newPos: number) {
    if (newPos !== this.currentPosition()) {
      this.patch({ currentPosition: newPos });
    }
  }

  // Expose common values.
  // This values are calculated and updated from carousel component (inputs or dom).
  readonly currentRealPosition = computed(() => {
    const { currentRealPosition } = this._state();
    const total = this.totalSlides();
    if (total <= 0) {
      return currentRealPosition;
    }

    return this.clampPosition(currentRealPosition, total);
  });
  readonly currentPosition = computed(() => {
    const { currentPosition } = this._state();
    const total = this.totalSlides();
    if (total <= 0) {
      return currentPosition;
    }
    return this.clampPosition(currentPosition, total);
  });

  readonly hasReachedStart = computed(() => this._state().hasReachedStart);
  readonly hasReachedEnd = computed(() => this._state().hasReachedEnd);
  readonly currentTranslate = computed(() => this._state().currentTranslate);
  readonly lastTranslate = computed(() => this._state().lastTranslate);
  readonly allSlides = computed(() => this._state().allSlides);
  readonly slides = computed(() => this._state().slides);
  readonly slidesIndexOrder = computed(() => this._state().slidesIndexOrder);
  readonly slidesElements = computed(() => this._state().slidesElements);

  readonly pagination = computed(() => this._state().pagination);
  readonly loop = computed(() => this._state().loop);
  readonly freeMode = computed(() => this._state().freeMode);
  readonly rewind = computed(() => this._state().rewind);
  readonly slidesPerView = computed(() => this._state().slidesPerView);
  readonly spaceBetween = computed(() => this._state().spaceBetween);
  readonly center = computed(() => this._state().center);
  readonly notCenterBounds = computed(() => this._state().notCenterBounds);
  readonly marginStart = computed(() => this._state().marginStart);
  readonly marginEnd = computed(() => this._state().marginEnd);
  readonly draggable = computed(() => this._state().draggable);
  readonly canSwipe = computed(() => this._state().canSwipe);
  readonly resistance = computed(() => this._state().resistance);
  readonly slideOnClick = computed(() => this._state().slideOnClick);
  readonly navigateSlideBySlide = computed(
    () => this._state().navigateSlideBySlide
  );

  /**
   * TODO test with SSR
   */
  readonly peekEdges = computed(() => this._state().peekEdges);
  readonly peekOffset = computed(() => {
    const peek = this.peekEdges();
    if (!peek) {
      return 0;
    }

    if (this.center()) {
      return 0;
    }

    if (peek.absoluteOffset) {
      return peek.absoluteOffset;
    }

    const scrollWidth = this.scrollWidth();

    const widths = untracked(() => this.slidesWidths());
    const totalSlides = this.totalSlides();
    let baseWidth = widths[0] ?? 0;

    // Fallback
    if (!baseWidth) {
      const spv = this.slidesPerView();
      if (
        typeof spv === 'number' &&
        spv > 0 &&
        totalSlides > 0 &&
        scrollWidth > 0
      ) {
        baseWidth = scrollWidth / totalSlides;
      }
    }

    if (!baseWidth) {
      return 0;
    }

    return baseWidth * (peek.relativeOffset ?? 0);
  });

  // Computed, need to update manually in state.
  readonly fullWidth = computed(
    () => this.allSlides()?.nativeElement?.clientWidth ?? 0
  );
  readonly scrollWidth = computed(() => {
    // We must watch any slides update.
    this.slidesWidths();
    return this.allSlides()?.nativeElement?.scrollWidth;
  });
  readonly maxTranslate = computed(() => {
    const maxTranslate =
      -(this.scrollWidth() - this.fullWidth()) -
      this.marginEnd() -
      this.peekOffset();
    if (this.center() && !this.notCenterBounds()) {
      // @todo imprive slide width calculation ?
      return maxTranslate - this.fullWidth() / 2 + this.slidesWidths()[0] / 2;
    }
    return maxTranslate;
  });
  readonly minTranslate = computed(() => {
    const fullWidth = this.fullWidth();
    if (this.center() && !this.notCenterBounds()) {
      return fullWidth / 2 - this.slidesWidths()[0] / 2;
    }
    return this.marginStart() - this.peekOffset();
  });
  readonly totalSlides = computed(() => {
    if (this.slides() && this.slides().length) {
      return this.slides().length;
    }
    return this.slidesElements().length;
  });
  readonly totalSlidesVisible = computed(() => {
    return this.lastSlideAnchor() - this.firstSlideAnchor() + 1;
  });
  readonly lastSlideAnchor = computed(() => {
    if (this.totalSlides()) {
      if (this.loop()) {
        return this.totalSlides() - 1;
      }

      if (this.center()) {
        if (this.notCenterBounds() && this.slidesPerView() !== 'auto') {
          return (
            this.totalSlides() -
            Math.floor((this.slidesPerView() as number) / 2)
          );
        } else if (!this.notCenterBounds()) {
          return this.totalSlides() - 1;
        }
      } else {
        if (this.slidesPerView() !== 'auto') {
          return (
            this.totalSlides() - Math.floor(this.slidesPerView() as number)
          );
        }

        let index = this.totalSlides() - 1;
        let total = 0;
        let count = 0;
        while (index >= 0 && total + this.marginEnd() < this.fullWidth()) {
          total += this.slidesWidths()[index];
          count++;
          index--;
        }
        return this.totalSlides() - count + 1;
      }
    }
    return 0;
  });
  readonly firstSlideAnchor = computed(() => {
    this.totalSlides();
    if (this.center()) {
      if (this.notCenterBounds()) {
        if (this.slidesPerView() !== 'auto') {
          return Math.floor((this.slidesPerView() as number) / 2);
        }
        // TODO;
        return 0;
      }
      return 0;
    }
    return 0;
  });
  readonly slidesWidths = computed(() => {
    this.fullWidth();
    const slidesWidths = [];
    for (const slide of this.slidesElements()) {
      if (slide.nativeElement.getBoundingClientRect) {
        const slideWidth = slide.nativeElement.getBoundingClientRect().width;
        slidesWidths.push(slideWidth);
      }
    }
    return slidesWidths;
  });
  readonly snapsDom = computed(() =>
    this.slidesIndexOrder().map((logicalIndex, domIndex) => {
      const translate = this.slideTranslates()[logicalIndex];
      const left = -translate;
      const width = this.slidesWidths()[logicalIndex] ?? 0;
      return { domIndex, logicalIndex, left, width, translate };
    })
  );
  readonly visibleDom = computed(() => {
    return extractVisibleSlides(
      this.snapsDom(),
      this.currentTranslate(),
      this.fullWidth(),
      undefined,
      this.center()
    );
  });

  readonly slideTranslates = computed(() => {
    const slidesWidths = this.slidesWidths();
    const slidesIndexOrder = this.slidesIndexOrder();
    const snaps: number[] = new Array(this.totalSlides()).fill(0);

    untracked(() => {
      let currentTranslate = this.minTranslate();

      for (let domIndex = 0; domIndex < this.totalSlides(); domIndex++) {
        const logicalIndex = slidesIndexOrder[domIndex];
        const slideWidth = slidesWidths[logicalIndex];

        let snapPosition = currentTranslate;

        if (this.notCenterBounds()) {
          if (domIndex <= this.firstSlideAnchor()) {
            snapPosition = this.minTranslate();
          } else if (domIndex >= this.lastSlideAnchor()) {
            snapPosition = this.maxTranslate();
          }
        }

        if (domIndex !== 0) {
          snapPosition -= this.marginStart() - this.peekOffset();
        }

        if (domIndex === this.totalSlides() - 1) {
          snapPosition -= this.marginEnd() - this.peekOffset();
        }

        snaps[logicalIndex] = snapPosition;

        currentTranslate -= slideWidth + this.spaceBetween();

        if (this.notCenterBounds() && domIndex === this.firstSlideAnchor()) {
          currentTranslate += this.fullWidth() / 2 - slidesWidths[domIndex] / 2;
        }
      }
    });

    return snaps;
  });

  patch(partial: Partial<Carousel>) {
    this._state.update((curr) => ({ ...curr, ...partial }));
  }

  private clampPosition(position: number, totalSlides: number) {
    if (totalSlides <= 0) {
      return -1;
    }
    return Math.min(Math.max(0, position), totalSlides - 1);
  }
}
