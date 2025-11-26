import { ElementRef } from '@angular/core';
import { CarouselStore } from './carousel.store';
import * as CalculationsHelper from './helpers/calculations.helper';
import { createSlideElement } from './helpers/tests/test.utils.helper';

describe('CarouselStore', () => {
  let store: CarouselStore;
  let consoleSpy: jest.SpyInstance;

  function setAllSlidesSize(fullWidth: number, scrollWidth: number) {
    const nativeElement = {
      clientWidth: fullWidth,
      scrollWidth,
    } as any;

    store.patch({
      allSlides: new ElementRef(nativeElement),
    });
  }

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    store = new CarouselStore();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('totalSlides', () => {
    it('should use slidesElements when slides() is empty', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(120),
        createSlideElement(80),
      ];

      store.patch({
        slidesElements,
        slides: [],
      });

      expect(store.totalSlides()).toBe(3);
    });

    it('should use slides() when there are slides declared', () => {
      store.patch({
        slides: [{}, {}, {}] as any,
        slidesElements: [createSlideElement(100)],
      });

      expect(store.totalSlides()).toBe(3);
    });
  });

  describe('minTranslate and maxTranslate', () => {
    it('calculate bounds without center', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        marginStart: 5,
        marginEnd: 10,
        center: false,
        notCenterBounds: false,
      });

      // width visible = 300, content = 900
      setAllSlidesSize(300, 900);

      // maxTranslate = - (scrollWidth - fullWidth) - marginEnd
      //              = - (900 - 300) - 10
      //              = - 600 - 10 = -610
      expect(store.maxTranslate()).toBe(-610);

      // minTranslate = marginStart (without center )
      expect(store.minTranslate()).toBe(5);
    });

    it('calculated bounds in center mode and notCenterBounds = false', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        marginStart: 0,
        marginEnd: 0,
        center: true,
        notCenterBounds: false,
      });

      // width visible = 300, centent = 900
      setAllSlidesSize(300, 900);

      const baseMax = -(900 - 300 - 0); // -(600) = -600
      const expectedMax = baseMax - 300 / 2 - 100 / 2; // -600 - 150 - 50 = -800
      const expectedMin = 300 / 2 - 100 / 2; // 150 - 50 = 100

      expect(store.maxTranslate()).toBe(expectedMax);
      expect(store.minTranslate()).toBe(expectedMin);
    });
  });

  describe('lastSlideAnchor', () => {
    it('returns totalSlides - 1 when loop = true', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        loop: true,
        center: false,
      });

      expect(store.totalSlides()).toBe(5);
      expect(store.lastSlideAnchor()).toBe(4);
    });

    it('center + notCenterBounds + slidesPerView numeric', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        loop: false,
        center: true,
        notCenterBounds: true,
        slidesPerView: 4, // nombre
      });

      // last = totalSlides - floor(slidesPerView / 2)
      //      = 5 - 2 = 3
      expect(store.lastSlideAnchor()).toBe(3);
    });

    it('center + notCenterBounds = false → last = totalSlides - 1', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        loop: false,
        center: true,
        notCenterBounds: false,
        slidesPerView: 3,
      });

      expect(store.lastSlideAnchor()).toBe(2);
    });

    it('not center + slidesPerView numeric', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        loop: false,
        center: false,
        slidesPerView: 3,
      });

      // last = totalSlides - slidesPerView
      //      = 5 - 3 = 2
      expect(store.lastSlideAnchor()).toBe(2);
    });

    it('non center + slidesPerView = auto, calcutate from width and fullWidth', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
        createSlideElement(100),
      ];

      store.patch({
        slidesElements,
        loop: false,
        center: false,
        slidesPerView: 'auto',
        marginEnd: 0,
      });

      // fullWidth = 250 → 3 slides from the end
      setAllSlidesSize(250, 500); // scrollWidth is not used in the calculation

      // loop in lastSlideAnchor:
      // index = 4, total=0   → total=100, count=1
      // index = 3, total=100 → total=200, count=2
      // index = 2, total=200 → total=300, count=3 (stop because 300 >= 250)
      // last = totalSlides - count + 1 = 5 - 3 + 1 = 3
      expect(store.lastSlideAnchor()).toBe(3);

      // firstSlideAnchor is 0 in this mode
      expect(store.firstSlideAnchor()).toBe(0);
      // so totalSlidesVisible = 3 - 0 + 1 = 4
      expect(store.totalSlidesVisible()).toBe(4);
    });
  });

  describe('firstSlideAnchor', () => {
    it('center + notCenterBounds + slidesPerView numeric → floor(slidesPerView / 2)', () => {
      store.patch({
        center: true,
        notCenterBounds: true,
        slidesPerView: 5,
      });

      // floor(5 / 2) = 2
      expect(store.firstSlideAnchor()).toBe(2);
    });

    it('no specific cas => 0', () => {
      store.patch({
        center: false,
        notCenterBounds: false,
        slidesPerView: 'auto',
      });

      expect(store.firstSlideAnchor()).toBe(0);
    });
  });

  describe('setCurrentPosition', () => {
    it('update currentPosition only if value changes', () => {
      // initial value = -1
      expect(store.currentPosition()).toBe(-1);

      store.setCurrentPosition(2);
      expect(store.currentPosition()).toBe(2);

      // re-set same value: should not patch
      const patchSpy = jest.spyOn<any, any>(store as any, 'patch');
      store.setCurrentPosition(2);
      expect(patchSpy).not.toHaveBeenCalled();

      patchSpy.mockRestore();
    });
  });

  describe('slidesWidths', () => {
    it('reads the width of slides via getBoundingClientRect', () => {
      const slidesElements = [createSlideElement(120), createSlideElement(80)];

      store.patch({ slidesElements });

      expect(store.slidesWidths()).toEqual([120, 80]);
    });

    it('ignore les éléments sans getBoundingClientRect', () => {
      const nativeElement = {} as any;
      const badSlide = new ElementRef(nativeElement);

      const slidesElements = [badSlide, createSlideElement(50)];

      store.patch({ slidesElements });

      expect(store.slidesWidths()).toEqual([50]);
    });
  });

  describe('fullWidth and scrollWidth', () => {
    function setAllSlidesSize(fullWidth: number, scrollWidth: number) {
      const nativeElement = {
        clientWidth: fullWidth,
        scrollWidth,
      } as any;

      store.patch({ allSlides: new ElementRef(nativeElement) });
    }

    it('fullWidth reads clientWidth from container', () => {
      setAllSlidesSize(300, 900);

      expect(store.fullWidth()).toBe(300);
    });

    it('scrollWidth reads scrollWidth from container', () => {
      setAllSlidesSize(400, 1200);

      // scrollWidth() forces also the read of slidesWidths
      expect(store.scrollWidth()).toBe(1200);
    });
  });

  describe('snapsDom', () => {
    it('generate a snapDom by slide with coherent domIndex and logicalIndex ', () => {
      const slidesElements = [createSlideElement(100), createSlideElement(150)];

      store.patch({
        slidesElements,
        slidesIndexOrder: [1, 0],
        marginStart: 0,
        marginEnd: 0,
        center: false,
        slidesPerView: 1,
      });

      const snaps = store.snapsDom();

      expect(snaps.length).toBe(2);

      expect(snaps[0].domIndex).toBe(0);
      expect(snaps[0].logicalIndex).toBe(1);

      expect(snaps[1].domIndex).toBe(1);
      expect(snaps[1].logicalIndex).toBe(0);
    });
  });

  describe('visibleDom', () => {
    it('delegated to extraVisibleSlides with right arguments', () => {
      const slidesElements = [createSlideElement(100), createSlideElement(100)];

      store.patch({
        slidesElements,
        slidesIndexOrder: [0, 1],
        marginStart: 0,
        marginEnd: 0,
        center: false,
        slidesPerView: 1,
        currentTranslate: -50,
      });

      const nativeElement = { clientWidth: 250 } as any;
      store.patch({ allSlides: new ElementRef(nativeElement) });

      const expectedSnaps = store.snapsDom();
      const expectedTranslate = store.currentTranslate();
      const expectedFullWidth = store.fullWidth();

      const spy = jest
        .spyOn(CalculationsHelper, 'extractVisibleSlides')
        .mockReturnValue([
          {
            domIndex: 0,
            logicalIndex: 0,
            left: 0,
            width: 100,
            translate: 0,
          },
        ]);

      const result = store.visibleDom();

      expect(result).toEqual([
        {
          domIndex: 0,
          logicalIndex: 0,
          left: 0,
          width: 100,
          translate: 0,
        },
      ]);

      expect(spy).toHaveBeenCalledWith(
        expectedSnaps,
        expectedTranslate,
        expectedFullWidth,
        undefined,
        false
      );

      spy.mockRestore();
    });
  });
});
