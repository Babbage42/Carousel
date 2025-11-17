import { TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselStore } from '../carousel.store';
import { CAROUSEL_VIEW } from '../components/carousel/view-adapter';
import * as CalculationsHelper from '../helpers/calculations.helper';
import { SnapDom } from '../models/carousel.model';
import { CAROUSEL_SLIDE_CLASS } from '../models/carousel.model';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';

describe('CarouselLoopService', () => {
  let service: CarouselLoopService;
  let store: CarouselStoreFake;
  let viewMock: { disableTransition: jest.Mock; updateTransform: jest.Mock };
  let state: any;

  beforeEach(() => {
    store = new CarouselStoreFake();

    // vue mockée
    viewMock = {
      disableTransition: jest.fn(),
      updateTransform: jest.fn(),
    };

    // Renderer2 minimal
    const rendererMock: Partial<Renderer2> = {
      removeChild: jest.fn(),
      insertBefore: jest.fn(),
      appendChild: jest.fn(),
      setStyle: jest.fn(),
      addClass: jest.fn(),
      removeClass: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CarouselLoopService,
        { provide: CarouselStore, useValue: store },
        { provide: Renderer2, useValue: rendererMock },
        { provide: CAROUSEL_VIEW, useValue: viewMock },
      ],
    });

    service = TestBed.inject(CarouselLoopService);

    const defaultSlidesOrder = [0, 1, 2, 3, 4];

    // état global simulé (on garde le pattern avec un objet `state`)
    state = {
      loop: true,
      center: false,
      fullWidth: 300,
      marginStart: 0,
      spaceBetween: 10,
      stepSlides: 2,
      initialSlide: 0,
      allSlides: { nativeElement: {} },
    };

    // on remplace la méthode state() du fake par notre objet
    (store as any).state = () => state;

    // valeurs par défaut pour le fake
    if ((store as any).setSlidesIndexOrder) {
      (store as any).setSlidesIndexOrder(defaultSlidesOrder);
    }
    if ((store as any).setTotalSlides) {
      (store as any).setTotalSlides(defaultSlidesOrder.length);
    }
    if ((store as any).setSlidesWidths) {
      (store as any).setSlidesWidths(
        new Array(defaultSlidesOrder.length).fill(100)
      );
    }
    if ((store as any).setSlideTranslates) {
      (store as any).setSlideTranslates(
        new Array(defaultSlidesOrder.length).fill(0)
      );
    }
    if ((store as any).setCurrentTranslate) {
      (store as any).setCurrentTranslate(0);
    }
    if ((store as any).setAllSlides) {
      (store as any).setAllSlides({ nativeElement: {} } as any);
    }

    // pour les méthodes que le service appelle mais que le fake n'implémente
    // pas encore, on ajoute des impls simples si besoin
    if (!(store as any).patch) {
      (store as any).patch = (_: any) => {};
    }
    if (!(store as any).snapsDom) {
      (store as any).snapsDom = () => [];
    }
    if (!(store as any).visibleDom) {
      (store as any).visibleDom = () => [];
    }
    if (!(store as any).slidesIndexOrder) {
      (store as any).slidesIndexOrder = () => defaultSlidesOrder;
    }
    if (!(store as any).slidesWidths) {
      (store as any).slidesWidths = () =>
        new Array(defaultSlidesOrder.length).fill(100);
    }
    if (!(store as any).slideTranslates) {
      (store as any).slideTranslates = () => [0];
    }
    if (!(store as any).currentTranslate) {
      (store as any).currentTranslate = () => 0;
    }
    if (!(store as any).lastTranslate) {
      (store as any).lastTranslate = () => 0;
    }
    if (!(store as any).center) {
      (store as any).center = () => state.center;
    }
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlides : strategy selection
  // ---------------------------------------------------------------------------

  it('should do nothing when loop is disabled', () => {
    state.loop = false;
    (store as any).visibleDom = () => [
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ];

    const spyTranslation = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesByTranslation'
    );
    const spyNav = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesByNavigation'
    );
    const spySlideTo = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesBySlidingTo'
    );

    service.insertLoopSlides();

    expect(spyTranslation).not.toHaveBeenCalled();
    expect(spyNav).not.toHaveBeenCalled();
    expect(spySlideTo).not.toHaveBeenCalled();
  });

  it('should call insertLoopSlidesByTranslation for manual move (no params)', () => {
    state.loop = true;
    (store as any).visibleDom = () => [
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ];

    const spyTranslation = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesByTranslation'
    );

    service.insertLoopSlides();

    expect(spyTranslation).toHaveBeenCalled();
  });

  it('should call insertLoopSlidesBySlidingTo for direct click on a slide', () => {
    state.loop = true;
    (store as any).visibleDom = () => [
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ];

    const spySlideTo = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesBySlidingTo'
    );

    service.insertLoopSlides(3);

    expect(spySlideTo).toHaveBeenCalledWith(3);
  });

  it('should call insertLoopSlidesByNavigation for prev/next navigation', () => {
    state.loop = true;
    (store as any).visibleDom = () => [
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ];

    const spyNav = jest
      .spyOn<any, any>(service as any, 'insertLoopSlidesByNavigation')
      // ✅ on NE VEUT PAS exécuter la vraie méthode ici
      // pour éviter d’aller dans insertElement → DOM → querySelectorAll
      .mockImplementation(() => {});

    service.insertLoopSlides(undefined, true);

    expect(spyNav).toHaveBeenCalledWith(true);
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlidesByNavigation : insert correct number of slides before/after
  // ---------------------------------------------------------------------------

  it('insertLoopSlidesByNavigation should insert the correct number of slides before', () => {
    const leftmost: SnapDom = {
      domIndex: 0,
      logicalIndex: 0,
      translate: 0,
      width: 100,
      left: 0,
    };
    const rightmost: SnapDom = {
      domIndex: 1,
      logicalIndex: 1,
      translate: 100,
      width: 100,
      left: 0,
    };

    (store as any).visibleDom = () => [leftmost, rightmost];
    (store as any).totalSlides = () => 5;
    state.stepSlides = 3;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    (service as any).insertLoopSlidesByNavigation(true);

    expect(insertSpy).toHaveBeenCalledTimes(3);
    insertSpy.mockRestore();
  });

  it('insertLoopSlidesByNavigation should insert the correct number of slides after', () => {
    const leftmost: SnapDom = {
      domIndex: 2,
      logicalIndex: 2,
      translate: 200,
      width: 100,
      left: 0,
    };
    const rightmost: SnapDom = {
      domIndex: 3,
      logicalIndex: 3,
      translate: 300,
      width: 100,
      left: 0,
    };

    (store as any).visibleDom = () => [leftmost, rightmost];
    (store as any).totalSlides = () => 5;
    state.stepSlides = 3;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    (service as any).insertLoopSlidesByNavigation(false);

    expect(insertSpy).toHaveBeenCalledTimes(2);
    insertSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlidesBySlidingTo : direct slide click
  // ---------------------------------------------------------------------------

  it('insertLoopSlidesBySlidingTo should do nothing if translateDiff < 1', () => {
    (store as any).slideTranslates = () => [0, 0];
    (store as any).currentTranslate = () => 0;
    state.fullWidth = 300;

    const extractSpy = jest.spyOn(CalculationsHelper, 'extractVisibleSlides');

    (service as any).insertLoopSlidesBySlidingTo(0);

    expect(extractSpy).not.toHaveBeenCalled();
    extractSpy.mockRestore();
  });

  it('insertLoopSlidesBySlidingTo should insert slides when visible space is smaller than fullWidth', () => {
    (store as any).slideTranslates = () => [100];
    (store as any).currentTranslate = () => 0;
    (store as any).totalSlides = () => 5;
    state.fullWidth = 300;
    state.spaceBetween = 10;

    const snaps: SnapDom[] = [];
    (store as any).snapsDom = () => snaps;
    (store as any).center = () => false;

    const extractSpy = jest
      .spyOn(CalculationsHelper, 'extractVisibleSlides')
      .mockReturnValue([
        {
          domIndex: 0,
          logicalIndex: 0,
          translate: 0,
          width: 100,
          left: 0,
        },
        {
          domIndex: 1,
          logicalIndex: 1,
          translate: 100,
          width: 100,
          left: 0,
        },
      ]);

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    (service as any).insertLoopSlidesBySlidingTo(0);

    // translateDiff = 0 - 100 = -100
    // ✅ la vraie implé appelle : extractVisibleSlides(snaps, 0, fullWidth, -100, this.store.center())
    expect(extractSpy).toHaveBeenCalledWith(
      snaps,
      0,
      state.fullWidth,
      -100,
      false // ⬅️ correction : c'est false, pas undefined
    );

    expect(insertSpy).toHaveBeenCalledTimes(2);

    insertSpy.mockRestore();
    extractSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // initializeLoopCenter : pre-fill DOM around initialSlide in center mode
  // ---------------------------------------------------------------------------

  it('initializeLoopCenter should do nothing when loop or center are disabled', () => {
    state.loop = false;
    state.center = true;
    (store as any).totalSlides = () => 5;
    (store as any).slidesWidths = () => [100, 100, 100];
    (store as any).state = () => state;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    service.initializeLoopCenter();

    expect(insertSpy).not.toHaveBeenCalled();
    insertSpy.mockRestore();
  });

  it('initializeLoopCenter should insert slides before to center the initial slide', () => {
    state.loop = true;
    state.center = true;
    state.fullWidth = 300;
    state.marginStart = 0;
    state.initialSlide = 0;
    state.spaceBetween = 10;

    (store as any).totalSlides = () => 5;
    (store as any).slidesWidths = () => [100, 100, 100, 100, 100];
    (store as any).state = () => state;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    service.initializeLoopCenter();

    expect(insertSpy).toHaveBeenCalledTimes(2);
    insertSpy.mockRestore();
  });

  describe('insertElement (order consistency and invariants)', () => {
    function setupDomForInsert(slidesCount = 4): void {
      const container = document.createElement('div');

      for (let i = 0; i < slidesCount; i++) {
        const slide = document.createElement('div');
        slide.classList.add(CAROUSEL_SLIDE_CLASS);
        container.appendChild(slide);
      }

      if ((store as any).setAllSlides) {
        (store as any).setAllSlides({ nativeElement: container } as any);
      } else {
        (store as any).allSlides = () => ({ nativeElement: container } as any);
      }

      if ((store as any).setSlidesWidths) {
        (store as any).setSlidesWidths(new Array(slidesCount).fill(100));
      } else {
        (store as any).slidesWidths = () => new Array(slidesCount).fill(100);
      }

      if ((store as any).setTotalSlides) {
        (store as any).setTotalSlides(slidesCount);
      } else {
        (store as any).totalSlides = () => slidesCount;
      }

      (store as any).currentTranslate = () => 0;
      (store as any).lastTranslate = () => 0;
    }

    it('inserting before should change order while keeping the same permutation of slides', () => {
      let slidesOrder = [0, 1, 2, 3];

      (store as any).slidesIndexOrder = () => slidesOrder;

      (store as any).patch = (partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
      };

      setupDomForInsert(4);

      const inserted = (service as any).insertElement(true);

      expect(inserted).toBeTruthy();

      expect(slidesOrder.length).toBe(4);

      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);

      expect(slidesOrder).not.toEqual([0, 1, 2, 3]);
    });

    it('inserting after should also change order while keeping the permutation', () => {
      let slidesOrder = [0, 1, 2, 3];

      (store as any).slidesIndexOrder = () => slidesOrder;

      (store as any).patch = (partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
      };

      setupDomForInsert(4);

      const inserted = (service as any).insertElement(false);

      expect(inserted).toBeTruthy();
      expect(slidesOrder.length).toBe(4);

      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);
      expect(slidesOrder).not.toEqual([0, 1, 2, 3]);
    });

    it('after multiple insertions, slidesIndexOrder should always remain a valid permutation', () => {
      let slidesOrder = [0, 1, 2, 3];

      (store as any).slidesIndexOrder = () => slidesOrder;

      (store as any).patch = (partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
      };

      setupDomForInsert(4);

      for (let i = 0; i < 5; i++) {
        (service as any).insertElement(i % 2 === 0);
      }

      expect(slidesOrder.length).toBe(4);

      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);
    });
  });
});
