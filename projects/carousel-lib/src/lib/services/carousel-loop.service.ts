import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { extractVisibleSlides } from '../helpers/calculations.helper';
import { CAROUSEL_SLIDE_CLASS } from '../models/carousel.model';
import { extractSlidesFromContainer } from '../helpers/dom.helper';

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
      ? this.store.currentTranslate() -
        this.store.slidesWidths()[value] -
        this.store.state().spaceBetween
      : this.store.currentTranslate() +
        this.store.slidesWidths()[value] +
        this.store.state().spaceBetween;
    this.applyTranslate(offset);

    this.store.patch({
      lastTranslate: before
        ? this.store.lastTranslate() - offset
        : this.store.lastTranslate() + offset,
    });

    return { width, offset };
  }

  /**
   * Determine if we must insert slide before or after.
   * We force detection when directy selecting a slide.
   * When clicking on slide (or jumping) we might need to insert several slides.
   * @param before
   * @returns
   */
  public insertLoopSlides(
    force = false,
    indexSlided: number | undefined = undefined
  ) {
    if (!this.store.state().loop) {
      return;
    }

    if (this.store.visibleDom().length === 0) {
      return;
    }

    let leftmostDom = this.firstVisibleSlide;
    let rightmostDom = this.lastVisibleSlide;

    // We slide to specific slide so we need to guess the future state of translation.
    if (indexSlided !== undefined) {
      const futureTranslate = this.store.slideTranslates()[indexSlided]; //- this.slidesWidths[indexSlided];
      const translateDiff = Math.abs(
        this.store.currentTranslate() - futureTranslate
      );

      console.log(
        '==> future translate',
        futureTranslate,
        ' with diff ',
        translateDiff
      );
      const modifiedVisibleDoms = extractVisibleSlides(
        this.store.snapsDom(),
        this.store.currentTranslate(),
        this.store.state().fullWidth,
        translateDiff
      );

      leftmostDom = modifiedVisibleDoms[0];
      rightmostDom = modifiedVisibleDoms[modifiedVisibleDoms.length - 1];
      console.log('modifierjdiejd', leftmostDom, rightmostDom);
    }

    const spaceBetweenVisibleSlides = Math.abs(
      leftmostDom.translate - rightmostDom.translate
    );
    const offset = this.store.state().fullWidth - spaceBetweenVisibleSlides;

    const realLeftPosition = this.store
      .slidesIndexOrder()
      .indexOf(leftmostDom.logicalIndex);
    const realRightPosition = this.store
      .slidesIndexOrder()
      .indexOf(rightmostDom.logicalIndex);

    console.log(
      'spaaaaaace,',
      leftmostDom,
      rightmostDom,
      spaceBetweenVisibleSlides,
      offset,
      realLeftPosition,
      realRightPosition
    );

    const shouldInsertBefore =
      realLeftPosition === 0 &&
      (leftmostDom.translate < this.store.currentTranslate() || force);
    const shouldInsertAfter =
      realRightPosition === this.store.slidesIndexOrder().length - 1;
    // &&
    // (rightmostDom.translate + this.fullWidth > this.currentTranslate ||
    //   force);

    if (!shouldInsertAfter && !shouldInsertBefore) {
      return;
    }

    const insertElement = (before = true) => {
      let mainOffset = offset;
      const inserted = this.insertElement(before);
      if (inserted) {
        mainOffset -= inserted.width;

        let stop = false;
        while (mainOffset > 0 && !stop) {
          const inserted = this.insertElement(before);
          if (inserted === undefined) {
            stop = true;
            continue;
          }
          mainOffset -= inserted.width;
        }
      }
    };

    if (shouldInsertBefore) {
      insertElement();
    }

    if (shouldInsertAfter) {
      insertElement(false);
    }
  }

  private forceReflow() {
    const rect = this.store
      .state()
      .allSlides?.nativeElement?.getBoundingClientRect?.();
  }

  private applyTranslate(translate: number) {
    this.renderer.setStyle(
      this.store.allSlides()?.nativeElement,
      'transition-duration',
      `0s`
    );
    this.view.updateTransform(translate, false);
    this.forceReflow();
  }
}
