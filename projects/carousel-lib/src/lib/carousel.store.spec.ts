import { ElementRef } from '@angular/core';
import { CarouselStore } from './carousel.store';
import * as CalculationsHelper from './helpers/calculations.helper';

describe('CarouselStore', () => {
  let store: CarouselStore;
  let consoleSpy: jest.SpyInstance;

  function createSlideElement(width: number): ElementRef<HTMLElement> {
    const nativeElement = {
      getBoundingClientRect: () => ({ width }),
    } as any;
    return new ElementRef(nativeElement);
  }

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
    // éviter le bruit des console.log dans le constructeur
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    store = new CarouselStore();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('totalSlides', () => {
    it('utilise slidesElements quand slides() est vide', () => {
      const slidesElements = [
        createSlideElement(100),
        createSlideElement(120),
        createSlideElement(80),
      ];

      store.patch({
        slidesElements,
        slides: [], // pas de slides “data”
      });

      expect(store.totalSlides()).toBe(3);
    });

    it('utilise slides() quand il y a des slides déclarés', () => {
      store.patch({
        // on se moque du type exact Slide ici
        slides: [{}, {}, {}] as any,
        slidesElements: [createSlideElement(100)], // ne doit pas être utilisé
      });

      expect(store.totalSlides()).toBe(3);
    });
  });

  describe('minTranslate et maxTranslate', () => {
    it('calcule les bornes sans centre (mode normal)', () => {
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

      // largeur visible = 300, contenu = 900
      setAllSlidesSize(300, 900);

      // maxTranslate = - (scrollWidth - fullWidth) - marginEnd
      //              = - (900 - 300) - 10
      //              = - 600 - 10 = -610
      expect(store.maxTranslate()).toBe(-610);

      // minTranslate = marginStart (sans centre)
      expect(store.minTranslate()).toBe(5);
    });

    it('calcule les bornes en mode center, notCenterBounds = false', () => {
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

      // largeur visible = 300, contenu = 900
      setAllSlidesSize(300, 900);

      const baseMax = -(900 - 300 - 0); // -(600) = -600
      const expectedMax = baseMax - 300 / 2 - 100 / 2; // -600 - 150 - 50 = -800
      const expectedMin = 300 / 2 - 100 / 2; // 150 - 50 = 100

      expect(store.maxTranslate()).toBe(expectedMax);
      expect(store.minTranslate()).toBe(expectedMin);
    });
  });

  describe('lastSlideAnchor', () => {
    it('retourne totalSlides - 1 quand loop = true', () => {
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

    it('centre + notCenterBounds + slidesPerView numérique', () => {
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

    it('centre + notCenterBounds = false → last = totalSlides - 1', () => {
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

    it('non centré + slidesPerView numérique', () => {
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

    it('non centré + slidesPerView = auto, calcul à partir des largeurs et de fullWidth', () => {
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

      // fullWidth = 250 → on tient 3 slides depuis la fin
      setAllSlidesSize(250, 500); // scrollWidth n'est pas utilisé dans ce calcul

      // boucle dans lastSlideAnchor:
      // index = 4, total=0   → total=100, count=1
      // index = 3, total=100 → total=200, count=2
      // index = 2, total=200 → total=300, count=3 (stop car 300 >= 250)
      // last = totalSlides - count + 1 = 5 - 3 + 1 = 3
      expect(store.lastSlideAnchor()).toBe(3);

      // firstSlideAnchor vaut 0 dans ce mode
      expect(store.firstSlideAnchor()).toBe(0);
      // donc totalSlidesVisible = 3 - 0 + 1 = 4
      expect(store.totalSlidesVisible()).toBe(4);
    });
  });

  describe('firstSlideAnchor', () => {
    it('centre + notCenterBounds + slidesPerView numérique → floor(slidesPerView / 2)', () => {
      store.patch({
        center: true,
        notCenterBounds: true,
        slidesPerView: 5,
      });

      // floor(5 / 2) = 2
      expect(store.firstSlideAnchor()).toBe(2);
    });

    it('hors cas spécifiques → 0', () => {
      store.patch({
        center: false,
        notCenterBounds: false,
        slidesPerView: 'auto',
      });

      expect(store.firstSlideAnchor()).toBe(0);
    });
  });

  describe('setCurrentPosition', () => {
    it('met à jour currentPosition seulement si la valeur change', () => {
      // valeur initiale = -1
      expect(store.currentPosition()).toBe(-1);

      store.setCurrentPosition(2);
      expect(store.currentPosition()).toBe(2);

      // re-set sur la même valeur : ne devrait pas patcher
      const patchSpy = jest.spyOn<any, any>(store as any, 'patch');
      store.setCurrentPosition(2);
      expect(patchSpy).not.toHaveBeenCalled();

      patchSpy.mockRestore();
    });
  });

  describe('slidesWidths', () => {
    it('lit la largeur des slides via getBoundingClientRect', () => {
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

  describe('fullWidth et scrollWidth', () => {
    function setAllSlidesSize(fullWidth: number, scrollWidth: number) {
      const nativeElement = {
        clientWidth: fullWidth,
        scrollWidth,
      } as any;

      store.patch({ allSlides: new ElementRef(nativeElement) });
    }

    it('fullWidth lit clientWidth du conteneur', () => {
      setAllSlidesSize(300, 900);

      expect(store.fullWidth()).toBe(300);
    });

    it('scrollWidth lit scrollWidth du conteneur', () => {
      setAllSlidesSize(400, 1200);

      // scrollWidth() force aussi la lecture des slidesWidths, mais on s’en fiche ici
      expect(store.scrollWidth()).toBe(1200);
    });
  });

  describe('snapsDom', () => {
    it('génère un SnapDom par slide avec domIndex et logicalIndex cohérents', () => {
      const slidesElements = [createSlideElement(100), createSlideElement(150)];

      store.patch({
        slidesElements,
        // ordre logique différent de l’ordre DOM pour vérifier le mapping
        slidesIndexOrder: [1, 0],
        marginStart: 0,
        marginEnd: 0,
        center: false,
        slidesPerView: 1,
      });

      const snaps = store.snapsDom();

      expect(snaps.length).toBe(2);

      // domIndex = index dans la boucle, logicalIndex = ordre logique fourni
      expect(snaps[0].domIndex).toBe(0);
      expect(snaps[0].logicalIndex).toBe(1);

      expect(snaps[1].domIndex).toBe(1);
      expect(snaps[1].logicalIndex).toBe(0);
    });
  });

  describe('visibleDom', () => {
    it('délègue à extractVisibleSlides avec les bons arguments', () => {
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

      // on force une largeur du conteneur
      const nativeElement = { clientWidth: 250 } as any;
      store.patch({ allSlides: new ElementRef(nativeElement) });

      // On calcule ce que le store envoie réellement à extractVisibleSlides
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

      // Le store doit renvoyer exactement ce que la fonction mock renvoie
      expect(result).toEqual([
        {
          domIndex: 0,
          logicalIndex: 0,
          left: 0,
          width: 100,
          translate: 0,
        },
      ]);

      // Et il doit l’appeler avec les bons paramètres
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
