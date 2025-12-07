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
  lastMain: number;
  currentMain: number;
  lastMoveTime: number;
  lastClickTime: number;
  lastMainPosition: number;
  lockedAxis: 'main' | 'cross' | null;
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
    main: number;
    cross: number;
    time: number;
    event?: MouseEvent | TouchEvent;
  } = { main: 0, cross: 0, time: 0 };

  private dragState = signal<DragState>({
    isDragging: false,
    hasMoved: false,
    hasExtraTranslation: false,
    lastMain: 0,
    currentMain: 0,
    lastMoveTime: 0,
    lastClickTime: 0,
    lastMainPosition: 0,
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
   * @param deltaMain
   * @param noExtraTranslation
   * @param mainPosition
   */
  public followUserMove(
    deltaMain: number,
    noExtraTranslation = false,
    mainPosition?: number
  ) {
    const effectiveDeltaMain = this.store.isRtl() ? -deltaMain : deltaMain;

    let newTranslate =
      this.store.currentTranslate() + effectiveDeltaMain / this.sensitivity;

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
          (effectiveDeltaMain / this.sensitivity) * this.velocityBounds;
      }
    } else {
      this.dragState.update((state) => ({
        ...state,
        hasExtraTranslation: false,
      }));
    }

    this.updatePositionOnMouseMove(newTranslate, mainPosition);
  }

  /**
   * Update current translate and apply transform CSS.
   * @param newTranslate
   * @param mainPosition
   */
  private updatePositionOnMouseMove(
    newTranslate: number,
    mainPosition?: number
  ) {
    const rawVelocity = mainPosition
      ? (mainPosition - this.dragState().lastMainPosition) *
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
    const main = this.store.axisConf().pointerMainPos({ x, y });
    const cross = this.store.axisConf().pointerCrossPos({ x, y });

    const now = Date.now();
    const gestureStart = this.gestureStart;
    // Determine threshold for mobile scroll on page while sliding.
    const AXIS_LOCK_THRESHOLD = 8;

    if (isTouch && gestureStart) {
      const { lockedAxis } = dragState;

      if (!lockedAxis) {
        const deltaMain = main - gestureStart.main;
        const deltaCross = cross - gestureStart.cross;
        const absDeltaMain = Math.abs(deltaMain);
        const absDeltaCross = Math.abs(deltaCross);

        // Too little gesture to decide.
        if (
          absDeltaMain < AXIS_LOCK_THRESHOLD &&
          absDeltaCross < AXIS_LOCK_THRESHOLD
        ) {
          return;
        }

        if (absDeltaMain >= absDeltaCross) {
          this.updateDragState({ lockedAxis: 'main' });
        } else {
          // Cross gesture => no drag
          this.resetDrag();
          return;
        }

        // Main gesture.
        this.updateDragState({ lockedAxis: 'main' });
      } else if (lockedAxis === 'cross') {
        return;
      }
    }

    // For mouse.
    if (!isTouch && dragState.lockedAxis !== 'main') {
      this.updateDragState({ lockedAxis: 'main' });
    }

    if (this.getDragState().lockedAxis !== 'main') {
      return;
    }

    if (isTouch) {
      event.preventDefault();
    }

    const deltaMain = (main - dragState.currentMain) * this.sensitivity;

    const currentState = this.getDragState();
    this.updateDragState({
      hasMoved: true,
      lastMoveTime: now,
      currentMain: currentState.currentMain + deltaMain,
      lastMainPosition:
        now - currentState.lastMoveTime > 50
          ? main
          : currentState.lastMainPosition,
    });

    if (this.shouldStartDrag(gestureStart.event ?? event)) {
      this.followUserMove(deltaMain, false, main);
    }
  }

  public handleStart(event: MouseEvent | TouchEvent) {
    const position = getPointerPosition(event);

    const main = this.store.axisConf().pointerMainPos(position);
    const cross = this.store.axisConf().pointerCrossPos(position);

    this.gestureStart = {
      main,
      cross,
      time: Date.now(),
      event,
    };

    this.store.patch({ lastTranslate: this.store.currentTranslate() });

    this.updateDragState({
      isDragging: true,
      hasMoved: false,
      hasExtraTranslation: false,
      currentMain: main,
      lastMainPosition: main,
      lastClickTime: new Date().getTime(),
      lockedAxis: null,
    });
  }

  public handleEnd(event: MouseEvent | TouchEvent) {
    if (!this.getDragState().isDragging) {
      return;
    }

    const { x, y } = getPointerPosition(event);
    const main = this.store.axisConf().pointerMainPos({ x, y });

    const timeEnd = Date.now();

    const dist = main - this.gestureStart.main;
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

    const swipeToLeft = dist < 0;

    // Swipe
    if (isSwipe && this.store.canSwipe()) {
      if (!this.store.isRtl()) {
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

    const deltaMain =
      this.store.axisConf().mouseMainPos(event) - this.gestureStart.main;
    const deltaCross =
      this.store.axisConf().mouseCrossPos(event) - this.gestureStart.cross;
    const dist = Math.hypot(deltaMain, deltaCross);
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
    const wheelAllowed =
      mouseWheel === true ||
      (this.store.isVertical() && mouseWheel.vertical) ||
      (!this.store.isVertical() && mouseWheel.horizontal);
    if (!wheelAllowed) {
      return;
    }
    const delta = this.store.axisConf().wheelMainDelta(event);
    if (!delta) {
      return;
    }

    event.preventDefault();
    this.store.patch({
      lastTranslate: this.store.currentTranslate(),
    });
    const deltaMain = -delta * this.sensitivity;
    this.followUserMove(deltaMain, true);
  }
}
