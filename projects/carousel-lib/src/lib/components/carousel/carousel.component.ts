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

interface Slide {}
interface Carousel {}
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
    NavigationComponent,
  ],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @ContentChildren(SlideDirective) projectedSlides!: QueryList<SlideDirective>;

  @Input() slides: Slide[] = [];
  @Input() slidesPerView: number | 'auto' = 4.5;
  @Input() spaceBetween: number = 5;
  @Input() showControls = true;
  @Input() iconSize = 50;
  @Input() pagination: Pagination | undefined = {
    type: 'dynamic_dot',
    clickable: true,
    external: false,
  };
  @Input() initialSlide = 0;
  @Input() freeMode = true;
  @Input() deltaPosition = 0.6;
  @Input() showProgress = true;
  @Input() dotsControl = true;
  @Input() rewind = false;
  @Input() loop = false;
  @Input() center = false;
  /**
   * Needs center to be true.
   */
  @Input() centerBounds = true;
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

  private _currentPosition: number = this.initialSlide;
  set currentPosition(newPosition: number) {
    if (newPosition !== this._currentPosition) {
      this.slideUpdate.emit(newPosition);
    }
    this._currentPosition = newPosition;
  }
  get currentPosition() {
    return this._currentPosition;
  }

  uniqueCarouselId = '';
  generatedStyles: SafeHtml = '';
  fullWidth = 0;
  scrollWidth = 0;
  totalSlides = 0;
  totalSlidesVisible = 0;
  allSlidesElements: HTMLElement[] = [];
  slidesWidths: number[] = [];
  slidesPositions = [];
  hasReachedEnd = false;
  hasReachedStart = false;
  isPojected = false;

  @ViewChild('allSlides') public allSlides?: ElementRef;

  // Can be used by user to move pagination element.
  @ViewChild('paginationTemplate', { static: true })
  public paginationTemplate!: TemplateRef<any>;

  constructor(
    private renderer: Renderer2,
    private detectChanges: ChangeDetectorRef,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // TODO Replace by resizeobserver
    if (!this.isServerMode) {
      fromEvent(window, 'resize')
        .pipe(debounceTime(200))
        .subscribe(() => this.refresh());
    }
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
      this.uniqueCarouselId = this.generateRandomClassName(10);
    }
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

  private generateRandomClassName(length: number = 8): string {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  }

  private refresh() {
    this.applySpaceBetween();
    this.applySlidesPerView();

    // We must wait browser calculation for grid display.
    this.calculateGridWidth();

    this.updateSlides();

    this.detectChanges.detectChanges();
  }

  /**
   * Add class to identify slides roles and states.
   * @returns
   */
  public updateSlides() {
    if (!this.allSlides) {
      return;
    }
    this.renderer.addClass(this.allSlides.nativeElement, this.uniqueCarouselId);
    const allSlides = this.allSlides.nativeElement.querySelectorAll('.slide');
    if (allSlides && Array.isArray(allSlides)) {
      this.allSlidesElements = allSlides;

      allSlides.forEach((slide: HTMLElement, index: number) => {
        this.resetPositions(slide, index);
        this.setAccessibility(slide, index);
        this.setLazyLoading(slide, index);
      });

      this.setSlidesPositions();
    }
  }

  public slideTo(index?: number) {
    if (index !== undefined) {
      this.currentPosition = index;
    }
    console.log('sliding to index:', index);

    this.applyTransitionAnimation();

    const newTranslate = this.getTranslateFromPosition(index);
    this.currentTranslate = newTranslate;
    this.updateTransform(false);
  }

  private applyTransitionAnimation() {
    this.renderer.setStyle(
      this.allSlides?.nativeElement,
      'transition-duration',
      `0.4s`
    );
    setTimeout(() => {
      this.renderer.setStyle(
        this.allSlides?.nativeElement,
        'transition-duration',
        `0s`
      );
    }, 400);
  }

  // Handle scroll on desktop
  hasMoved = false;
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

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    const xPosition =
      event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;

    this.lastClickTime = new Date().getTime();
    this.isDragging = true;
    this.hasMoved = false;
    this.startX = xPosition;
    this.lastPageXPosition = this.startX;

    this.lastTranslate = this.currentTranslate;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.allSlides) return;

    const xPosition =
      event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;

    this.hasMoved = true;

    if (new Date().getTime() - this.lastMoveTime > 50) {
      this.lastPageXPosition = xPosition;
    }
    this.lastMoveTime = new Date().getTime();

    const deltaX = (xPosition - this.startX) * this.sensitivity;

    let newTranslate = this.lastTranslate + deltaX;
    if (
      newTranslate <= this.maxTranslate ||
      newTranslate >= this.minTranslate
    ) {
      newTranslate =
        this.lastTranslate + (deltaX / this.sensitivity) * this.velocityBounds;
    }

    this.currentTranslate = newTranslate;
    //  Math.max(
    //   this.maxTranslate,
    //   Math.min(this.lastTranslate + deltaX, this.minTranslate),
    // );

    this.velocity =
      (xPosition - this.lastPageXPosition) *
      (this.freeMode
        ? this.velocitySensitivityFreeMode
        : this.velocitySensitivity);

    this.updateTransform();
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    const isClick =
      !this.hasMoved && new Date().getTime() - this.lastClickTime < 200;
    if (isClick && this.slideOnClick) {
      this.clickOnSlide(event);
      return;
    }

    const isSwipe = new Date().getTime() - this.lastMoveTime < 200;

    // We navigate only slide to slide, except for drag and drop.
    if (!this.freeMode && this.hasMoved) {
      this.swipeToNearest();
    }
    // We apply inertia only if move was fast enough.
    else if (this.freeMode && isSwipe) {
      this.applyInertia();
    }

    this.updateSlides();
    this.hasMoved = false;
  }

  /**
   * Move slides.
   * From arrows or by mouse / touch.
   * @param posX
   * @returns
   *
   */
  updateTransform(updatePosition = true) {
    if (!this.allSlides) return;

    const roundedCurrentTranslate = Math.round(this.currentTranslate);

    this.renderer.setStyle(
      this.allSlides.nativeElement,
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
      this.currentPosition = newPosition;
      this.detectChanges.detectChanges();
      this.updateSlides();
    }
  }

  private applyInertia() {
    if (!this.allSlides) return;

    let friction = 0.93;

    const step = () => {
      if (Math.abs(this.velocity) < 0.5) return;

      this.currentTranslate += this.velocity;
      this.velocity *= friction;

      if (
        this.currentTranslate <= this.maxTranslate ||
        this.currentTranslate >= this.minTranslate
      ) {
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
    this.hasReachedEnd = this.currentTranslate <= this.maxTranslate;
    this.hasReachedStart = this.currentTranslate >= this.minTranslate;
    if (this.hasReachedEnd) {
      this.reachEnd.emit();
    }
    if (this.hasReachedStart) {
      this.reachStart.emit();
    }
  }

  private applySpaceBetween() {
    if (this.allSlides) {
      this.renderer.setStyle(
        this.allSlides.nativeElement,
        'gap',
        `${this.spaceBetween}px`
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

  private applySlidesPerView() {
    // Define grid columns.
    if (this.allSlides && this.slidesPerView !== 'auto' && !this.breakpoints) {
      console.log('slidespervie', this.slidesPerView);
      this.renderer.setStyle(
        this.allSlides.nativeElement,
        'grid-auto-columns',
        this.getGridColumnsValue(this.slidesPerView, this.spaceBetween)
      );
    }
  }

  /**
   * Initialize slides width and margins.
   */
  private calculateGridWidth() {
    const allSlides = Array.from(
      this.allSlides?.nativeElement.querySelectorAll('.slide')
    ) as HTMLElement[];

    if (Array.isArray(allSlides) && allSlides.length) {
      this.allSlidesElements = allSlides;
      this.totalSlides = this.allSlidesElements.length;

      if (this.center) {
        this.totalSlidesVisible = this.totalSlides;
      } else if (this.slidesPerView !== 'auto') {
        this.totalSlidesVisible =
          this.totalSlides - Math.floor(this.slidesPerView) + 1;
      }

      if (!this.isServerMode) {
        setTimeout(() => {
          this.fullWidth = this.allSlides?.nativeElement.clientWidth;
          this.scrollWidth = this.allSlides?.nativeElement.scrollWidth;

          this.calculateSlidesWidths();
          if (this.slidesPerView === 'auto' && !this.center) {
            this.calculateSlidesVisibleAuto();
          }
          this.calculateTranslations();
        });
      }
    }
  }

  private calculateTranslations() {
    this.maxTranslate = -(this.scrollWidth - this.fullWidth) - this.marginEnd;
    this.minTranslate = this.marginStart;
    if (this.center) {
      this.minTranslate = this.fullWidth / 2 - this.slidesWidths[0] / 2;
      this.maxTranslate -= this.fullWidth / 2 - this.slidesWidths[0] / 2;
      this.currentTranslate = this.initialSlide
        ? this.getTranslateFromPosition(this.initialSlide)
        : this.minTranslate;
      this.updateTransform(false);
    } else {
      if (this.initialSlide) {
        this.currentTranslate = this.getTranslateFromPosition(
          this.initialSlide
        );
        this.updateTransform(false);
      } else if (this.marginStart) {
        this.currentTranslate = this.minTranslate;
        this.updateTransform(false);
      }
    }

    console.log('mintranslate', this.minTranslate);
    console.log('maxtranslate', this.maxTranslate);
  }

  private calculateSlidesWidths() {
    this.slidesWidths = [];
    for (const slide of this.allSlidesElements) {
      const slideWidth = slide.getBoundingClientRect().width;
      this.slidesWidths.push(slideWidth);
    }
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
    this.totalSlidesVisible = this.totalSlides - count + 2;
    this.detectChanges.detectChanges();
  }

  private initProjectedSlides() {
    this.isPojected =
      this.slides.length === 0 && this.projectedSlides.length === 0;
    if (this.isPojected) {
      const slidesProjected =
        this.allSlides?.nativeElement.querySelectorAll('* > div');
      if (slidesProjected.length) {
        this.isPojected = true;
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
  private getTranslateFromPosition(index?: number) {
    index = index === undefined ? this.currentPosition : index;
    let posX =
      index === 0 ? this.minTranslate : this.minTranslate - this.marginStart;
    for (let i = 0; i < index; i++) {
      posX -= this.slidesWidths[i] + this.spaceBetween;
    }
    if (index === this.totalSlides - 1) {
      posX -= this.marginEnd;
    }
    return Math.max(this.maxTranslate, Math.min(posX, this.minTranslate));
  }

  private getNewPositionFromTranslate(velocity = false) {
    this.currentTranslate = Math.max(
      this.maxTranslate,
      Math.min(
        this.currentTranslate + (velocity ? this.velocity : 0),
        this.minTranslate
      )
    );

    const position =
      Math.abs(this.currentTranslate - this.minTranslate) /
      (this.slidesWidths[0] + this.spaceBetween);

    const isNewPosition =
      Math.abs(this.currentPosition - position) > this.deltaPosition;

    return {
      exactPosition: position,
      position: isNewPosition ? Math.round(position) : undefined,
    };
  }

  private swipeToNearest() {
    const isSwipe = new Date().getTime() - this.lastMoveTime < 100;
    const { position, exactPosition } =
      this.getNewPositionFromTranslate(isSwipe);

    let newPosition: number | undefined = undefined;
    if (this.currentTranslate <= this.maxTranslate) {
      if (isSwipe || exactPosition > this.currentPosition) {
        // Maximum reached.
        newPosition = Math.ceil(exactPosition);
      }
    } else if (isSwipe) {
      const isSlidingNext = exactPosition > this.currentPosition;
      const isSlidingPrev = exactPosition < this.currentPosition;
      if (isSlidingNext || isSlidingPrev) {
        newPosition = Math.max(
          0,
          Math.min(
            isSlidingNext ? this.currentPosition + 1 : this.currentPosition - 1,
            this.totalSlidesVisible - 1
          )
        );
      }
    } else {
      newPosition = position !== undefined ? position : this.currentPosition;
    }

    this.slideTo(newPosition);
  }

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
          this.slideTo(Math.min(index - 1, this.totalSlidesVisible - 1));
        }
      }
    }
  }

  private setAccessibility(slide: HTMLElement, index: number) {
    this.renderer.setAttribute(
      slide,
      'aria-label',
      `${index + 1}/${this.totalSlides}`
    );
    this.renderer.setAttribute(slide, 'role', 'group');
  }

  private setLazyLoading(slide: HTMLElement, index: number) {
    if (this.lazyLoading) {
      const images = slide.querySelectorAll('img');
      images.forEach((image) => {
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
    const curr = this.allSlides?.nativeElement.querySelector(
      '.slide.position-' + (this.currentPosition + 1)
    );
    const prev = this.allSlides?.nativeElement.querySelector(
      '.slide.position-' +
        (this.currentPosition <= 0
          ? this.loop
            ? this.totalSlides
            : null
          : this.currentPosition)
    );
    const next = this.allSlides?.nativeElement.querySelector(
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
    if (this.breakpoints === undefined || this.slidesPerView === 'auto') {
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

      // const mql = window.matchMedia(query);
      // const listener = (e: MediaQueryListEvent) => {
      //   this.ngZone.run(() => {
      //     if (e.matches) {
      //       if (config.slidesPerView) {
      //         this.slidesPerView = config.slidesPerView;
      //         this.refresh();
      //       }
      //     }
      //   });
      // };

      // mql.addEventListener('change', listener);
      // this.mediaQueryListeners.push({ mql, listener });

      // if (mql.matches) {
      //   if (config.slidesPerView) {
      //     this.slidesPerView = config.slidesPerView;
      //     this.refresh();
      //   }
      // }
    });
    css += '</style>';
    this.generatedStyles = this.sanitizer.bypassSecurityTrustHtml(css);
    this.detectChanges.detectChanges();
  }
}
