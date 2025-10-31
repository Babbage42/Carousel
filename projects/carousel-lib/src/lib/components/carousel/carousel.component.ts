import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  signal,
  TemplateRef,
  ViewChild,
  ContentChildren,
  QueryList,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
  ContentChild,
  viewChild,
  WritableSignal,
  forwardRef,
  viewChildren,
  ViewContainerRef,
  inject,
  input,
  computed,
  untracked,
} from '@angular/core';
import { debounceTime, fromEvent } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SlideDirective } from '../../directives/slide.directive';
import {
  Pagination,
  PaginationComponent,
} from '../pagination/pagination.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { style } from '@angular/animations';
import { NavigationComponent } from '../navigation/navigation.component';
import { CarouselNavLeftDirective } from '../../directives/navigation/navigation-left.directive';
import { CarouselNavRightDirective } from '../../directives/navigation/navigation-right.directive';
import { CarouselRegistryService } from './carousel-registry.service';
import { Carousel, Slide } from '../../models/carousel.model';
import {
  generateRandomClassName,
  positiveModulo,
} from '../../helpers/utils.helper';

export interface CarouselResponsiveConfig {
  [mediaQuery: string]: {
    slidesPerView?: number;
    spaceBetween?: number;
  };
}

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [
    CommonModule,
    PaginationComponent,
    SlideDirective,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
    NavigationComponent,
  ],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: CarouselRegistryService, useClass: CarouselRegistryService },
  ],
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly TRANSITION_DURATION = 400; // ms
  private loopCheckTimeout?: any;
  private isAnimating = false;

  @ContentChildren(SlideDirective) projectedSlides!: QueryList<SlideDirective>;

  @ContentChild(CarouselNavLeftDirective)
  customLeftArrow?: CarouselNavLeftDirective;
  @ContentChild(CarouselNavRightDirective)
  customRightArrow?: CarouselNavRightDirective;

  @Input() slides: Slide[] = [];
  @Input() slidesPerView: number | 'auto' = 4.5;
  @Input() spaceBetween: number = 5;
  @Input() showControls = true;
  @Input() alwaysShowControls = false;
  @Input() iconSize = 50;
  @Input() pagination: Pagination | undefined = {
    type: 'dynamic_dot',
    clickable: true,
    external: false,
  };
  @Input() freeMode = true;
  @Input() mouseWheel:
    | boolean
    | {
        horizontal?: boolean;
        vertical?: boolean;
      } = false;
  @Input() deltaPosition = 0.6;
  @Input() showProgress = true;
  @Input() dotsControl = true;
  @Input() rewind = false;
  @Input() center = false;
  @Input() notCenterBounds = false;
  @Input() resistance = true;

  loopInput = input<boolean>(false, { alias: 'loop' });
  get loop() {
    return this.loopInput();
  }
  initialSlide = input<number>(0);
  realInitialSlide = computed(() => {
    const initial = this.initialSlide();
    return initial;
  });

  @Input() slideOnClick = true;

  @Input() marginEnd = 0;
  @Input() marginStart = 0;

  @Input() lazyLoading = true;
  @Input() breakpoints?: CarouselResponsiveConfig;
  private mediaQueryListeners: {
    mql: MediaQueryList;
    listener: (e: MediaQueryListEvent) => void;
  }[] = [];

  // @todo
  // Handle first display of center (and margin/initial slide) via purcent
  // in style

  @Input() customStyle = undefined;
  //  add lazyPreloadPrevNext	number	0
  // Number of next and previous slides to preload. Only applicable if using lazy loading.

  @Output() slideUpdate = new EventEmitter();
  @Output() slideNext = new EventEmitter();
  @Output() slidePrev = new EventEmitter();
  @Output() touched = new EventEmitter();
  @Output() reachEnd = new EventEmitter();
  @Output() reachStart = new EventEmitter();

  private _currentPosition: number = this.realInitialSlide();
  set currentPosition(newPosition: number) {
    this.initTouched();
    if (newPosition !== this._currentPosition) {
      console.log('*** Position changed (slideUpdate) ***', newPosition);
      this.slideUpdate.emit(newPosition);
    }
    this._currentPosition = newPosition;
  }
  get currentPosition() {
    return this._currentPosition;
  }

  firstTouch = false;
  uniqueCarouselId = '';
  generatedStyles: SafeHtml = '';
  fullWidth = 0;
  scrollWidth = 0;
  totalSlides = 0;
  totalRealSlides = 0;
  totalSlidesVisible = signal(0);
  //allSlidesElements: HTMLElement[] = [];
  slidesWidths: number[] = [];
  slidesPositions = [];
  hasReachedEnd = false;
  hasReachedStart = false;
  isProjected = false;
  allSlides = viewChild<ElementRef>('allSlides');
  slidesElements = viewChildren<ElementRef<HTMLElement>>('slide');

  displayedAllSlides: ElementRef<HTMLElement>[] = [];

  // Can be used by user to move pagination element.
  @ViewChild('paginationTemplate', { static: true })
  public paginationTemplate!: TemplateRef<any>;

  private navigation = viewChild(NavigationComponent);

  private slidesIndexOrder = [] as number[];

  private carouselState: WritableSignal<Carousel> = signal({} as Carousel);

  constructor(
    private renderer: Renderer2,
    private detectChanges: ChangeDetectorRef,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    public carouselRegistry: CarouselRegistryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // TODO Replace by resizeobserver
    if (!this.isServerMode) {
      fromEvent(window, 'resize')
        .pipe(debounceTime(200))
        .subscribe(() => this.refresh());
    }

    effect(
      () => {
        const navigation = this.navigation();
        // this.navigationLeftSignal.set(navigation?.leftControl());
        // this.navigationRightSignal.set(navigation?.rightControl());

        this.carouselRegistry.carouselNavigationLeftSignal.set(
          navigation?.leftControl()
        );
        this.carouselRegistry.carouselNavigationRightSignal.set(
          navigation?.rightControl()
        );
      },
      {
        allowSignalWrites: true,
      }
    );

    effect(
      () => {
        const slides = this.slidesElements();
        this.totalRealSlides = slides.length;
        this.slidesIndexOrder = slides.map((_, index) => index);

        untracked(() => {
          this.updateCarouselState({
            totalSlides: this.totalRealSlides ?? 0,
          });
        });
      },
      { allowSignalWrites: true }
    );
  }

  private updateCarouselState(partial: Partial<Carousel>) {
    this.carouselState.set({ ...this.carouselState(), ...partial });
  }

  private getPositionFromSlideIndex(slide: HTMLElement) {
    const classes = slide.className.split(' ');
    const posClass = classes.find((cls: any) => cls.indexOf('position-') === 0);
    const position = Number(posClass?.split('-')[1]) - 1;
    return position;
  }

  private get realSlidesPerView() {
    return this.carouselState().slidesPerView;
  }
  private get realSpaceBetween() {
    return this.carouselState().spaceBetween;
  }

  private insertLoopSlides(before = true) {
    if (!this.loopInput()) {
      return;
    }

    const firstIndex = this.slidesIndexOrder[0];
    const lastIndex = this.slidesIndexOrder[this.slidesIndexOrder.length - 1];
    const realOrderIndex = this.slidesIndexOrder.indexOf(this.currentPosition);
    if (before && realOrderIndex > 0) {
      return;
    }
    if (
      !before &&
      realOrderIndex <
        this.slidesIndexOrder.length - 1 - (this.realSlidesPerView as number)
    ) {
      return;
    }

    const slides = Array.from(
      this.allSlides()?.nativeElement.querySelectorAll('.slide')
    ) as HTMLElement[];
    const container = this.allSlides()?.nativeElement;
    if (!container || !Array.isArray(slides) || slides.length === 0) {
      return;
    }

    const currentIndex = this.currentPosition;

    if (before) {
      const lastRef = slides[slides.length - 1];

      const lastValue = this.slidesIndexOrder.pop() as number;
      this.slidesIndexOrder = [lastValue, ...this.slidesIndexOrder];

      const lastEl = lastRef as HTMLElement | undefined;
      const firstReal = container.querySelector('.slide') as HTMLElement | null;

      if (lastEl && firstReal && lastEl !== firstReal) {
        // remove then insert before firstReal (safe operation)
        try {
          container.removeChild(lastEl);
          container.insertBefore(lastEl, firstReal);
        } catch (e) {
          // fallback: try insertBefore directly
          container.insertBefore(lastEl, firstReal);
        }
      }
    } else {
      // If we're at the end, move the sfirst slide to the end.
      const firstRef = slides[0];
      const firstEl = firstRef as HTMLElement | undefined;
      if (firstEl) {
        // appendChild will move the node if it already exists in DOM
        container.appendChild(firstEl);

        const lastValue = this.slidesIndexOrder.shift() as number;
        this.slidesIndexOrder = [...this.slidesIndexOrder, lastValue];
      }
    }

    this.applyTranslate(
      before
        ? this.currentTranslate - this.slidesWidths[currentIndex]
        : this.currentTranslate + this.slidesWidths[currentIndex]
    );

    // Very important to update mousemoving.
    this.lastTranslate = this.currentTranslate;
  }

  public get isServerMode() {
    return !isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (
      typeof this.slidesPerView === 'string' &&
      this.slidesPerView !== 'auto'
    ) {
      this.slidesPerView = parseInt(this.slidesPerView);
    }
    if (!this.uniqueCarouselId) {
      this.uniqueCarouselId = generateRandomClassName(10);
    }

    this.carouselState.set({
      resistance: this.resistance,
      showControls: this.showControls,
      alwaysShowControls: this.alwaysShowControls,
      iconSize: this.iconSize,
      slides: this.slides,
      initialSlide: this.initialSlide(),
      freeMode: this.freeMode,
      mouseWheel: this.mouseWheel,
      deltaPosition: this.deltaPosition,
      showProgress: this.showProgress,
      dotsControl: this.dotsControl,
      slidesPerView: this.slidesPerView,
      spaceBetween: this.spaceBetween,
      totalSlides: 0,
      totalSlidesVisible: 0,
      currentPosition: this._currentPosition,
      currentTranslate: 0,
      minTranslate: 0,
      maxTranslate: 0,
      slidesWidths: [],
      fullWidth: 0,
      scrollWidth: 0,
      loop: this.loop,
      rewind: this.rewind,
      center: this.center,
      notCenterBounds: this.notCenterBounds,
      uniqueCarouselId: this.uniqueCarouselId,
      slideOnClick: this.slideOnClick,
      hasReachedEnd: false,
      hasReachedStart: false,
    });

    this.applyBreakpoints();
  }

  ngAfterViewInit(): void {
    this.initProjectedSlides();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.mediaQueryListeners.forEach(({ mql, listener }) => {
      mql.removeEventListener('change', listener);
    });
  }

  private refresh() {
    console.log('slidesperview', this.slidesPerView, this.carouselState());
    this.applySpaceBetween();
    this.applySlidesPerView();

    // We must wait browser calculation for grid display.
    this.calculateGridWidth();

    this.updateSlides();

    this.detectChanges.detectChanges();
  }

  public initTouched() {
    if (!this.firstTouch) {
      this.touched.emit();
      this.firstTouch = true;
    }
  }

  /**
   * Add class to identify slides roles and states.
   * @returns
   */
  public updateSlides() {
    if (!this.allSlides()) {
      return;
    }
    this.renderer.addClass(
      this.allSlides()?.nativeElement,
      this.uniqueCarouselId
    );

    if (this.slidesElements()) {
      this.slidesElements().forEach(
        (slide: ElementRef<HTMLElement>, index: number) => {
          this.resetPositions(slide.nativeElement, index);
          this.setAccessibility(slide.nativeElement, index);
          this.setLazyLoading(slide.nativeElement, index);
        }
      );

      this.setSlidesPositions();
    }
  }

  private getMaxSlide() {
    return Math.min(this.totalSlidesVisible(), this.totalSlides) - 1;
  }

  /**
   * Handle slide to prev index.
   * From navigation or accessibility.
   */
  public slideToPrev() {
    this.insertLoopSlides(true);

    const hasReachedStart = this.currentPosition <= 0;
    let newPosition: number | undefined = undefined;
    if (hasReachedStart) {
      console.log('minimum reached');
      if (this.rewind) {
        newPosition = this.totalSlides - 1;
      } else {
        newPosition = this.currentPosition - 1;
      }
    } else {
      newPosition = this.calculateNewPositionAfterNavigation(false);
    }
    this.slidePrev.emit();

    this.slideTo(newPosition);
  }

  /**
   * Handle slide to next index.
   * From navigation or accessibility.
   */
  public slideToNext() {
    this.insertLoopSlides(false);

    const hasReachedEnd =
      this.currentPosition >=
      (this.loop ? this.totalSlides : this.totalSlidesVisible() - 1);
    let newPosition: number | undefined = undefined;
    if (hasReachedEnd) {
      console.log('maximum reached');
      // Maximum reached.
      if (this.rewind || this.loop) {
        newPosition = 0;
      } else {
        newPosition = this.currentPosition + 1;
      }
    } else {
      newPosition = this.calculateNewPositionAfterNavigation(true);
    }

    console.log('** Sliding to next index:', newPosition);
    this.slideNext.emit();

    this.slideTo(newPosition);
  }

  /**
   * When user swipe or drag, we need to slide to nearest index.
   */
  private swipeToNearest() {
    const isSwipe = new Date().getTime() - this.lastMoveTime < 100;

    const hasReachedEnd = this.isReachEnd();
    const hasReachedStart = this.isReachStart();

    const { position, exactPosition } =
      this.getNewPositionFromTranslate(isSwipe);

    console.log('** SWIPE TO NEAREST', { position, exactPosition, isSwipe });

    const virtualPosition =
      this.getVirtualPositionFromExactPosition(exactPosition);
    console.log('VIRTUAL POS FOR', position, virtualPosition);
    const currentVirtualPosition = this.getVirtualPositionFromExactPosition(
      this.currentPosition
    );

    let newPosition: number | undefined = undefined;
    if (hasReachedEnd) {
      console.log('maximum reached', newPosition);

      if (isSwipe || virtualPosition > currentVirtualPosition) {
        // Maximum reached.
        if (this.rewind) {
          newPosition = 0;
        } else {
          newPosition = Math.ceil(exactPosition);
        }
      }
    } else if (hasReachedStart) {
      console.log('minimum reached', { position, exactPosition });
      if (isSwipe || virtualPosition < currentVirtualPosition) {
        // Minimum reached.
        if (this.rewind) {
          newPosition = this.totalSlides - 1;
        } else {
          newPosition = Math.floor(exactPosition);
        }
      }
    } else if (isSwipe) {
      const isSlidingNext = virtualPosition > currentVirtualPosition;
      const isSlidingPrev = virtualPosition < currentVirtualPosition;
      if (isSlidingNext || isSlidingPrev) {
        newPosition = this.calculateNewPositionAfterNavigation(isSlidingNext);
      }
    } else {
      newPosition = position !== undefined ? position : this.currentPosition;
    }

    this.slideTo(newPosition);
  }

  private getCurrentTransform() {
    const slides = this.allSlides()?.nativeElement;
    return getComputedStyle(slides).transform;
  }

  /**
   * Trigger slide to specific index.
   * If index is not provided, it will slide to the current position.
   * @param index
   */
  public slideTo(index = this.currentPosition, animate = true) {
    index = positiveModulo(index, this.totalSlides);
    console.log('*** Sliding to index:', index, 'with animate:', animate);

    if (index !== undefined && index !== this.currentPosition) {
      this.currentPosition = index;
    }

    if (animate) {
      this.applyTransitionAnimation();
    }

    this.currentTranslate = this.getTranslateFromPosition(index);

    // Apply transform to slides.
    this.updateTransform(false);
  }

  private focusOnCurrentSlide() {
    const slides = this.slidesElements();
    if (slides && slides[this.currentPosition]) {
      slides[this.currentPosition].nativeElement.focus();
    }
  }

  /**
   * Apply animation to carousel.
   */
  private applyTransitionAnimation() {
    this.renderer.setStyle(
      this.allSlides()?.nativeElement,
      'transition-duration',
      `${this.TRANSITION_DURATION}ms`
    );
    setTimeout(() => {
      this.renderer.setStyle(
        this.allSlides()?.nativeElement,
        'transition-duration',
        `0s`
      );
    });
  }

  // Handle scroll on desktop
  hasMoved = false;
  hasExtraTranslation = false;
  lastMoveTime = 0;
  lastClickTime = 0;
  lastPageXPosition = 0;
  isDragging = false;
  startX = 0;
  currentTranslate = 0;
  lastTranslate = 0;
  velocity = 0;
  animationFrameId?: number;
  minTranslate = 0;
  maxTranslate = 0;
  sensitivity = 1;
  velocitySensitivity = 5;
  velocitySensitivityFreeMode = 1;
  velocityBounds = 0.5;

  @HostListener('transitionend', ['$event'])
  private onHostTransitionEnd(event: TransitionEvent) {
    const slidesEl = this.allSlides()?.nativeElement;
    if (event.propertyName === 'transform' && event.target === slidesEl) {
      console.log('*** trnasition end event:', event);
      // this.onLoopCheck();
      this.isAnimating = false;
    }
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    const xPosition =
      event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;

    this.isDragging = true;
    this.hasMoved = false;
    this.hasExtraTranslation = false;
    this.startX = xPosition;
    this.lastPageXPosition = this.startX;

    this.lastTranslate = this.currentTranslate;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastClickTime = new Date().getTime();
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    if (!this.mouseWheel) {
      return;
    }
    let isWheel = false;
    if (this.mouseWheel === true || this.mouseWheel.horizontal) {
      isWheel = e.deltaX !== 0;
    }
    if (this.mouseWheel !== true && this.mouseWheel.vertical) {
      isWheel = e.deltaY !== 0;
    }
    if (isWheel) {
      e.preventDefault();
      this.lastTranslate = this.currentTranslate;
      this.initTouched();
      const deltaX = -(e.deltaX || e.deltaY) * this.sensitivity;
      this.followUserMove(deltaX, true);
    }
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.allSlides()) return;

    this.initTouched();

    const xPosition =
      event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;

    this.hasMoved = true;

    if (new Date().getTime() - this.lastMoveTime > 50) {
      this.lastPageXPosition = xPosition;
    }
    this.lastMoveTime = new Date().getTime();

    const deltaX = (xPosition - this.startX) * this.sensitivity;

    this.followUserMove(deltaX, false, xPosition);
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    if (this.handleClickOnSlide(event)) {
      return;
    }

    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    const isSwipe = new Date().getTime() - this.lastMoveTime < 200;

    if (
      (this.freeMode && this.hasExtraTranslation) ||
      (!this.freeMode && this.hasMoved)
    ) {
      this.swipeToNearest();
    } else if (this.freeMode && isSwipe) {
      // We apply inertia only if move was fast enough.
      this.applyInertia();
    }

    this.updateSlides();
    this.hasMoved = false;
  }

  // Accessibility
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.slideToNext();
      this.focusOnCurrentSlide();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.slideToPrev();
      this.focusOnCurrentSlide();
      event.preventDefault();
    } else if (event.key === 'Home') {
      this.slideTo(0);
      this.focusOnCurrentSlide();

      event.preventDefault();
    } else if (event.key === 'End') {
      this.slideTo(this.totalSlides - 1);
      this.focusOnCurrentSlide();
      event.preventDefault();
    }
  }

  private isReachEnd(): boolean {
    return this.currentTranslate <= this.maxTranslate;
  }
  private isReachStart(): boolean {
    return this.currentTranslate >= this.minTranslate;
  }

  private followUserMove(
    deltaX: number,
    noExtraTranslation = false,
    xPosition?: number
  ) {
    let newTranslate = this.lastTranslate + deltaX;

    const isOutOfBounds =
      !this.loop &&
      (newTranslate < this.maxTranslate || newTranslate > this.minTranslate);

    if (isOutOfBounds) {
      if (!this.resistance || noExtraTranslation) {
        // If we are out of bounds, we don't want to apply extra translation.
        newTranslate = Math.max(
          this.maxTranslate,
          Math.min(newTranslate, this.minTranslate)
        );
      } else {
        this.hasExtraTranslation = true;
        newTranslate =
          this.lastTranslate +
          (deltaX / this.sensitivity) * this.velocityBounds;
      }
    } else {
      this.hasExtraTranslation = false;
    }

    this.updatePositionOnMouseMove(newTranslate, xPosition);
  }

  /**
   * Move slides.
   * From arrows or by mouse / touch.
   * @param posX
   * @returns
   *
   */
  updateTransform(updatePosition = true) {
    if (!this.allSlides()) {
      return;
    }

    const roundedCurrentTranslate = Math.round(this.currentTranslate);

    this.renderer.setStyle(
      this.allSlides()?.nativeElement,
      'transform',
      `translate3d(${roundedCurrentTranslate}px, 0px, 0px)`
    );

    this.handleReachEvents();

    if (!this.freeMode || !updatePosition) {
      this.updateSlides();
      return;
    }

    // Recalculate currentposition.
    const newPosition = this.getNewPositionFromTranslate().position;

    if (newPosition !== undefined) {
      this.currentPosition = positiveModulo(newPosition, this.totalSlides);
      this.detectChanges.detectChanges();
      this.updateSlides();
    }
  }

  private applyTranslate(translate: number) {
    this.renderer.setStyle(
      this.allSlides()?.nativeElement,
      'transition-duration',
      `0s`
    );
    this.currentTranslate = translate;
    this.updateTransform(false);
    this.forceReflow();
  }

  private jumpToPosition(position: number) {
    console.log('** Jumping to position:', position);
    // We can jump to any position.
    this.renderer.setStyle(
      this.allSlides()?.nativeElement,
      'transition-duration',
      `0s`
    );

    this.currentTranslate = this.getTranslateFromPosition(position);

    this.updateTransform(false);

    this.forceReflow();
  }

  private forceReflow() {
    const rect = this.allSlides()?.nativeElement?.getBoundingClientRect?.();
  }

  /**
   * Direct click on slide.
   * @param event
   * @returns
   */
  private handleClickOnSlide(event: MouseEvent | TouchEvent): boolean {
    const isClick =
      !this.hasMoved && new Date().getTime() - this.lastClickTime < 250;
    if (isClick && this.slideOnClick) {
      this.clickOnSlide(event);
      this.isDragging = false;
      this.hasMoved = false;
      return true;
    }
    return false;
  }

  /**
   * Update current translate and apply transform CSS.
   * @param newTranslate
   * @param xPosition
   */
  private updatePositionOnMouseMove(newTranslate: number, xPosition?: number) {
    this.currentTranslate = newTranslate;

    this.insertLoopSlides(newTranslate > this.lastTranslate);

    this.velocity = xPosition
      ? (xPosition - this.lastPageXPosition) *
        (this.freeMode
          ? this.velocitySensitivityFreeMode
          : this.velocitySensitivity)
      : 0;

    this.updateTransform();
  }

  private applyInertia() {
    if (!this.allSlides()) {
      return;
    }

    let friction = 0.93;

    const step = () => {
      if (Math.abs(this.velocity) < 0.5) {
        return;
      }

      this.currentTranslate += this.velocity;
      this.velocity *= friction;

      if (this.isReachEnd() || this.isReachStart()) {
        this.velocity *= 0.8;
      }

      this.currentTranslate = Math.max(
        this.maxTranslate,
        Math.min(this.currentTranslate, this.minTranslate)
      );

      this.updateTransform();
      this.animationFrameId = requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  private handleReachEvents() {
    this.hasReachedEnd = this.isReachEnd();
    this.hasReachedStart = this.isReachStart();
    if (this.hasReachedEnd) {
      this.reachEnd.emit();
    }
    if (this.hasReachedStart) {
      this.reachStart.emit();
    }
  }

  /**
   * Set CSS property to apply space between slides.
   */
  private applySpaceBetween() {
    if (this.allSlides()) {
      this.renderer.setStyle(
        this.allSlides()?.nativeElement,
        'gap',
        `${this.realSpaceBetween}px`
      );
    }
  }

  private getGridColumnsValue(slidesPerView: number, spaceBetween: number) {
    // const value = (100 - spaceBetween * (slidesPerView - 1)) / slidesPerView;
    // const roundedValue = Math.round(value);
    //return `calc(${roundedValue}%)`;
    return `round(nearest,calc((100% - ${
      spaceBetween * (slidesPerView - 1)
    }px) / ${slidesPerView}),1px)`;
  }

  /**
   * Set CSS property to apply slides per view.
   */
  private applySlidesPerView() {
    // Define grid columns.
    if (
      this.allSlides() &&
      this.realSlidesPerView !== 'auto' &&
      !this.breakpoints
    ) {
      console.log('slidespervie', this.realSlidesPerView);
      this.renderer.setStyle(
        this.allSlides()?.nativeElement,
        'grid-auto-columns',
        this.getGridColumnsValue(this.realSlidesPerView, this.realSpaceBetween)
      );
    }
  }

  /**
   * Initialize slides width and margins.
   */
  private calculateGridWidth() {
    if (Array.isArray(this.slidesElements()) && this.slidesElements().length) {
      this.totalSlides = this.slidesElements().length;

      if (this.center) {
        this.totalSlidesVisible.set(this.totalSlides);
      } else if (this.realSlidesPerView !== 'auto') {
        this.totalSlidesVisible.set(
          this.totalSlides - Math.floor(this.realSlidesPerView) + 1
        );
      }

      if (!this.isServerMode) {
        setTimeout(() => {
          this.fullWidth = this.allSlides()?.nativeElement.clientWidth;
          this.scrollWidth = this.allSlides()?.nativeElement.scrollWidth;

          this.calculateSlidesWidths();
          if (this.realSlidesPerView === 'auto' && !this.center) {
            this.calculateSlidesVisibleAuto();
          }
          this.calculateTranslations();
        });
      }
    }
  }

  private calculateTranslations() {
    this.maxTranslate = -(this.scrollWidth - this.fullWidth) - this.marginEnd;
    if (this.loop) {
      // this.maxTranslate +=
      //   this.clonedSlidesAfter.length *
      //   (this.slidesWidths[0] + this.realSpaceBetween);
    }
    this.minTranslate = this.marginStart;
    if (this.loop) {
      // this.minTranslate -=
      //   this.clonedSlidesBefore.length *
      //   (this.slidesWidths[0] + this.realSpaceBetween);
    }

    const realInitialSlide = this.realInitialSlide();
    if (this.center) {
      if (!this.notCenterBounds) {
        this.minTranslate = this.fullWidth / 2 - this.slidesWidths[0] / 2;
        this.maxTranslate -= this.fullWidth / 2 - this.slidesWidths[0] / 2;
      }
      this.currentTranslate = realInitialSlide
        ? this.getTranslateFromPosition(realInitialSlide)
        : this.minTranslate;
      this.updateTransform(false);
    } else {
      //if (realInitialSlide) {
      this.currentTranslate = this.getTranslateFromPosition(realInitialSlide);
      this.updateTransform(false);
      // } else if (this.marginStart) {
      //   this.currentTranslate = this.minTranslate;
      //   this.updateTransform(false);
      // }
    }

    console.log('-- mintranslate', this.minTranslate);
    console.log('-- maxtranslate', this.maxTranslate);
  }

  private calculateSlidesWidths() {
    this.slidesWidths = [];
    for (const slide of this.slidesElements()) {
      const slideWidth = slide.nativeElement.getBoundingClientRect().width;
      this.slidesWidths.push(slideWidth);
    }

    console.log('--- slidesWidths calcultaed:', this.slidesWidths);
  }

  private calculateSlidesVisibleAuto() {
    let index = this.totalSlides - 1;
    let total = 0;
    let count = 0;
    while (index >= 0 && total + this.marginEnd < this.fullWidth) {
      total += this.slidesWidths[index];
      count++;
      index--;
    }
    this.totalSlidesVisible.set(this.totalSlides - count + 2);
  }

  /**
   * We detect if we have projected slides.
   * If we have projected slides, we will use them instead of the slides input.
   */
  private initProjectedSlides() {
    this.isProjected =
      this.slides.length === 0 &&
      this.projectedSlides !== undefined &&
      (this.projectedSlides as any).length === 0;
    if (this.isProjected) {
      const slidesProjected =
        this.allSlides()?.nativeElement.querySelectorAll('* > div');
      if (slidesProjected.length) {
        slidesProjected.forEach((slide: HTMLElement) => {
          this.renderer.addClass(slide, 'slide');
        });
      }
    }
  }

  /**
   * Get posX from slide index position.
   * @param index
   * @returns
   */
  private getTranslateFromPosition(index = this.currentPosition): number {
    console.log('calculating translate with ', this.slidesWidths);

    const realIndexFromPosition = this.slidesIndexOrder.findIndex(
      (element) => element === index
    );

    if (this.center && this.notCenterBounds) {
      if (
        realIndexFromPosition < (this.realSlidesPerView as number) / 2 ||
        realIndexFromPosition >
          this.totalSlides - (this.realSlidesPerView as number) / 2
      ) {
        return realIndexFromPosition < (this.realSlidesPerView as number) / 2
          ? this.minTranslate
          : this.maxTranslate;
      }

      const centerValue =
        this.fullWidth / 2 - this.slidesWidths[realIndexFromPosition] / 2;

      const posX = this.calculateTranslateValueFromIndex(index) + centerValue;
      return this.clampTranslateValue(posX);
    }

    // Calculate position from slides widths and space between.
    const posX = this.calculateTranslateValueFromIndex(index);

    if (this.loop) {
      // Authorize any translation without restriction.
      return posX;
    }

    // If not loop, we restrict translation to min and max.
    return this.clampTranslateValue(posX);
  }

  private clampTranslateValue(posX: number) {
    return Math.max(this.maxTranslate, Math.min(posX, this.minTranslate));
  }

  private calculateTranslateValueFromIndex(index: number) {
    let posX =
      index === 0 ? this.minTranslate : this.minTranslate - this.marginStart;
    const realIndexFromPosition = this.slidesIndexOrder.findIndex(
      (element) => element === index
    );
    for (let i = 0; i < realIndexFromPosition; i++) {
      posX -= this.slidesWidths[i] + this.realSpaceBetween;
    }
    if (index === this.totalSlides - 1) {
      posX -= this.marginEnd;
    }
    return posX;
  }

  private getNewPositionFromTranslate(velocity = false) {
    this.currentTranslate = Math.max(
      this.maxTranslate,
      Math.min(
        this.currentTranslate + (velocity ? this.velocity : 0),
        this.minTranslate
      )
    );

    let position =
      Math.abs(this.currentTranslate - this.minTranslate) /
      (this.slidesWidths[0] + this.realSpaceBetween);

    position = this.getRealPositionFromExactPosition(position);

    const isNewPosition =
      Math.abs(this.currentPosition - position) > this.deltaPosition;

    return {
      exactPosition: position,
      position: isNewPosition ? Math.round(position) : undefined,
    };
  }

  private getRealPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const realPosition = this.slidesIndexOrder[roundPosition];
    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = realPosition + decimalPart;
    return position;
  }

  private getVirtualPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const virtualPosition = this.slidesIndexOrder.indexOf(roundPosition);
    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = virtualPosition + decimalPart;
    return position;
  }

  /**
   * Calculate new index after prev or next action.
   * @param isSlidingNext
   * @returns
   */
  private calculateNewPositionAfterNavigation(isSlidingNext = true) {
    const maxSlides = this.totalSlidesVisible();

    const newIndex = isSlidingNext
      ? this.currentPosition + 1
      : this.currentPosition - 1;

    if (this.loop) {
      return positiveModulo(newIndex, this.totalSlides);
    }

    return Math.max(
      0,
      Math.min(newIndex, isSlidingNext ? maxSlides - 1 : maxSlides - 2)
    );
  }

  /**
   * Slide to clicked slide.
   * @param event
   */
  private clickOnSlide(event: Event) {
    const slideElement = (event.target as HTMLElement).closest(
      '[class*="position-"]'
    );
    if (slideElement) {
      const classes = slideElement.className.split(' ');
      const posClass = classes.find((cls) => cls.indexOf('position-') === 0);
      if (posClass) {
        const indexStr = posClass.replace('position-', '');
        const index = parseInt(indexStr, 10);
        if (!isNaN(index)) {
          this.slideTo(Math.min(index - 1, this.totalSlidesVisible() - 1));
        }
      }
    }
  }

  /**
   * Add accessibility attributes to slides.
   * @param slide
   * @param index
   */
  private setAccessibility(slide: HTMLElement, index: number) {
    this.renderer.setAttribute(
      slide,
      'aria-label',
      `${index + 1}/${this.totalSlides}`
    );
    this.renderer.setAttribute(slide, 'role', 'group');
    if (index === this.currentPosition) {
      this.renderer.setAttribute(slide, 'tabindex', '0');
    } else {
      this.renderer.setAttribute(slide, 'tabindex', '-1');
    }
  }

  private setLazyLoading(slide: HTMLElement, index: number) {
    if (this.lazyLoading) {
      const images = slide.querySelectorAll('img');
      Array.from(images).forEach((image) => {
        this.renderer.setProperty(image, 'loading', 'lazy');
      });
    }
  }

  private resetPositions(slide: HTMLElement, index: number) {
    this.renderer.removeClass(slide, 'prev');
    this.renderer.removeClass(slide, 'curr');
    this.renderer.removeClass(slide, 'next');
    this.renderer.addClass(slide, 'position-' + (index + 1));
  }

  private setSlidesPositions() {
    const curr = this.allSlides()?.nativeElement.querySelector(
      '.slide.position-' + (this.currentPosition + 1)
    );
    const prev = this.allSlides()?.nativeElement.querySelector(
      '.slide.position-' +
        (this.currentPosition <= 0
          ? this.loop
            ? this.totalSlides
            : null
          : this.currentPosition)
    );
    const next = this.allSlides()?.nativeElement.querySelector(
      '.slide.position-' +
        (this.currentPosition + 2 <= this.totalSlides
          ? this.currentPosition + 2
          : this.loop
          ? 1
          : null)
    );
    if (curr) {
      this.renderer.addClass(curr, 'curr');
    }
    if (next) {
      this.renderer.addClass(next, 'next');
    }
    if (prev) {
      this.renderer.addClass(prev, 'prev');
    }
  }

  /**
   * Add media queries to stylesheet to work with SSR.
   * @returns
   */
  private applyBreakpoints() {
    if (this.breakpoints === undefined || this.realSlidesPerView === 'auto') {
      return;
    }

    let css = '<style>';
    const uniqueId = this.uniqueCarouselId;
    Object.keys(this.breakpoints).forEach((query) => {
      const config = this.breakpoints![query];
      const calculatedGridColumns = this.getGridColumnsValue(
        config.slidesPerView ?? (this.slidesPerView as number),
        config.spaceBetween ?? this.spaceBetween
      );
      css += `
          @media ${query} {
            .slides.${uniqueId} {
              grid-auto-columns: ${calculatedGridColumns} !important;
              gap: ${config.spaceBetween ?? this.spaceBetween}px !important;
            }
          }
        `;
    });
    css += '</style>';
    this.generatedStyles = this.sanitizer.bypassSecurityTrustHtml(css);
    this.detectChanges.detectChanges();

    if (this.isServerMode) {
      return;
    }
    // Remove previous listeners if any
    this.mediaQueryListeners.forEach(({ mql, listener }) => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
      }
    });
    this.mediaQueryListeners = [];

    // register listeners for each media query so we update TS state on change
    Object.keys(this.breakpoints).forEach((query) => {
      const mql = window.matchMedia(query);
      const config = this.breakpoints![query];

      const listener = (e: MediaQueryListEvent) => {
        this.ngZone.run(() => {
          if (e.matches) {
            console.log('** Breakpoint matched:', query, config);
            this.updateCarouselState(config);
          }
        });
      };

      mql.addEventListener('change', listener);
      this.mediaQueryListeners.push({ mql, listener });
    });
  }
}
