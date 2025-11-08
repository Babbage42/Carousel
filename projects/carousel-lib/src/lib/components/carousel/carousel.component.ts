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
  afterNextRender,
  runInInjectionContext,
  EnvironmentInjector,
} from '@angular/core';
import { debounceTime, fromEvent } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SlideDirective } from '../../directives/slide.directive';
import {
  Pagination,
  PaginationComponent,
} from '../pagination/pagination.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationComponent } from '../navigation/navigation.component';
import { CarouselNavLeftDirective } from '../../directives/navigation/navigation-left.directive';
import { CarouselNavRightDirective } from '../../directives/navigation/navigation-right.directive';
import { CarouselRegistryService } from './carousel-registry.service';
import {
  Carousel,
  CarouselResponsiveConfig,
  Slide,
  SnapDom,
} from '../../models/carousel.model';
import {
  generateRandomClassName,
  positiveModulo,
} from '../../helpers/utils.helper';
import { CarouselStore } from '../../carousel.store';
import { CarouselLoopService } from '../../services/carousel-loop.service';
import { CarouselTransformService } from '../../services/carousel-transform.service';
import { CAROUSEL_VIEW } from './view-adapter';

@Component({
    selector: 'app-carousel',
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
        CarouselStore,
        CarouselTransformService,
        CarouselLoopService,
        { provide: CarouselRegistryService, useClass: CarouselRegistryService },
        {
            provide: CAROUSEL_VIEW,
            useExisting: forwardRef(() => CarouselComponent),
        },
    ]
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject(CarouselStore);
  private readonly loopService = inject(CarouselLoopService);
  private readonly transformService = inject(CarouselTransformService);
  private readonly env = inject(EnvironmentInjector);

  readonly currentPosition = this.store.currentPosition;
  readonly firstSlideAnchor = this.store.firstSlideAnchor;
  readonly lastSlideAnchor = this.store.lastSlideAnchor;

  readonly currentRealPosition = this.store.currentRealPosition;
  readonly totalSlides = this.store.totalSlides;
  readonly totalSlidesVisible = this.store.totalSlidesVisible;
  readonly hasReachedStart = this.store.hasReachedStart;
  readonly hasReachedEnd = this.store.hasReachedEnd;

  private readonly TRANSITION_DURATION = 400; // ms

  @ContentChildren(SlideDirective) projectedSlides!: QueryList<SlideDirective>;
  @ContentChild(CarouselNavLeftDirective)
  customLeftArrow?: CarouselNavLeftDirective;
  @ContentChild(CarouselNavRightDirective)
  customRightArrow?: CarouselNavRightDirective;

  slides = input<Slide[]>([]);

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
  //  add lazyPreloadPrevNext	number	0
  // Number of next and previous slides to preload. Only applicable if using lazy loading.

  @Output() slideUpdate = new EventEmitter();
  @Output() slideNext = new EventEmitter();
  @Output() slidePrev = new EventEmitter();
  @Output() touched = new EventEmitter();
  @Output() reachEnd = new EventEmitter();
  @Output() reachStart = new EventEmitter();

  firstTouch = false;
  uniqueCarouselId = '';
  generatedStyles: SafeHtml = '';
  allSlides = viewChild<ElementRef>('allSlides');
  slidesElements = viewChildren<ElementRef<HTMLElement>>('slide');

  // Can be used by user to move pagination element.
  @ViewChild('paginationTemplate', { static: true })
  public paginationTemplate!: TemplateRef<any>;

  private navigation = viewChild(NavigationComponent);

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
        const allSlides = this.allSlides();
        this.store.patch({ allSlides });
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const navigation = this.navigation();
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
        runInInjectionContext(this.env, () => {
          afterNextRender(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                console.log('slides', this.slidesElements());
                this.store.patch({
                  slidesElements: [...this.slidesElements()],
                  slidesIndexOrder: slides.map((_, index) => index),
                });

                this.transformService.calculateInitialTranslations();
              });
            });
          });
        });
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const currentPosition = this.store.currentPosition();
      console.log('CURRENT POSITION UPDATED', currentPosition);
      this.initTouched();
      console.log('*** Position changed (slideUpdate) ***', currentPosition);
      this.slideUpdate.emit(currentPosition);
    });

    effect(() => {
      const currentTranslate = this.store.currentTranslate();
      console.log('EFFECT translate detected', currentTranslate);
    });
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

    // Init state with input values.
    this.store.patch({
      marginStart: this.marginStart,
      marginEnd: this.marginEnd,
      resistance: this.resistance,
      showControls: this.showControls,
      alwaysShowControls: this.alwaysShowControls,
      iconSize: this.iconSize,
      slides: this.slides(),
      initialSlide: this.initialSlide(),
      freeMode: this.freeMode,
      mouseWheel: this.mouseWheel,
      deltaPosition: this.deltaPosition,
      showProgress: this.showProgress,
      dotsControl: this.dotsControl,
      slidesPerView: this.slidesPerView,
      spaceBetween: this.spaceBetween,
      currentPosition: this.initialSlide(),
      currentRealPosition: this.initialSlide(),
      loop: this.loop,
      rewind: this.rewind,
      center: this.center,
      notCenterBounds: this.notCenterBounds,
      uniqueCarouselId: this.uniqueCarouselId,
      slideOnClick: this.slideOnClick,
    });

    this.applyBreakpoints();
  }

  ngAfterViewInit(): void {
    this.applyUniqueId();
    this.initProjectedSlides();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.mediaQueryListeners.forEach(({ mql, listener }) => {
      mql.removeEventListener('change', listener);
    });
  }

  private updateCarouselState(partial: Partial<Carousel>) {
    this.store.patch(partial);
  }

  private get realSlidesPerView() {
    return this.store.state().slidesPerView;
  }
  private get realSpaceBetween() {
    return this.store.state().spaceBetween;
  }

  public get isServerMode() {
    return !isPlatformBrowser(this.platformId);
  }

  private applyUniqueId() {
    this.renderer.addClass(
      this.allSlides()?.nativeElement,
      this.uniqueCarouselId
    );
  }

  private refresh() {
    this.applySpaceBetween();
    this.applySlidesPerView();

    // We must wait browser calculation for grid display.
    this.calculateGridWidth();

    this.updateSlides();
  }

  private initTouched() {
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

    if (this.slidesElements()) {
      this.slidesElements()?.forEach(
        (slide: ElementRef<HTMLElement>, index: number) => {
          this.resetPositions(slide.nativeElement, index);
          this.setAccessibility(slide.nativeElement, index);
          this.setLazyLoading(slide.nativeElement, index);
        }
      );

      this.setSlidesPositions();
    }
  }

  /**
   * Handle slide to prev index.
   * From navigation or accessibility.
   */
  public slideToPrev() {
    this.loopService.insertLoopSlides(true);

    const hasReachedStart = this.store.hasReachedStart();
    let newPosition: number | undefined = undefined;
    if (hasReachedStart && this.rewind) {
      newPosition = this.store.totalSlides() - 1;
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
    this.loopService.insertLoopSlides(true);

    const hasReachedEnd = this.store.hasReachedEnd();
    let newPosition: number | undefined = undefined;
    if (hasReachedEnd && this.rewind) {
      newPosition = 0;
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
      this.transformService.getNewPositionFromTranslate(isSwipe);

    console.log('** SWIPE TO NEAREST', { position, exactPosition, isSwipe });

    const virtualPosition =
      this.getVirtualPositionFromExactPosition(exactPosition);
    const currentVirtualPosition = this.getVirtualPositionFromExactPosition(
      this.store.currentPosition()
    );

    let newPosition: number | undefined =
      position !== undefined ? position : this.store.currentPosition();

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
          newPosition = this.store.totalSlides() - 1;
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
    }

    this.slideTo(newPosition);
  }

  /**
   * Move slides.
   * From arrows or by mouse / touch.
   * @param posX
   * @returns
   *
   */
  public updateTransform(
    translateToApply = this.store.currentTranslate(),
    updatePosition = true
  ) {
    this.store.patch({
      currentTranslate: translateToApply,
    });

    if (!this.store.allSlides()) {
      return;
    }

    const roundedCurrentTranslate = this.store.currentTranslate(); //Math.round

    console.log('UPDATING SLIDES after currenttransalte');

    this.renderer.setStyle(
      this.store.allSlides()?.nativeElement,
      'transform',
      `translate3d(${roundedCurrentTranslate}px, 0px, 0px)`
    );

    this.handleReachEvents();

    if (!this.store.state().freeMode || !updatePosition) {
      this.updateSlides();
      return;
    }

    // Recalculate currentposition.
    const newPosition =
      this.transformService.getNewPositionFromTranslate().position;

    if (newPosition !== undefined) {
      const position = positiveModulo(newPosition, this.store.totalSlides());
      this.store.setCurrentPosition(this.clampToVisibleSlide(position));
      this.store.patch({ currentRealPosition: position });
      this.updateSlides();
    }
  }

  /**
   * Trigger slide to specific index.
   * If index is not provided, it will slide to the current position.
   * @param index
   */
  public slideTo(index = this.store.currentRealPosition(), animate = true) {
    // We update the real position.
    this.store.patch({ currentRealPosition: index });

    index = this.clampToVisibleSlide(index);

    console.log('*** Sliding to index:', index, 'with animate:', animate);

    if (index !== undefined && index !== this.store.currentPosition()) {
      this.store.setCurrentPosition(index);
    }

    if (animate) {
      this.applyTransitionAnimation();
    }

    const translateToApply =
      this.transformService.getTranslateFromPosition(index);

    // Apply transform to slides.
    this.updateTransform(translateToApply, false);
  }

  private focusOnCurrentSlide() {
    const slides = this.slidesElements();
    if (slides && slides[this.store.currentPosition()]) {
      slides[this.store.currentPosition()].nativeElement.focus();
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
      this.removeTransitionAnimation();
    });
  }

  private removeTransitionAnimation() {
    this.renderer.setStyle(
      this.allSlides()?.nativeElement,
      'transition-duration',
      `0s`
    );
  }

  // Handle scroll on desktop
  hasMoved = false;
  hasExtraTranslation = false;
  lastMoveTime = 0;
  lastClickTime = 0;
  lastPageXPosition = 0;
  isDragging = false;
  startX = 0;
  animationFrameId?: number;
  sensitivity = 1;
  velocitySensitivity = 5;
  velocitySensitivityFreeMode = 1;
  velocityBounds = 0.5;

  @HostListener('transitionend', ['$event'])
  private onHostTransitionEnd(event: TransitionEvent) {
    const slidesEl = this.allSlides()?.nativeElement;
    if (event.propertyName === 'transform' && event.target === slidesEl) {
      console.log('*** trnasition end event:', event);
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

    this.store.patch({ lastTranslate: this.store.currentTranslate() });

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
      this.store.patch({ lastTranslate: this.store.currentTranslate() });
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
      this.slideTo(this.store.totalSlides() - 1);
      this.focusOnCurrentSlide();
      event.preventDefault();
    }
  }

  private isReachEnd(): boolean {
    return this.currentPosition() >= this.lastSlideAnchor();
    return this.store.currentTranslate() <= this.store.state().maxTranslate;
  }
  private isReachStart(): boolean {
    return this.store.currentTranslate() >= this.store.state().minTranslate;
  }

  private followUserMove(
    deltaX: number,
    noExtraTranslation = false,
    xPosition?: number
  ) {
    let newTranslate = this.store.lastTranslate() + deltaX;

    const isOutOfBounds =
      !this.store.state().loop &&
      (newTranslate < this.store.state().maxTranslate ||
        newTranslate > this.store.state().minTranslate);

    if (isOutOfBounds) {
      if (!this.resistance || noExtraTranslation) {
        // If we are out of bounds, we don't want to apply extra translation.
        newTranslate = Math.max(
          this.store.state().maxTranslate,
          Math.min(newTranslate, this.store.state().minTranslate)
        );
      } else {
        this.hasExtraTranslation = true;
        newTranslate =
          this.store.lastTranslate() +
          (deltaX / this.sensitivity) * this.velocityBounds;
      }
    } else {
      this.hasExtraTranslation = false;
    }

    this.updatePositionOnMouseMove(newTranslate, xPosition);
  }

  // private jumpToPosition(position: number) {
  //   console.log('** Jumping to position:', position);
  //   // We can jump to any position.
  //   this.currentTranslate = this.getTranslateFromPosition(position);

  //   this.updateTransform(false);

  //   this.forceReflow();
  // }

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
    this.store.patch({ currentTranslate: newTranslate });

    this.loopService.insertLoopSlides();

    this.store.patch({
      velocity: xPosition
        ? (xPosition - this.lastPageXPosition) *
          (this.freeMode
            ? this.velocitySensitivityFreeMode
            : this.velocitySensitivity)
        : 0,
    });

    this.updateTransform();
  }

  private applyInertia() {
    if (!this.allSlides()) {
      return;
    }

    let friction = 0.93;

    const step = () => {
      if (Math.abs(this.store.state().velocity) < 0.5) {
        return;
      }

      this.store.patch({
        currentTranslate:
          this.store.currentTranslate() + this.store.state().velocity,
      });
      this.store.patch({ velocity: this.store.state().velocity * friction });

      if (this.isReachEnd() || this.isReachStart()) {
        this.store.patch({ velocity: this.store.state().velocity * 0.8 });
      }

      const translateToApply = Math.max(
        this.store.state().maxTranslate,
        Math.min(this.store.currentTranslate(), this.store.state().minTranslate)
      );

      this.updateTransform(translateToApply);
      this.animationFrameId = requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  private handleReachEvents() {
    console.log('handle reach ::::', this.store.currentTranslate());
    const hasReachedEnd = this.isReachEnd();
    const hasReachedStart = this.isReachStart();

    this.store.patch({
      hasReachedEnd,
      hasReachedStart,
    });

    if (hasReachedEnd) {
      this.reachEnd.emit();
    }
    if (hasReachedStart) {
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
      //@todo fix for ssr ?
      if (!this.isServerMode) {
        // this.transformService.calculateTranslations();
      }
    }
  }

  /**
   * We detect if we have projected slides.
   * If we have projected slides, we will use them instead of the slides input.
   * @TODO why selector > div ???
   */
  private initProjectedSlides() {
    const isProjected =
      this.slides().length === 0 &&
      this.projectedSlides !== undefined &&
      (this.projectedSlides as any).length === 0;

    this.updateCarouselState({
      isProjected,
    });

    if (isProjected) {
      const slidesProjected =
        this.allSlides()?.nativeElement.querySelectorAll('* > div');
      if (slidesProjected.length) {
        slidesProjected.forEach((slide: HTMLElement) => {
          this.renderer.addClass(slide, 'slide');
        });
      }
    }
  }

  private getVirtualPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const virtualPosition = this.store
      .slidesIndexOrder()
      .indexOf(roundPosition);
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
    const maxSlides = this.store.lastSlideAnchor() + 1;

    const newIndex = isSlidingNext
      ? this.store.currentPosition() + 1
      : this.store.currentPosition() - 1;

    if (this.store.state().loop) {
      return positiveModulo(newIndex, this.store.totalSlides());
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
        const position = parseInt(indexStr, 10);
        if (!isNaN(position)) {
          const index = position - 1;
          this.loopService.insertLoopSlides(true, index);

          this.slideTo(index);
        }
      }
    }
  }

  private clampToVisibleSlide(index: number) {
    if (this.store.state().loop) {
      return index;
    }

    // if (index < this.store.firstSlideAnchor()) {
    //   if (
    //     index > 0 &&
    //     this.store.state().notCenterBounds &&
    //     this.currentPosition() < this.store.firstSlideAnchor()
    //   ) {
    //     return this.store.firstSlideAnchor();
    //   }
    //   return 0;
    // }
    return Math.max(
      this.store.firstSlideAnchor(),
      Math.min(index, this.store.lastSlideAnchor())
    );
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
      `${index + 1}/${this.store.totalSlides()}`
    );
    this.renderer.setAttribute(slide, 'role', 'group');
    if (index === this.store.currentPosition()) {
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
      '.slide.position-' + (this.store.currentPosition() + 1)
    );
    const prev = this.allSlides()?.nativeElement.querySelector(
      '.slide.position-' +
        (this.store.currentPosition() <= 0
          ? this.store.state().loop
            ? this.store.totalSlides()
            : null
          : this.store.currentPosition())
    );
    const next = this.allSlides()?.nativeElement.querySelector(
      '.slide.position-' +
        (this.store.currentPosition() + 2 <= this.store.totalSlides()
          ? this.store.currentPosition() + 2
          : this.store.state().loop
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
