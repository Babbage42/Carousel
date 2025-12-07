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
  CarouselAxis,
  CarouselDirection,
  CarouselResponsiveConfig,
  PeekEdges,
  Slide,
  THUMBS_TRANSITION_DURATION_MS,
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
import { rafThrottle } from '../../helpers/raf-throttle.helper';
import { CarouselLayoutService } from '../../services/carousel-layout.service';
import { CarouselInteractionService } from '../../services/carousel-interaction.service';
import { getPointerPosition } from '../../helpers/event.helper';

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
    CarouselLayoutService,
    CarouselBreakpointService,
    CarouselInteractionService,
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
  public readonly navigationService = inject(CarouselNavigationService);
  private readonly domService = inject(CarouselDomService);
  private readonly layoutService = inject(CarouselLayoutService);
  private readonly interactionService = inject(CarouselInteractionService);

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

  slides = input([], {
    transform: (v: Slide[] | string[]): Slide[] => {
      return v.map((el: string | Slide) =>
        typeof el === 'string' ? { image: el } : el
      );
    },
  });
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
  canSwipe = input(true);
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

  keyboardNavigation = input(true);

  initialSlide = input<number>(0);
  realInitialSlide = computed(() => {
    const initial = this.initialSlide();
    const firstSlideAnchor = this.firstSlideAnchor();
    return Math.max(firstSlideAnchor, initial);
  });
  /**
   * By default, navigate prev or next will move page by page.
   * With this option, you can force carousel to really slide to prev or next slide.
   * Useful when you want to highligh the currently selected slide.
   * Useful in thumbs mode.
   */
  navigateSlideBySlide = input(false);
  /**
   * Can pass ref of master carousel.
   * Current carousel will serve as thumbnails pilote.
   */
  thumbsFor = input<CarouselComponent>();
  /**
   * Thumbs custom options.
   */
  thumbsOptions = input({
    selectionBar: true,
  });

  direction = input<CarouselDirection>('ltr');
  axis = input<CarouselAxis>('horizontal');

  /**
   * Subscribe to master positions.
   */
  readonly masterActiveIndex = computed(() => {
    const master = this.thumbsFor();
    if (!master) {
      return undefined;
    }
    return {
      currentPosition: master.currentPosition(),
      currentRealPosition: master.currentRealPosition(),
    };
  });

  // Chrome fix to avoid subpixel issue.
  // @todo only for chrome
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
  // It will be override temporary in CSS.
  public readonly slidesTransform = computed(() => {
    const currentTranslate = this.store.currentTranslate();
    const effective = this.store.isRtl() ? -currentTranslate : currentTranslate;
    return this.store.axisConf().slidesTransform(effective);
  });

  private readonly _transitionDuration = signal(0);
  readonly transitionDuration = this._transitionDuration.asReadonly();
  public readonly thumbsTransitionDuration = signal(0);

  public readonly slidesGap = computed(() => `${this.store.spaceBetween()}px`);
  private initialResizeObserverAttached = false;
  private layoutInitialized = false;
  private slideResizeObserver?: ResizeObserver;

  public readonly slidesGridSize = computed(() => {
    const slidesPerView = this.store.slidesPerView();
    if (slidesPerView === 'auto') {
      return 'max-content';
    }
    const spaceBetween = this.store.spaceBetween();
    return `calc((100% - ${
      spaceBetween * (slidesPerView - 1)
    }px) / ${slidesPerView})`;
  });

  // We register all user inputs here so we can react to each change and
  // update state accordingly.
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
      canSwipe: this.canSwipe(),
      peekEdges: this.peekEdges(),
      pagination: this.pagination(),
      dragIgnoreSelector: this.dragIgnoreSelector(),
      keyboardNavigation: this.keyboardNavigation(),
      navigateSlideBySlide: this.navigateSlideBySlide(),
      thumbsOptions: this.thumbsOptions(),
      direction: this.direction(),
      axis: this.axis(),
    };
    return inputs;
  });

  @Output() slideUpdate = new EventEmitter();
  @Output() slideNext = new EventEmitter();
  @Output() slidePrev = new EventEmitter();
  @Output() touched = new EventEmitter();
  @Output() reachEnd = new EventEmitter();
  @Output() reachStart = new EventEmitter();
  indexSelected = output<number>();
  imagesLoaded = output<void>();
  transitionEnd = output<void>();

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

  /**
   * Thumb selection bar positionning.
   */
  thumbIndicatorLeft = signal(0);
  thumbIndicatorWidth = signal(0);

  constructor(
    private renderer: Renderer2,
    private detectChanges: ChangeDetectorRef,
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
        this.updateCarouselState({
          currentPosition: realInitialSlide,
        });
      });
    });

    effect(() => {
      const allSlides = this.allSlides();
      untracked(() => this.updateCarouselState({ allSlides }));
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
      const projectedSlides = this.projectedSlides();
      this.updateCarouselState({ projectedSlides: [...projectedSlides] });
    });

    afterRenderEffect(() => {
      const slidesEls = this.slidesElements();
      if (!slidesEls.length) {
        return;
      }

      if (!this.areImagesReady()) {
        return;
      }

      if (!this.initialResizeObserverAttached) {
        this.initialResizeObserverAttached = true;
        this.setupSlidesResizeObserver();
      }

      if (!this.layoutInitialized) {
        this.updateLayoutFromDom();
      } else {
        untracked(() => this.refresh());
        console.log('*** REFRESHING AFTER SLIDES UPDATE');
      }
    });

    effect(() => {
      const currentPosition = this.store.currentPosition();

      this.initTouched();
      console.log('*** Position changed (slideUpdate) ***', currentPosition);
      this.slideUpdate.emit(currentPosition);
    });

    effect(() => {
      const snap = this.inputsSnapshot();
      this.updateCarouselState({
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

    effect(() => {
      if (this.thumbsFor()) {
        // Apply default configuration.
        this.updateCarouselState({
          slidesPerView: 7,
          center: false,
          loop: false,
          draggable: true,
          canSwipe: true,
          showControls: true,
          pagination: undefined,
          slideOnClick: true,
          navigateSlideBySlide: true,
          resistance: false,
          peekEdges: {
            relativeOffset: 0.5,
          },
        });
      }
    });

    /**
     * Force thumb to follow the master currentIndex.
     */
    effect(() => {
      const master = this.thumbsFor();
      if (!master) {
        return;
      }

      const masterActiveIndex = this.masterActiveIndex();
      if (!masterActiveIndex) {
        return;
      }

      const { currentPosition, currentRealPosition } = masterActiveIndex;
      if (currentPosition === undefined || currentPosition < 0) {
        return;
      }

      untracked(() => {
        this.slideTo(currentRealPosition, true, true, true);
      });
    });

    effect(() => {
      this.indexSelected.emit(this.store.currentRealPosition());
    });

    /**
     * Positionning of thumb selection bar.
     */
    afterRenderEffect(() => {
      const master = this.thumbsFor();
      if (!master) {
        return;
      }

      if (!this.thumbsOptions()?.selectionBar) {
        return;
      }

      const index = this.currentRealPosition();
      if (index === undefined || index < 0) {
        return;
      }

      if (index === undefined || index < 0) {
        return;
      }

      // To follow user move.
      this.store.currentTranslate();

      const slides = this.slidesElements();
      const container = this.allSlides()?.nativeElement as HTMLElement;
      const active = slides[index]?.nativeElement as HTMLElement | undefined;

      if (!container || !active) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const offset = untracked(
        () =>
          activeRect.left - containerRect.left + this.store.currentTranslate()
      );

      untracked(() => {
        this.thumbIndicatorLeft.set(offset);
        this.thumbIndicatorWidth.set(activeRect.width);
      });
    });

    effect(() => {
      const total = this.totalSlides();
      const order = this.store.slidesIndexOrder();

      if (!total) {
        return;
      }

      if (order.length !== total) {
        this.store.resetSlidesIndexOrder();
      }
    });
  }

  ngOnInit(): void {
    if (!this.uniqueCarouselId) {
      this.uniqueCarouselId = generateRandomClassName(10);
    }

    this.updateCarouselState({
      currentRealPosition: this.initialSlide(),
      uniqueCarouselId: this.uniqueCarouselId,
    });

    this.applyBreakpoints();
  }

  ngAfterViewInit(): void {
    this.applyUniqueId();
    this.initProjectedSlides();
    this.refresh(false);
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
      if (this.debug()) {
        console.log('--------------- State udated:', this.store.state());
      }
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

  private refresh(updateSlides = true) {
    if (updateSlides) {
      this.updateCarouselState({
        slidesElements: [...this.slidesElements()],
        allSlides: { ...this.allSlides() } as ElementRef<any>,
      });
    }
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
   * Handle slide to next index.
   * From navigation or accessibility.
   */
  public slideToNext() {
    this.slideNext.emit();
    const target = this.navigationService.getNextIndex();
    this.slideTo(target);
  }

  /**
   * Handle slide to prev index.
   * From navigation or accessibility.
   */
  public slideToPrev() {
    this.slidePrev.emit();
    const target = this.navigationService.getPrevIndex();
    this.slideTo(target);
  }

  /**
   * When we need to slide to nearest index after translation.
   */
  private slideToNearest() {
    const { position, exactPosition } =
      this.transformService.calculateTargetPositionAfterTranslation(
        this.isReachEnd(),
        this.isReachStart()
      );

    console.log('SLIDING TO NEAREST', position, exactPosition);

    const target = !this.navigationService.isSlideDisabled(position)
      ? position
      : this.store.currentPosition();

    this.slideTo(target, true, exactPosition === target);
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

  @HostListener('transitionend', ['$event'])
  onHostTransitionEnd(event: TransitionEvent) {
    const slidesEl = this.allSlides()?.nativeElement;
    if (event.propertyName === 'transform' && event.target === slidesEl) {
      console.log('*** trnasition end event:', event);
      this.transitionEnd.emit();
    }
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    this.interactionService.handleStart(event);
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.mouseWheel()) {
      this.interactionService.handleWheel(event);
      this.initTouched();
    }
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    this.initTouched();
    this.interactionService.handleMove(event);
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    this.interactionService.handleEnd(event);
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent) {
    this.interactionService.handleClick(event);
  }

  // Accessibility
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.keyboardNavigation()) {
      return;
    }

    const isRtl = this.store.isRtl();

    if (this.store.isVertical()) {
      if (event.key === 'ArrowDown') {
        this.slideToNext();
        this.focusOnCurrentSlide();
        event.preventDefault();
        return;
      }
      if (event.key === 'ArrowUp') {
        this.slideToPrev();
        this.focusOnCurrentSlide();
        event.preventDefault();
        return;
      }
    } else if (
      (event.key === 'ArrowRight' && !isRtl) ||
      (event.key === 'ArrowLeft' && isRtl)
    ) {
      this.slideToNext();
      this.focusOnCurrentSlide();
      event.preventDefault();
    } else if (
      (event.key === 'ArrowLeft' && !isRtl) ||
      (event.key === 'ArrowRight' && isRtl)
    ) {
      this.slideToPrev();
      this.focusOnCurrentSlide();
      event.preventDefault();
    } else if (event.key === 'Home') {
      const firstEnabled =
        this.navigationService.findNextEnabledIndex(-1, +1) ?? 0;
      this.slideTo(firstEnabled);
      this.focusOnCurrentSlide();
      event.preventDefault();
    } else if (event.key === 'End') {
      const lastIndex = this.store.totalSlides() - 1;
      const lastEnabled =
        this.navigationService.findNextEnabledIndex(0, -1) ?? lastIndex;
      this.slideTo(lastEnabled);
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

  private handleReachEvents() {
    const hasReachedEnd = this.isReachEnd();
    const hasReachedStart = this.isReachStart();

    this.updateCarouselState({
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
      this.store.slides().length === 0 &&
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
    if (!slideElement) {
      return;
    }
    const classes = slideElement.className.split(' ');
    const posClass = classes.find((cls) => cls.indexOf('position-') === 0);
    if (!posClass) {
      return;
    }
    const indexStr = posClass.replace('position-', '');
    const position = parseInt(indexStr, 10);
    if (isNaN(position)) {
      return;
    }
    const index = position - 1;
    this.loopService.insertLoopSlides(index);

    if (this.navigationService.isSlideDisabled(index)) {
      return;
    }

    console.log('SLIDING AFTER CLICK', index);
    this.slideTo(index);
  }

  private clampToVisibleSlide(index: number) {
    if (this.store.loop()) {
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

  private enableThumbsTransition(customTransition?: number) {
    if (!this.thumbsOptions()?.selectionBar) {
      return;
    }
    this.thumbsTransitionDuration.set(
      customTransition ?? THUMBS_TRANSITION_DURATION_MS
    );
    setTimeout(
      () => this.disableThumbsTransition(),
      customTransition ?? THUMBS_TRANSITION_DURATION_MS
    );
  }

  private disableThumbsTransition() {
    this.thumbsTransitionDuration.set(0);
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
    this.updateCarouselState({ currentTranslate: translateToApply });

    if (detectChanges) {
      this.detectChanges.detectChanges();
    }

    this.handleReachEvents();

    // Position is not updated following the translation.
    if (!updatePosition || this.store.navigateSlideBySlide()) {
      this.domService.updateSlides();
      return;
    }

    const newPosition =
      this.transformService.getNewPositionFromTranslate().position;
    if (newPosition === undefined) {
      return;
    }
    const position = positiveModulo(newPosition, this.store.totalSlides());
    const realPosition = this.store.slidesIndexOrder()[position];
    if (realPosition !== this.store.currentPosition()) {
      this.store.setCurrentPosition(this.clampToVisibleSlide(realPosition));
      this.updateCarouselState({ currentRealPosition: realPosition });
      this.domService.updateSlides();
    }
  }

  /**
   * Trigger slide to specific index.
   * If index is not provided, it will slide to the current position.
   * @param index
   */
  public slideTo(
    index = this.store.currentRealPosition(),
    animate = true,
    updateRealPosition = true,
    force = false
  ) {
    console.log('**** SLIDING TO ', index);
    if (!force && this.thumbsFor()) {
      this.thumbsFor()?.slideTo(index, animate);
      return;
    }

    if (updateRealPosition) {
      this.updateCarouselState({ currentRealPosition: index });
    }

    index = this.clampToVisibleSlide(index);

    if (index !== undefined && index !== this.store.currentPosition()) {
      this.store.setCurrentPosition(index);
    }

    if (animate) {
      this.enableTransition();
    }

    if (this.thumbsFor()) {
      this.enableThumbsTransition();
    }

    const translateToApply =
      this.transformService.getTranslateFromPosition(index);
    this.updateTransform(translateToApply, false);
  }

  private refreshTranslate() {
    const currentPosition = this.currentPosition();
    const translate =
      this.transformService.getTranslateFromPosition(currentPosition);
    this.updateCarouselState({ currentTranslate: translate });
  }

  /**
   * Slide to the slide whose id matches the given key.
   */
  public slideToKey(id: string, animate = true) {
    let index = -1;

    const slides = this.store.slides();
    const projected = this.projectedSlides?.() ?? [];

    if (slides && slides.length > 0) {
      index = slides.findIndex((slide) => slide?.id === id);
    }

    if (index === -1 && projected.length > 0) {
      index = projected.findIndex((dir) => dir.slideId === id);
    }
    if (index === -1) {
      return;
    }

    this.loopService.insertLoopSlides(index);

    this.slideTo(index, animate);
  }

  private updateLayoutFromDom() {
    const slidesEls = this.slidesElements();
    if (!slidesEls.length) {
      return;
    }

    const initialized = this.layoutService.updateLayoutFromSlides(slidesEls);

    if (initialized) {
      this.layoutReady.set(true);
      this.layoutInitialized = true;
    }
  }

  private setupSlidesResizeObserver() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const slidesEls = this.slidesElements();
    if (!slidesEls.length) {
      return;
    }

    if (!this.slideResizeObserver) {
      const callback = rafThrottle(() => {
        if (!this.areImagesReady()) {
          return;
        }
        this.updateLayoutFromDom();
      });

      this.slideResizeObserver = new ResizeObserver(() => {
        callback();
      });
    }

    this.slideResizeObserver.disconnect();

    slidesEls.forEach((el) =>
      this.slideResizeObserver!.observe(el.nativeElement)
    );
  }
}
