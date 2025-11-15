import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { extractVisibleSlides } from '../helpers/calculations.helper';
import { CAROUSEL_SLIDE_CLASS, SnapDom } from '../models/carousel.model';
import { extractSlidesFromContainer } from '../helpers/dom.helper';
import { positiveModulo } from '../helpers/utils.helper';

@Injectable()
export class CarouselLoopService {
  private store = inject(CarouselStore);
  private renderer = inject(Renderer2);
  private injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }
  constructor() {}

  private get firstVisibleSlide() {
    return this.store.visibleDom()?.[0];
  }
  private get lastVisibleSlide() {
    return this.store.visibleDom()?.[this.store.visibleDom().length - 1];
  }

  private insertElement(before = true) {
    const slides = extractSlidesFromContainer(this.store.allSlides());

    const container = this.store.allSlides()?.nativeElement;
    const indexToInsert = before ? this.store.slides().length - 1 : 0;
    const index = this.store.slidesIndexOrder()[indexToInsert];
    const width = this.store.slidesWidths()[index];
    const elementToInsert = slides[indexToInsert] as HTMLElement | undefined;

    if (!elementToInsert) {
      return undefined;
    }

    if (before) {
      const firstReal = container.querySelector(
        '.' + CAROUSEL_SLIDE_CLASS
      ) as HTMLElement | null;
      if (!firstReal) {
        return undefined;
      }
      try {
        container.removeChild(elementToInsert);
        container.insertBefore(elementToInsert, firstReal);
      } catch (e) {
        container.insertBefore(elementToInsert, firstReal);
      }
    } else {
      container.appendChild(elementToInsert);
    }

    const slidesIndexOrder = this.store.slidesIndexOrder();

    const value = (
      before ? slidesIndexOrder.pop() : slidesIndexOrder.shift()
    ) as number;
    this.store.patch({
      slidesIndexOrder: before
        ? [value, ...slidesIndexOrder]
        : [...slidesIndexOrder, value],
    });

    const offset = before
      ? -this.store.slidesWidths()[value] - this.store.state().spaceBetween
      : this.store.slidesWidths()[value] + this.store.state().spaceBetween;

    this.applyTranslate(this.store.currentTranslate() + offset);

    this.store.patch({
      lastTranslate: this.store.lastTranslate() + offset,
    });

    return { width, offset };
  }

  /**
   * When moving slides manually.
   * @todo handle next
   */
  private insertLoopSlidesByTranslation() {
    const leftmostDom = this.firstVisibleSlide;
    const order = this.store.slidesIndexOrder();
    const realLeftPos = order.indexOf(leftmostDom.logicalIndex);
    const movedLeft =
      realLeftPos === 0 &&
      leftmostDom.translate < this.store.currentTranslate();
    if (movedLeft) {
      this.insertElement(true);
    }
  }

  /**
   * By prev or next button. Handle stepslides.
   * @param before
   */
  private insertLoopSlidesByNavigation(before = true) {
    const leftmostDom = this.firstVisibleSlide;
    const rightmostDom = this.lastVisibleSlide;
    const leftMostIndex = leftmostDom.domIndex;
    const rightMostIndex = rightmostDom.domIndex;
    const slidesAvailableBefore = leftMostIndex;
    const slidesAvailableAfter = this.store.totalSlides() - rightMostIndex - 1;

    if (
      before === true &&
      slidesAvailableBefore < this.store.state().stepSlides
    ) {
      const slidesToInsertBefore =
        this.store.state().stepSlides - slidesAvailableBefore;

      for (let i = 1; i <= slidesToInsertBefore; i++) {
        this.insertElement(before);
      }
    }
    if (
      before === false &&
      slidesAvailableAfter < this.store.state().stepSlides
    ) {
      const slidesToInsertAfter =
        this.store.state().stepSlides - slidesAvailableAfter;

      for (let i = 1; i <= slidesToInsertAfter; i++) {
        this.insertElement(before);
      }
    }
  }

  /**
   * Direct click on slide.
   * @param indexSlided
   */
  private insertLoopSlidesBySlidingTo(indexSlided: number) {
    const state = this.store.state();
    const futureTranslate = this.store.slideTranslates()[indexSlided];
    const currentTranslate = this.store.currentTranslate();
    const translateDiff = Math.abs(currentTranslate - futureTranslate);

    if (translateDiff < 1) {
      return;
    }

    const modifiedVisibleDoms = extractVisibleSlides(
      this.store.snapsDom(),
      currentTranslate,
      state.fullWidth,
      translateDiff
    );

    if (!modifiedVisibleDoms.length) {
      return;
    }

    const leftmostDom = modifiedVisibleDoms[0];
    const rightmostDom = modifiedVisibleDoms[modifiedVisibleDoms.length - 1];

    const leftEdge = leftmostDom.translate;
    const rightEdge = rightmostDom.translate + rightmostDom.width;
    const visibleSpan = Math.abs(rightEdge - leftEdge);

    const offset = state.fullWidth - visibleSpan;
    if (offset <= 0) {
      return;
    }

    const insertElement = (before = true) => {
      let mainOffset = offset;
      const firstInserted = this.insertElement(before);

      if (firstInserted) {
        mainOffset -= firstInserted.width + state.spaceBetween;

        let stop = false;
        while (mainOffset > 0 && !stop) {
          const inserted = this.insertElement(before);
          if (!inserted) {
            stop = true;
            continue;
          }
          mainOffset -= inserted.width + state.spaceBetween;
        }
      }
    };

    const shouldInsertBefore = leftmostDom.domIndex === 0;
    const shouldInsertAfter =
      rightmostDom.domIndex >= this.store.totalSlides() - 1;

    if (shouldInsertBefore) {
      insertElement(true);
    }

    if (shouldInsertAfter) {
      insertElement(false);
    }
  }

  /**
   * Determine if we must insert slide before or after.
   * 3 cases :
   * - From prev next action : insert as many slides as necessary (by step)
   * - From click on slide : insert as many slides as necessary (by space)
   * - From manual move : insert one slide at start or end
   * @returns
   */
  public insertLoopSlides(
    indexSlided: number | undefined = undefined,
    before?: boolean
  ) {
    if (!this.store.state().loop) {
      return;
    }

    if (this.store.visibleDom().length === 0) {
      return;
    }

    // By manuel move.
    if (indexSlided === undefined && before === undefined) {
      this.insertLoopSlidesByTranslation();
      return;
    }

    // We slide to specific slide so we need to guess the future state of translation.
    if (indexSlided !== undefined) {
      this.insertLoopSlidesBySlidingTo(indexSlided);
      return;
    }

    // By clicking next or prev.
    this.insertLoopSlidesByNavigation(before);
  }

  private forceReflow() {
    const rect = this.store
      .state()
      .allSlides?.nativeElement?.getBoundingClientRect?.();
  }

  private applyTranslate(translate: number) {
    this.view.disableTransition();
    this.view.updateTransform(translate, false, true);
    this.forceReflow();
  }

  /**
   * Pre-populates the DOM for loop mode on initialization.
   * This is crucial for modes like 'center' to work from the start,
   * by ensuring the initial slide has slides before it in the DOM.
   */
  public initializeLoopCenter(): void {
    const state = this.store.state();

    if (!state.loop || !state.center) {
      return;
    }

    const totalSlides = this.store.totalSlides();
    if (totalSlides === 0 || !state.allSlides) {
      return;
    }

    const initialSlideWidth =
      this.store.slidesWidths()[state.initialSlide] ?? 0;
    const spaceToFill =
      state.fullWidth / 2 - initialSlideWidth / 2 - state.marginStart;

    if (spaceToFill <= 0) {
      return;
    }

    let widthFilled = 0;
    let slidesInserted = 0;

    while (widthFilled < spaceToFill && slidesInserted < totalSlides - 1) {
      const inserted = this.insertElement(true);

      if (inserted) {
        widthFilled += inserted.width + state.spaceBetween;
      }
      slidesInserted++;
    }
  }
}
