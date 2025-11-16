import { TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselStore } from '../carousel.store';
import { CAROUSEL_VIEW } from '../components/carousel/view-adapter';
import * as CalculationsHelper from '../helpers/calculations.helper';
import { SnapDom } from '../models/carousel.model';
import { CAROUSEL_SLIDE_CLASS } from '../models/carousel.model';

describe('CarouselLoopService', () => {
  let service: CarouselLoopService;
  let store: jest.Mocked<CarouselStore>;
  let state: any;
  let viewMock: { disableTransition: jest.Mock; updateTransform: jest.Mock };
  beforeEach(() => {
    // Mock du store
    const storeMock: Partial<jest.Mocked<CarouselStore>> = {
      state: jest.fn(() => state),
      visibleDom: jest.fn(),
      slidesIndexOrder: jest.fn(),
      slidesWidths: jest.fn(),
      slides: jest.fn(),
      totalSlides: jest.fn(),
      slideTranslates: jest.fn(),
      snapsDom: jest.fn(),
      currentTranslate: jest.fn(),
      lastTranslate: jest.fn(),
      patch: jest.fn(),
      allSlides: jest.fn(),
      center: jest.fn(),
    };

    // Mock de la vue
    viewMock = {
      disableTransition: jest.fn(),
      updateTransform: jest.fn(),
    };

    // Mock Renderer2 minimal
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
        { provide: CarouselStore, useValue: storeMock },
        { provide: Renderer2, useValue: rendererMock },
        { provide: CAROUSEL_VIEW, useValue: viewMock },
      ],
    });

    service = TestBed.inject(CarouselLoopService);
    store = TestBed.inject(CarouselStore) as jest.Mocked<CarouselStore>;

    // ⚙️ état de base cohérent
    const defaultSlidesOrder = [0, 1, 2, 3, 4];

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

    store.state.mockImplementation(() => state);
    store.slidesIndexOrder.mockReturnValue(defaultSlidesOrder);
    store.totalSlides.mockReturnValue(defaultSlidesOrder.length);
    store.slidesWidths.mockReturnValue(
      new Array(defaultSlidesOrder.length).fill(100)
    );
    store.slideTranslates.mockReturnValue(
      new Array(defaultSlidesOrder.length).fill(0)
    );
    store.currentTranslate.mockReturnValue(0);
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlides : sélection de la bonne stratégie
  // ---------------------------------------------------------------------------

  it('ne fait rien si loop est désactivé', () => {
    state.loop = false;
    store.visibleDom.mockReturnValue([
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ]);

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

  it('pour un move manuel (aucun param) appelle insertLoopSlidesByTranslation', () => {
    state.loop = true;
    store.visibleDom.mockReturnValue([
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ]);

    const spyTranslation = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesByTranslation'
    );

    service.insertLoopSlides();

    expect(spyTranslation).toHaveBeenCalled();
  });

  it('pour un clic direct sur une slide appelle insertLoopSlidesBySlidingTo', () => {
    state.loop = true;
    store.visibleDom.mockReturnValue([
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ]);

    const spySlideTo = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesBySlidingTo'
    );

    service.insertLoopSlides(3);

    expect(spySlideTo).toHaveBeenCalledWith(3);
  });

  it('pour une navigation prev/next appelle insertLoopSlidesByNavigation', () => {
    state.loop = true;
    store.visibleDom.mockReturnValue([
      { domIndex: 0, logicalIndex: 0 } as SnapDom,
    ]);

    const spyNav = jest.spyOn<any, any>(
      service as any,
      'insertLoopSlidesByNavigation'
    );

    service.insertLoopSlides(undefined, true);

    expect(spyNav).toHaveBeenCalledWith(true);
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlidesByNavigation : insère le bon nombre de slides avant/après
  // ---------------------------------------------------------------------------

  it('insertLoopSlidesByNavigation insère le bon nombre de slides avant', () => {
    // visibleDom : 0 à 1 → il n’y a rien avant
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
    store.visibleDom.mockReturnValue([leftmost, rightmost]);

    store.totalSlides.mockReturnValue(5);
    state.stepSlides = 3;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    // before = true → on regarde combien de slides on doit insérer avant
    (service as any).insertLoopSlidesByNavigation(true);

    // slidesAvailableBefore = 0, stepSlides = 3 → on doit insérer 3 fois
    expect(insertSpy).toHaveBeenCalledTimes(3);
    insertSpy.mockRestore();
  });

  it('insertLoopSlidesByNavigation insère le bon nombre de slides après', () => {
    // visibleDom : 2 à 3 sur totalSlides = 5
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
    store.visibleDom.mockReturnValue([leftmost, rightmost]);

    store.totalSlides.mockReturnValue(5);
    state.stepSlides = 3;

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    (service as any).insertLoopSlidesByNavigation(false);

    // slidesAvailableAfter = 5 - 3 - 1 = 1
    // stepSlides = 3 → on doit insérer 2 fois
    expect(insertSpy).toHaveBeenCalledTimes(2);
    insertSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // insertLoopSlidesBySlidingTo : clic direct slide
  // ---------------------------------------------------------------------------

  it('insertLoopSlidesBySlidingTo ne fait rien si translateDiff < 1', () => {
    store.slideTranslates.mockReturnValue([0, 0]);
    store.currentTranslate.mockReturnValue(0);
    state.fullWidth = 300;

    const extractSpy = jest.spyOn(CalculationsHelper, 'extractVisibleSlides');

    (service as any).insertLoopSlidesBySlidingTo(0);

    expect(extractSpy).not.toHaveBeenCalled();
    extractSpy.mockRestore();
  });

  it('insertLoopSlidesBySlidingTo insère des slides quand l’espace visible est plus petit que fullWidth', () => {
    store.slideTranslates.mockReturnValue([100]);
    store.currentTranslate.mockReturnValue(0);
    store.totalSlides.mockReturnValue(5);
    state.fullWidth = 300;
    state.spaceBetween = 10;

    const snaps: SnapDom[] = []; // pas utilisé grâce au mock
    store.snapsDom.mockReturnValue(snaps);

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
    expect(extractSpy).toHaveBeenCalledWith(
      snaps,
      0,
      state.fullWidth,
      -100,
      undefined
    );

    // offset = fullWidth - visibleSpan
    // visibleSpan = 200 → offset = 100
    // Chaque insertion "prend" width + spaceBetween = 80 + 10 = 90
    // → 2 appels pour couvrir ~100
    expect(insertSpy).toHaveBeenCalledTimes(2);

    insertSpy.mockRestore();
    extractSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // initializeLoopCenter : pré-remplit le DOM autour de l’initialSlide en mode center
  // ---------------------------------------------------------------------------

  it('initializeLoopCenter ne fait rien si loop ou center sont désactivés', () => {
    state.loop = false;
    state.center = true;
    store.totalSlides.mockReturnValue(5);
    store.slidesWidths.mockReturnValue([100, 100, 100]);
    store.state.mockReturnValue(state);

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    service.initializeLoopCenter();

    expect(insertSpy).not.toHaveBeenCalled();
    insertSpy.mockRestore();
  });

  it('initializeLoopCenter insère des slides avant pour centrer l’initialSlide', () => {
    state.loop = true;
    state.center = true;
    state.fullWidth = 300;
    state.marginStart = 0;
    state.initialSlide = 0;
    state.spaceBetween = 10;
    store.totalSlides.mockReturnValue(5);
    store.slidesWidths.mockReturnValue([100, 100, 100, 100, 100]);

    store.state.mockReturnValue(state);

    const insertSpy = jest
      .spyOn<any, any>(service as any, 'insertElement')
      .mockReturnValue({ width: 80, offset: 0 });

    service.initializeLoopCenter();

    // spaceToFill = fullWidth / 2 - initialSlideWidth / 2 - marginStart
    //             = 150 - 50 - 0 = 100
    // widthFilled += width + spaceBetween = 80 + 10 = 90 → deux tours
    expect(insertSpy).toHaveBeenCalledTimes(2);
    insertSpy.mockRestore();
  });

  describe('insertElement (cohérence de l’ordre et invariants)', () => {
    /**
     * Prépare un container DOM avec 4 slides .CAROUSEL_SLIDE_CLASS
     * afin que extractSlidesFromContainer trouve des éléments valides.
     */
    function setupDomForInsert(slidesCount = 4): void {
      const container = document.createElement('div');

      for (let i = 0; i < slidesCount; i++) {
        const slide = document.createElement('div');
        slide.classList.add(CAROUSEL_SLIDE_CLASS);
        container.appendChild(slide);
      }

      // allSlides() doit renvoyer ce container
      store.allSlides.mockReturnValue({
        nativeElement: container,
      });

      // Largeurs “logiques” des slides
      store.slidesWidths.mockReturnValue(new Array(slidesCount).fill(100));
      store.totalSlides.mockReturnValue(slidesCount);
      store.currentTranslate.mockReturnValue(0);
      store.lastTranslate.mockReturnValue(0);
    }

    it('insérer avant modifie l’ordre mais conserve la même permutation des slides', () => {
      // ordre logique initial
      let slidesOrder = [0, 1, 2, 3];

      store.slidesIndexOrder.mockImplementation(() => slidesOrder);

      // patch met à jour l’ordre courant utilisé par le service
      (store.patch as jest.Mock).mockImplementation((partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
        // on ignore les autres champs pour ce test
      });

      setupDomForInsert(4);

      const inserted = (service as any).insertElement(true); // insertion "before"

      expect(inserted).toBeTruthy();

      // 1) Toujours le même nombre de slides
      expect(slidesOrder.length).toBe(4);

      // 2) Pas de doublon / pas de perte : même ensemble d’indexes
      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);

      // 3) L’ordre a bien changé (sinon l’insertion ne sert à rien)
      expect(slidesOrder).not.toEqual([0, 1, 2, 3]);
    });

    it('insérer après modifie aussi l’ordre en conservant la permutation', () => {
      let slidesOrder = [0, 1, 2, 3];

      store.slidesIndexOrder.mockImplementation(() => slidesOrder);

      (store.patch as jest.Mock).mockImplementation((partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
      });

      setupDomForInsert(4);

      const inserted = (service as any).insertElement(false); // insertion "after"

      expect(inserted).toBeTruthy();
      expect(slidesOrder.length).toBe(4);

      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);
      expect(slidesOrder).not.toEqual([0, 1, 2, 3]);
    });

    it('après plusieurs insertions, slidesIndexOrder reste toujours une permutation valide', () => {
      let slidesOrder = [0, 1, 2, 3];

      store.slidesIndexOrder.mockImplementation(() => slidesOrder);

      (store.patch as jest.Mock).mockImplementation((partial: any) => {
        if (partial.slidesIndexOrder) {
          slidesOrder = partial.slidesIndexOrder;
        }
      });

      setupDomForInsert(4);

      // On simule plusieurs insertions avant/après comme en vrai loop
      for (let i = 0; i < 5; i++) {
        (service as any).insertElement(i % 2 === 0); // true, false, true, ...
      }

      // Toujours le même nombre d’éléments
      expect(slidesOrder.length).toBe(4);

      // Toujours la même permutation de base
      const sorted = [...slidesOrder].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);
    });
  });
});
