import { inject, Injectable, Injector, signal, untracked } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselPhysicsService } from './carousel-physics.service';
import { CarouselDomService } from './carousel-dom.service';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { getPointerPosition } from '../helpers/event.helper';

export type PointerCoords = {
  x: number;
  y: number;
  isTouch: boolean;
};

export type DragState = {
  isDragging: boolean;
  hasMoved: boolean;
  hasExtraTranslation: boolean;
  lastX: number;
  currentX: number;
  lastMoveTime: number;
  lastClickTime: number;
  lastPageXPosition: number;
  lockedAxis: 'x' | 'y' | null;
};

@Injectable()
export class CarouselInteractionService {
  private readonly store = inject(CarouselStore);
  private readonly physicsService = inject(CarouselPhysicsService);
  private readonly loopService = inject(CarouselLoopService);
  private readonly domService = inject(CarouselDomService);
  private readonly injector = inject(Injector);

  private suppressNextClick = false;

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }

  public sensitivity = 1;
  public velocitySensitivity = 5;
  public velocitySensitivityFreeMode = 1;
  public velocityBounds = 0.5;

  public gestureStart: {
    x: number;
    y: number;
    time: number;
    event?: MouseEvent | TouchEvent;
  } = { x: 0, y: 0, time: 0 };

  private dragState = signal<DragState>({
    isDragging: false,
    hasMoved: false,
    hasExtraTranslation: false,
    lastX: 0,
    currentX: 0,
    lastMoveTime: 0,
    lastClickTime: 0,
    lastPageXPosition: 0,
    lockedAxis: null,
  });

  public getDragState() {
    return this.dragState();
  }

  public updateDragState(updatedState: Partial<DragState>) {
    this.dragState.update((state) => ({
      ...state,
      ...updatedState,
    }));
  }

  /**
   * Update translation as user is dragging.
   * @param deltaX
   * @param noExtraTranslation
   * @param xPosition
   */
  public followUserMove(
    deltaX: number,
    noExtraTranslation = false,
    xPosition?: number
  ) {
    const effectiveDeltaX = this.store.isRtl() ? -deltaX : deltaX;

    let newTranslate =
      this.store.currentTranslate() + effectiveDeltaX / this.sensitivity;

    const isOutOfBounds =
      !this.store.loop() &&
      (newTranslate < this.store.maxTranslate() ||
        newTranslate > this.store.minTranslate());

    if (isOutOfBounds) {
      if (!this.store.resistance() || noExtraTranslation) {
        // If we are out of bounds, we don't want to apply extra translation.
        newTranslate = Math.max(
          this.store.maxTranslate(),
          Math.min(newTranslate, this.store.minTranslate())
        );
      } else {
        this.dragState.update((state) => ({
          ...state,
          hasExtraTranslation: true,
        }));
        newTranslate =
          this.store.currentTranslate() +
          (effectiveDeltaX / this.sensitivity) * this.velocityBounds;
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
    const rawVelocity = xPosition
      ? (xPosition - this.dragState().lastPageXPosition) *
        (this.store.freeMode()
          ? this.velocitySensitivityFreeMode
          : this.velocitySensitivity)
      : 0;

    const velocity = this.store.isRtl() ? -rawVelocity : rawVelocity;

    this.store.patch({
      currentTranslate: newTranslate,
      velocity,
    });

    this.loopService.insertLoopSlides();

    this.view.updateTransform();
  }

  public resetDrag() {
    this.dragState.update((state) => ({
      ...state,
      isDragging: false,
      hasMoved: false,
      lockedAxis: null,
    }));
    this.domService.updateSlides();
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

  public handleMove(event: MouseEvent | TouchEvent) {
    const dragState = this.getDragState();

    if (!dragState.isDragging) {
      return;
    }

    const { x, y, isTouch } = getPointerPosition(event);

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
        this.updateDragState({ lockedAxis: 'x' });
      } else if (lockedAxis === 'y') {
        return;
      }
    }

    // For mouse.
    if (!isTouch && dragState.lockedAxis !== 'x') {
      this.updateDragState({ lockedAxis: 'x' });
    }

    if (this.getDragState().lockedAxis !== 'x') {
      return;
    }

    if (isTouch) {
      event.preventDefault();
    }

    const deltaX = (x - dragState.currentX) * this.sensitivity;

    const currentState = this.getDragState();
    this.updateDragState({
      hasMoved: true,
      lastMoveTime: now,
      currentX: currentState.currentX + deltaX,
      lastPageXPosition:
        now - currentState.lastMoveTime > 50
          ? x
          : currentState.lastPageXPosition,
    });

    if (this.shouldStartDrag(gestureStart.event ?? event)) {
      this.followUserMove(deltaX, false, x);
    }
  }

  public handleStart(event: MouseEvent | TouchEvent) {
    const { x, y } = getPointerPosition(event);

    this.gestureStart = {
      x,
      y,
      time: Date.now(),
      event,
    };

    this.store.patch({ lastTranslate: this.store.currentTranslate() });

    this.updateDragState({
      isDragging: true,
      hasMoved: false,
      hasExtraTranslation: false,
      currentX: x,
      lastPageXPosition: y,
      lastClickTime: new Date().getTime(),
      lockedAxis: null,
    });
  }

  public handleEnd(event: MouseEvent | TouchEvent) {
    if (!this.getDragState().isDragging) {
      return;
    }

    const { x } = getPointerPosition(event);
    const timeEnd = Date.now();

    const dist = x - this.gestureStart.x;
    const duration = timeEnd - this.gestureStart.time;
    const absDist = Math.abs(dist);

    const SWIPE_THRESHOLD = 15; // px
    const SWIPE_TIME_LIMIT = 200; // ms
    const MIN_DRAG_DIST = 5; // px

    // Will be a click, we do nothing.
    if (absDist < MIN_DRAG_DIST && !this.getDragState().hasExtraTranslation) {
      this.resetDrag();
      return;
    }

    if (this.store.draggable()) {
      this.suppressNextClick = true;
    }

    const isSwipe = duration < SWIPE_TIME_LIMIT && absDist > SWIPE_THRESHOLD;

    // Freemode specific
    if (this.store.freeMode() || this.store.navigateSlideBySlide()) {
      if (isSwipe) {
        this.physicsService.applyInertia(undefined, (translate) => {
          this.view.updateTransform(translate);
        });
        this.resetDrag();
        return;
      }
      if (
        this.getDragState().hasExtraTranslation &&
        !this.store.navigateSlideBySlide()
      ) {
        this.view.slideToNearest();
        this.resetDrag();
        return;
      }
      this.resetDrag();
      return;
    }

    const isRtl = this.store.isRtl
      ? this.store.isRtl()
      : this.store.state().direction === 'rtl';
    const swipeToLeft = dist < 0;

    // Swipe
    if (isSwipe && this.store.canSwipe()) {
      if (!isRtl) {
        swipeToLeft ? this.view.slideToNext() : this.view.slideToPrev();
      } else {
        swipeToLeft ? this.view.slideToPrev() : this.view.slideToNext();
      }
      this.resetDrag();
      return;
    }

    // CLassic translation
    if (this.store.draggable()) {
      this.view.slideToNearest();
    }
    this.resetDrag();
  }

  public handleClick(event: MouseEvent) {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    if (this.getDragState().hasMoved) {
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

    this.view.clickOnSlide(event);
  }

  public handleWheel(event: WheelEvent) {
    const mouseWheel = this.store.state().mouseWheel;
    if (!mouseWheel) {
      return;
    }
    let isWheel = false;
    if (mouseWheel === true || mouseWheel.horizontal) {
      isWheel = event.deltaX !== 0;
    }
    if (mouseWheel !== true && mouseWheel.vertical) {
      isWheel = event.deltaY !== 0;
    }
    if (isWheel) {
      event.preventDefault();
      this.store.patch({
        lastTranslate: this.store.currentTranslate(),
      });
      const deltaX = -(event.deltaX || event.deltaY) * this.sensitivity;
      this.followUserMove(deltaX, true);
    }
  }
}
