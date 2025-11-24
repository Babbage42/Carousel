import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  signal,
  TemplateRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
  ContentChild,
  viewChild,
  forwardRef,
  viewChildren,
  inject,
  input,
  computed,
  untracked,
  afterRenderEffect,
  output,
  DOCUMENT,
  contentChildren,
  HostBinding,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SlideDirective } from '../../directives/slide.directive';
import { ImagesReadyDirective } from '../../directives/images-ready.directive';

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
  AutoplayOptions,
  Carousel,
  CarouselResponsiveConfig,
  PeekEdges,
  Slide,
  TRANSITION_DURATION,
} from '../../models/carousel.model';
import {
  generateRandomClassName,
  positiveModulo,
} from '../../helpers/utils.helper';
import { CarouselStore } from '../../carousel.store';
import { CarouselLoopService } from '../../services/carousel-loop.service';
import { CarouselTransformService } from '../../services/carousel-transform.service';
import { CAROUSEL_VIEW } from './view-adapter';
import { CarouselNavigationService } from '../../services/carousel-navigation.service';
import { CarouselPhysicsService } from '../../services/carousel-physics.service';
import { CarouselDomService } from '../../services/carousel-dom.service';
import { CarouselBreakpointService } from '../../services/carousel-breakpoints.service';

@Component({
  selector: 'app-carousel',
  imports: [
    CommonModule,
    PaginationComponent,
    SlideDirective,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
    NavigationComponent,
    ImagesReadyDirective,
  ],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // TODO what was the need ?
  //encapsulation: ViewEncapsulation.None,
  providers: [
    CarouselStore,
    CarouselTransformService,
    CarouselPhysicsService,
    CarouselLoopService,
    CarouselNavigationService,
    CarouselDomService,
    CarouselBreakpointService,
    { provide: CarouselRegistryService, useClass: CarouselRegistryService },
    {
      provide: CAROUSEL_VIEW,
      useExisting: forwardRef(() => CarouselComponent),
    },
  ],
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly store = inject(CarouselStore);
  private readonly loopService = inject(CarouselLoopService);
  private readonly transformService = inject(CarouselTransformService);
  private readonly navigationService = inject(CarouselNavigationService);
  private readonly physicsService = inject(CarouselPhysicsService);
  private readonly domService = inject(CarouselDomService);
  private readonly breakpointService = inject(CarouselBreakpointService);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document?.defaultView;

  readonly currentPosition = this.store.currentPosition;
  readonly firstSlideAnchor = this.store.firstSlideAnchor;
  readonly lastSlideAnchor = this.store.lastSlideAnchor;
  readonly currentRealPosition = this.store.currentRealPosition;
  readonly totalSlides = this.store.totalSlides;
  readonly totalSlidesVisible = this.store.totalSlidesVisible;
  readonly hasReachedStart = this.store.hasReachedStart;
  readonly hasReachedEnd = this.store.hasReachedEnd;
  readonly peekEdgesOffset = this.store.peekOffset;

  projectedSlides = contentChildren(SlideDirective);
  @ContentChild(CarouselNavLeftDirective)
  customLeftArrow?: CarouselNavLeftDirective;
  @ContentChild(CarouselNavRightDirective)
  customRightArrow?: CarouselNavRightDirective;

  @HostBinding('style.--spv')
  get cssSpv() {
    const spv = this.store.slidesPerView();
    return typeof spv === 'number' ? spv : 1;
  }
  @HostBinding('style.--gap')
  get cssGap() {
    return `${this.store.spaceBetween()}px`;
  }
  @HostBinding('style.--index')
  get cssIndex() {
    return this.currentPosition();
  }

  debug = input(true);

  slides = input<Slide[]>([]);
  slidesPerView = input(4.5, {
    transform: (v: number | string): number | 'auto' => {
      if (v === 'auto') {
        return 'auto';
      }
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? (n as number) : 1;
    },
  });
  spaceBetween = input(5);
  stepSlides = input(1);
  showControls = input(true);
  alwaysShowControls = input(false);
  iconSize = input(50);
  pagination = input<Pagination | undefined>({
    type: 'dynamic_dot',
    clickable: true,
    external: false,
  });
  freeMode = input(false);
  mouseWheel = input<
    | boolean
    | {
        horizontal?: boolean;
        vertical?: boolean;
      }
  >(false);
  deltaPosition = input(0.6);
  showProgress = input(true);
  dotsControl = input(true);
  rewind = input(false);
  center = input(false);
  notCenterBounds = input(false);
  resistance = input(true);
  slideOnClick = input(true);
  marginEnd = input(0);
  marginStart = input(0);
  lazyLoading = input(true);
  breakpoints = input<CarouselResponsiveConfig>();
  autoplay = input(false, {
    transform: (value: boolean | AutoplayOptions) => {
      if (!value) {
        return false;
      }

      const base: AutoplayOptions = {
        delay: 2500,
        pauseOnHover: true,
        pauseOnFocus: true,
        stopOnInteraction: true,
        disableOnHidden: true,
        resumeOnMouseLeave: true,
      };

      const opts = value === true ? base : { ...base, ...value };

      return opts;
    },
  });
  loop = input<boolean>(false);
  forceSlideTo = input(undefined, {
    transform: (
      value:
        | undefined
        | number
        | {
            position: number;
            animated: boolean;
          }
    ) => {
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'number') {
        return {
          position: value,
          animated: true,
        };
      }
      return value;
    },
  });
  draggable = input(true);
  /**
   * Peek mode with non-center :
   * slide percent to be visible at edges.
   * absolute : in px
   * relative : decimal 0.15 = 15% of slide width.
   */
  peekEdges = input<PeekEdges>(undefined);
  /**
   * CSS selector for elements inside slides that should NOT start a drag.
   * Typical default: interactive elements like buttons, links, inputs…
   */
  dragIgnoreSelector = input<string>(
    '[data-carousel-no-drag], a, button, input, textarea, select, [role="button"]'
  );

  initialSlide = input<number>(0);
  realInitialSlide = computed(() => {
    const initial = this.initialSlide();
    const firstSlideAnchor = this.firstSlideAnchor();
    return Math.max(firstSlideAnchor, initial);
  });

  public fixSubPixelIssue = computed(
    () =>
      this.store.spaceBetween() === 0 &&
      typeof this.store.slidesPerView() === 'number' &&
      Number.isInteger(this.store.slidesPerView()) &&
      this.store.fullWidth() % (this.store.slidesPerView() as number) !== 0
  );

  /**
   * We force center by CSS at init (when all values are not ready).
   */
  public readonly applyCenterAtInit = computed(() => {
    const spv = this.store.slidesPerView();
    if (this.isServerMode || !this.layoutReady()) {
      if (
        this.store.center() &&
        !this.store.loop() &&
        typeof spv === 'number'
      ) {
        return true;
      }
    }
    return false;
  });

  // This translate will be ignored when layout is not ready on center mode.
  // It will be override temporaly in CSS.
  public readonly slidesTransform = computed(
    () => `translate3d(${this.store.currentTranslate()}px, 0, 0)`
  );

  private readonly _transitionDuration = signal(0);
  readonly transitionDuration = this._transitionDuration.asReadonly();

  public readonly slidesGap = computed(() => `${this.store.spaceBetween()}px`);

  public readonly slidesGridColumns = computed(() => {
    const slidesPerView = this.store.slidesPerView();
    if (slidesPerView === 'auto') {
      return 'max-content';
    }
    const spaceBetween = this.store.spaceBetween();
    return `calc((100% - ${
      spaceBetween * (slidesPerView - 1)
    }px) / ${slidesPerView})`;
  });

  private inputsSnapshot = computed<Partial<Carousel>>(() => {
    const inputs: Partial<Carousel> = {
      marginStart: this.marginStart(),
      marginEnd: this.marginEnd(),
      resistance: this.resistance(),
      showControls: this.showControls(),
      alwaysShowControls: this.alwaysShowControls(),
      iconSize: this.iconSize(),
      slides: this.slides(),
      initialSlide: this.initialSlide(),
      freeMode: this.freeMode(),
      mouseWheel: this.mouseWheel(),
      deltaPosition: this.deltaPosition(),
      showProgress: this.showProgress(),
      dotsControl: this.dotsControl(),
      slidesPerView: this.slidesPerView(),
      spaceBetween: this.spaceBetween(),
      loop: this.loop(),
      rewind: this.rewind(),
      center: this.center(),
      notCenterBounds: this.notCenterBounds(),
      slideOnClick: this.slideOnClick(),
      stepSlides: this.stepSlides(),
      autoplay: this.autoplay(),
      lazyLoading: this.lazyLoading(),
      draggable: this.draggable(),
      peekEdges: this.peekEdges(),
      dragIgnoreSelector: this.dragIgnoreSelector(),
    };
    return inputs;
  });

  @Output() slideUpdate = new EventEmitter();
  @Output() slideNext = new EventEmitter();
  @Output() slidePrev = new EventEmitter();
  @Output() touched = new EventEmitter();
  @Output() reachEnd = new EventEmitter();
  @Output() reachStart = new EventEmitter();
  imagesLoaded = output<void>();

  firstTouch = false;
  uniqueCarouselId = '';
  generatedStyles: SafeHtml = '';
  allSlides = viewChild<ElementRef>('allSlides');
  slidesElements = viewChildren<ElementRef<HTMLElement>>('slide');
  autoplayTimer?: ReturnType<typeof setInterval>;
  resizeTimeout?: ReturnType<typeof setTimeout>;

  // Can be used by user to move pagination element.
  @ViewChild('paginationTemplate', { static: true })
  public paginationTemplate!: TemplateRef<any>;

  private navigation = viewChild(NavigationComponent);

  private areImagesReady = signal(false);
  public layoutReady = signal(false); //this.isServerMode);

  private observer?: ResizeObserver;
  private gestureStart: {
    x: number;
    y: number;
    time: number;
    event?: MouseEvent | TouchEvent;
  } = { x: 0, y: 0, time: 0 };

  constructor(
    private renderer: Renderer2,
    private detectChanges: ChangeDetectorRef,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    public carouselRegistry: CarouselRegistryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (this.debug()) {
      this.enableDebugMode();
    }
    /**
     * Set initial current position to apply.
     */
    effect(() => {
      const realInitialSlide = this.realInitialSlide();
      untracked(() => {
        this.store.patch({
          currentPosition: realInitialSlide,
        });
      });
    });

    effect(() => {
      const allSlides = this.allSlides();
      untracked(() => this.store.patch({ allSlides }));
    });

    effect(() => {
      const navigation = this.navigation();
      this.carouselRegistry.carouselNavigationLeftSignal.set(
        navigation?.leftControl()
      );
      this.carouselRegistry.carouselNavigationRightSignal.set(
        navigation?.rightControl()
      );
    });

    afterRenderEffect(() => {
      const slides = this.slidesElements();

      if (this.areImagesReady()) {
        untracked(() => {
          this.store.patch({
            slidesElements: [...this.slidesElements()],
            slidesIndexOrder: slides.map((_, index) => index),
          });
          this.transformService.calculateInitialTranslations();
          this.loopService.initializeLoopCenter();
          this.layoutReady.set(true);
        });
      }
    });

    effect(() => {
      const currentPosition = this.store.currentPosition();
      console.log('CURRENT POSITION UPDATED', currentPosition);
      this.initTouched();
      console.log('*** Position changed (slideUpdate) ***', currentPosition);
      this.slideUpdate.emit(currentPosition);
    });

    effect(() => {
      const snap = this.inputsSnapshot();
      this.store.patch({
        ...snap,
      });
    });

    effect(() => {
      const autoplay = this.autoplay();
      if (autoplay !== false && this.layoutReady()) {
        this.startAutoplay();
      }
    });

    effect(() => {
      const slideTo = this.forceSlideTo();
      untracked(() => {
        if (slideTo) {
          this.slideTo(slideTo.position, slideTo.animated);
        }
      });
    });
  }

  ngOnInit(): void {
    if (!this.uniqueCarouselId) {
      this.uniqueCarouselId = generateRandomClassName(10);
    }

    this.store.patch({
      currentRealPosition: this.initialSlide(),
      uniqueCarouselId: this.uniqueCarouselId,
    });

    this.applyBreakpoints();
  }

  ngAfterViewInit(): void {
    this.applyUniqueId();
    this.initProjectedSlides();
    this.refresh();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.breakpointService.clear();

    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }

    this.observer?.disconnect();
  }

  private enableDebugMode() {
    (this.window as any).__carouselDebug = {
      store: this.store,
      state: () => this.store.state(),
      slideTo: (index: number) => this.slideTo(index),
      getTranslate: () => this.store.currentTranslate(),
      getPosition: () => this.currentPosition(),
    };

    effect(() => {
      console.log('--------------- State udated:', this.store.state());

      //   {
      //   position: this.currentPosition(),
      //   realPosition: this.currentRealPosition(),
      //   translate: this.store.currentTranslate(),
      //   hasReachedStart: this.hasReachedStart(),
      //   hasReachedEnd: this.hasReachedEnd(),
      // });
    });
  }

  private updateCarouselState(partial: Partial<Carousel>) {
    this.store.patch(partial);
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
    this.store.patch({ slidesElements: [...this.slidesElements()] });
    this.domService.updateSlides();
    this.refreshTranslate();
  }

  private initTouched() {
    if (!this.firstTouch) {
      this.touched.emit();
      this.firstTouch = true;
    }
  }

  /**
   * Handle slide to prev index.
   * From navigation or accessibility.
   */
  public slideToPrev() {
    let indexSlided = undefined;
    if (this.store.state().stepSlides > 1) {
      indexSlided =
        this.store.state().currentPosition -
        (this.store.state().stepSlides - 1) -
        1;
      indexSlided = positiveModulo(indexSlided, this.totalSlides());
    }
    this.loopService.insertLoopSlides(undefined, true);

    const hasReachedStart = this.store.hasReachedStart();
    let newPosition: number | undefined = undefined;
    if (hasReachedStart && this.rewind()) {
      newPosition = this.store.totalSlides() - 1;
    } else {
      newPosition =
        this.navigationService.calculateNewPositionAfterNavigation(false);
    }
    this.slidePrev.emit();

    this.slideTo(newPosition);
  }

  /**
   * Handle slide to next index.
   * From navigation or accessibility.
   */
  public slideToNext() {
    let indexSlided = undefined;
    // if (this.store.state().stepSlides > 1) {
    //   indexSlided =
    //     this.store.state().currentPosition +
    //     (this.store.state().stepSlides - 1) +
    //     1;
    //   indexSlided = positiveModulo(indexSlided, this.totalSlides());
    // }
    this.loopService.insertLoopSlides(indexSlided, false);

    const hasReachedEnd = this.store.hasReachedEnd();
    let newPosition: number | undefined = undefined;
    if (hasReachedEnd && this.rewind()) {
      newPosition = 0;
    } else {
      newPosition =
        this.navigationService.calculateNewPositionAfterNavigation(true);
    }

    this.slideNext.emit();

    this.slideTo(newPosition);
  }

  /**
   * When we need to slide to nearest index.
   */
  private slideToNearest() {
    console.log('SLIDING TO NEAREST');
    const newPosition =
      this.transformService.calculateTargetPositionAfterTranslation(
        this.isReachEnd(),
        this.isReachStart()
      );

    this.slideTo(newPosition);
  }

  private focusOnCurrentSlide() {
    const slides = this.slidesElements();
    if (slides && slides[this.store.currentPosition()]) {
      slides[this.store.currentPosition()].nativeElement.focus();
    }
  }

  // Handle scroll on desktop
  sensitivity = 1;
  velocitySensitivity = 5;
  velocitySensitivityFreeMode = 1;
  velocityBounds = 0.5;

  private dragState = signal<{
    isDragging: boolean;
    hasMoved: boolean;
    hasExtraTranslation: boolean;
    startX: number;
    lastX: number;
    lastMoveTime: number;
    lastClickTime: number;
    lastPageXPosition: number;
    lockedAxis: 'x' | 'y' | null;
  }>({
    isDragging: false,
    hasMoved: false,
    hasExtraTranslation: false,
    startX: 0,
    lastX: 0,
    lastMoveTime: 0,
    lastClickTime: 0,
    lastPageXPosition: 0,
    lockedAxis: null,
  });

  private suppressNextClick = false;

  @HostListener('transitionend', ['$event'])
  onHostTransitionEnd(event: TransitionEvent) {
    const slidesEl = this.allSlides()?.nativeElement;
    if (event.propertyName === 'transform' && event.target === slidesEl) {
      console.log('*** trnasition end event:', event);
    }
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    const { x, y } = this.getPointerPosition(event);

    this.gestureStart = {
      x,
      y,
      time: Date.now(),
      event,
    };

    this.store.patch({ lastTranslate: this.store.currentTranslate() });

    this.dragState.update((state) => ({
      ...state,
      isDragging: true,
      hasMoved: false,
      hasExtraTranslation: false,
      startX: x,
      lastPageXPosition: y,
      lastClickTime: new Date().getTime(),
      lockedAxis: null,
    }));
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    const mouseWheel = this.mouseWheel();
    if (!mouseWheel) {
      return;
    }
    let isWheel = false;
    if (mouseWheel === true || mouseWheel.horizontal) {
      isWheel = e.deltaX !== 0;
    }
    if (mouseWheel !== true && mouseWheel.vertical) {
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
    const dragState = this.dragState();

    if (!dragState.isDragging || !this.allSlides()) {
      return;
    }

    this.initTouched();

    const { x, y, isTouch } = this.getPointerPosition(event);

    const now = Date.now();
    const gestureStart = this.gestureStart;
    // Determine threshold for mobile scroll on page while sliding.
    const AXIS_LOCK_THRESHOLD = 8;

    if (isTouch && gestureStart) {
      const { lockedAxis } = dragState;

      if (!lockedAxis) {
        const dx = x - gestureStart.x;
        const dy = y - gestureStart.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Too little gesture to decide.
        if (absDx < AXIS_LOCK_THRESHOLD && absDy < AXIS_LOCK_THRESHOLD) {
          return;
        }

        if (absDy > absDx) {
          // Vertical gesture => no drag
          this.resetDrag();
          return;
        }

        // Horizontal gesture.
        this.dragState.update((s) => ({ ...s, lockedAxis: 'x' }));
      } else if (lockedAxis === 'y') {
        return;
      }
    }

    // For mouse.
    if (!isTouch && dragState.lockedAxis !== 'x') {
      this.dragState.update((s) => ({ ...s, lockedAxis: 'x' }));
    }

    if (this.dragState().lockedAxis !== 'x') {
      return;
    }

    if (isTouch) {
      event.preventDefault();
    }

    this.dragState.update((s) => ({
      ...s,
      hasMoved: true,
      lastMoveTime: now,
      lastPageXPosition: now - s.lastMoveTime > 50 ? x : s.lastPageXPosition,
    }));

    const deltaX = (x - dragState.startX) * this.sensitivity;

    if (this.shouldStartDrag(gestureStart.event ?? event)) {
      this.followUserMove(deltaX, false, x);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    if (!this.dragState().isDragging) {
      return;
    }

    const { x } = this.getPointerPosition(event);
    const timeEnd = Date.now();

    const dist = x - this.gestureStart.x;
    const duration = timeEnd - this.gestureStart.time;
    const absDist = Math.abs(dist);

    const SWIPE_THRESHOLD = 15; // px
    const SWIPE_TIME_LIMIT = 200; // ms
    const MIN_DRAG_DIST = 5; // px

    // Will be a click, we do nothing.
    if (absDist < MIN_DRAG_DIST && !this.dragState().hasExtraTranslation) {
      this.resetDrag();
      return;
    }

    if (this.store.draggable()) {
      this.suppressNextClick = true;
    }

    const isSwipe = duration < SWIPE_TIME_LIMIT && absDist > SWIPE_THRESHOLD;

    // Freemode specific
    if (this.freeMode()) {
      if (isSwipe) {
        this.physicsService.applyInertia(undefined, (translate) => {
          this.updateTransform(translate);
        });
      } else if (this.dragState().hasExtraTranslation) {
        this.slideToNearest();
      }
      this.resetDrag();
      return;
    }

    // Swipe
    if (isSwipe) {
      if (dist < 0) {
        this.slideToNext();
      } else {
        this.slideToPrev();
      }
      this.resetDrag();
      return;
    }

    // CLassic translation
    this.slideToNearest();
    this.resetDrag();
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent) {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    if (this.dragState().hasMoved) {
      return;
    }

    const CLICK_MAX_DIST = 2; // px
    const CLICK_MAX_TIME = 200; // ms

    const dx = event.pageX - this.gestureStart.x;
    const dy = event.pageY - this.gestureStart.y;
    const dist = Math.hypot(dx, dy);
    const dt = Date.now() - this.gestureStart.time;

    if (dist > CLICK_MAX_DIST || dt > CLICK_MAX_TIME) {
      return;
    }

    this.clickOnSlide(event);
  }

  private resetDrag() {
    this.dragState.update((state) => ({
      ...state,
      isDragging: false,
      hasMoved: false,
      lockedAxis: null,
    }));
    this.domService.updateSlides();
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

  @HostListener('mouseenter')
  onMouseEnter() {
    const autoplay = this.autoplay();
    if (autoplay && autoplay.pauseOnHover && this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    const autoplay = this.autoplay();
    if (autoplay && autoplay.resumeOnMouseLeave && !this.autoplayTimer) {
      this.startAutoplay();
    }
  }

  private startAutoplay() {
    const autoplay = this.autoplay();
    if (!autoplay) {
      return;
    }
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
    }
    this.autoplayTimer = setInterval(() => {
      this.slideToNext();
    }, autoplay.delay);
  }

  private isReachEnd(): boolean {
    return this.currentPosition() >= this.lastSlideAnchor();
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
      if (!this.resistance() || noExtraTranslation) {
        // If we are out of bounds, we don't want to apply extra translation.
        newTranslate = Math.max(
          this.store.state().maxTranslate,
          Math.min(newTranslate, this.store.state().minTranslate)
        );
      } else {
        this.dragState.update((state) => ({
          ...state,
          hasExtraTranslation: true,
        }));
        newTranslate =
          this.store.lastTranslate() +
          (deltaX / this.sensitivity) * this.velocityBounds;
      }
    } else {
      this.dragState.update((state) => ({
        ...state,
        hasExtraTranslation: false,
      }));
    }

    this.updatePositionOnMouseMove(newTranslate, xPosition);
  }

  /**
   * Update current translate and apply transform CSS.
   * @param newTranslate
   * @param xPosition
   */
  private updatePositionOnMouseMove(newTranslate: number, xPosition?: number) {
    this.store.patch({
      currentTranslate: newTranslate,
      velocity: xPosition
        ? (xPosition - this.dragState().lastPageXPosition) *
          (this.freeMode()
            ? this.velocitySensitivityFreeMode
            : this.velocitySensitivity)
        : 0,
    });

    this.loopService.insertLoopSlides();

    this.updateTransform();
  }

  private handleReachEvents() {
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
   * We detect if we have projected slides.
   * If we have projected slides, we will use them instead of the slides input.
   */
  private initProjectedSlides() {
    const isProjected =
      this.slides().length === 0 &&
      this.projectedSlides() &&
      this.projectedSlides().length > 0;

    this.updateCarouselState({
      isProjected,
    });
  }

  /**
   * Slide to clicked slide.
   * @param event
   */
  private clickOnSlide(event: Event) {
    if (!this.store.slideOnClick()) {
      return;
    }

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
          this.loopService.insertLoopSlides(index);

          console.log('SLIDING AFTER CLICK');
          this.slideTo(index);
        }
      }
    }
  }

  private clampToVisibleSlide(index: number) {
    if (this.store.state().loop) {
      return index;
    }

    return Math.max(
      this.store.firstSlideAnchor(),
      Math.min(index, this.store.lastSlideAnchor())
    );
  }

  private applyBreakpoints() {
    const breakpoints = this.breakpoints();

    const css = this.breakpointService.generateCss(
      breakpoints,
      this.uniqueCarouselId
    );

    if (css) {
      this.generatedStyles = this.sanitizer.bypassSecurityTrustHtml(css);
      this.detectChanges.detectChanges();
    }

    if (this.isServerMode) {
      return;
    }

    this.breakpointService.setupMediaQueryListeners(breakpoints, (config) =>
      this.updateCarouselState(config)
    );
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - this.store.fullWidth()) > 1) {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.refresh();
          }, 120);
        }
      }
    });

    this.observer.observe(this.allSlides()!.nativeElement);
  }

  public onImagesReady() {
    console.log('IMAGES LOADED !!!!');
    this.imagesLoaded.emit();
    this.areImagesReady.set(true);
  }

  public onImagesChanged() {
    console.log('IMAGES CHANGED !!!!');
  }

  private enableTransition() {
    this._transitionDuration.set(TRANSITION_DURATION);
    setTimeout(() => this.disableTransition(), TRANSITION_DURATION);
  }

  public disableTransition() {
    this._transitionDuration.set(0);
  }

  /**
   * Move slides.
   * From arrows or by mouse / touch.
   * @param posX
   * @returns
   */
  public updateTransform(
    translateToApply: number = this.store.currentTranslate(),
    updatePosition = true,
    detectChanges = false
  ) {
    this.store.patch({ currentTranslate: translateToApply });

    if (detectChanges) {
      this.detectChanges.detectChanges();
    }

    this.handleReachEvents();

    if (!this.store.state().freeMode || !updatePosition) {
      this.domService.updateSlides();
      return;
    }

    const newPosition =
      this.transformService.getNewPositionFromTranslate().position;
    if (newPosition !== undefined) {
      const position = positiveModulo(newPosition, this.store.totalSlides());
      this.store.setCurrentPosition(this.clampToVisibleSlide(position));
      this.store.patch({ currentRealPosition: position });
      this.domService.updateSlides();
    }
  }

  /**
   * Trigger slide to specific index.
   * If index is not provided, it will slide to the current position.
   * @param index
   */
  public slideTo(index = this.store.currentRealPosition(), animate = true) {
    console.log('SLIDING TO ', index);
    this.store.patch({ currentRealPosition: index });

    index = this.clampToVisibleSlide(index);

    if (index !== undefined && index !== this.store.currentPosition()) {
      this.store.setCurrentPosition(index);
    }

    if (animate) {
      this.enableTransition();
    }

    const translateToApply =
      this.transformService.getTranslateFromPosition(index);
    this.updateTransform(translateToApply, false);
  }

  private refreshTranslate() {
    const currentPosition = this.currentPosition();
    const translate =
      this.transformService.getTranslateFromPosition(currentPosition);
    this.store.patch({ currentTranslate: translate });
  }

  private shouldStartDrag(event: MouseEvent | TouchEvent): boolean {
    if (!this.store.draggable()) {
      return false;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return true;
    }

    const selector = this.store.state().dragIgnoreSelector;
    if (!selector) {
      return true;
    }

    const ignoreCandidate = target.closest(selector);
    return !ignoreCandidate;
  }

  private getPointerPosition(event: MouseEvent | TouchEvent): {
    x: number;
    y: number;
    isTouch: boolean;
  } {
    if (event instanceof MouseEvent) {
      return { x: event.pageX, y: event.pageY, isTouch: false };
    }

    const touch = event.touches[0] ?? (event as TouchEvent).changedTouches[0];

    return {
      x: touch.pageX,
      y: touch.pageY,
      isTouch: true,
    };
  }
}
