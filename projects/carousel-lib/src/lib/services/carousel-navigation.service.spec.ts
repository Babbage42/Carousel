import { CarouselNavigationService } from './carousel-navigation.service';
import { CarouselStore } from '../carousel.store';

describe('CarouselNavigationService', () => {
  let store: jest.Mocked<CarouselStore>;
  let service: CarouselNavigationService;

  beforeEach(() => {
    // Mock minimal de CarouselStore avec uniquement ce dont ce service a besoin
    store = {
      currentPosition: jest.fn(),
      state: jest.fn(),
      loop: jest.fn(),
      totalSlides: jest.fn(),
      lastSlideAnchor: jest.fn(),
      // tout le reste est ignoré
    } as unknown as jest.Mocked<CarouselStore>;

    service = new CarouselNavigationService(store);
  });

  function mockState(stepSlides: number) {
    store.state.mockReturnValue({
      stepSlides,
      // on peut ajouter ici rewind ou autre si ton state en a besoin
    });
  }

  // ---------------------------------------------------------------------------
  // Cas LOOP = true → on doit utiliser positiveModulo
  // ---------------------------------------------------------------------------

  it('en mode loop, next wrap correctement avec positiveModulo', () => {
    (store.loop as jest.Mock).mockReturnValue(true);
    (store.currentPosition as jest.Mock).mockReturnValue(2);
    mockState(3); // stepSlides = 3
    (store.totalSlides as jest.Mock).mockReturnValue(5);

    // newIndex = 2 + 3 = 5 → 5 mod 5 = 0
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(0);
  });

  it('en mode loop, prev wrap correctement avec positiveModulo', () => {
    store.loop.mockReturnValue(true);
    store.currentPosition.mockReturnValue(0);
    mockState(2); // stepSlides = 2
    store.totalSlides.mockReturnValue(5);

    // newIndex = 0 - 2 = -2 → -2 mod 5 = 3 (comportement attendu de positiveModulo)
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Cas LOOP = false → on clamp entre 0 et les anchors
  // ---------------------------------------------------------------------------

  it('en mode non-loop, next simple reste dans les bornes', () => {
    store.loop.mockReturnValue(false);
    store.currentPosition.mockReturnValue(2);
    mockState(2); // stepSlides = 2
    store.lastSlideAnchor.mockReturnValue(7);

    // newIndex = 2 + 2 = 4, clamp entre [0, lastSlideAnchor=7] → 4
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(4);
  });

  it('en mode non-loop, next ne dépasse pas lastSlideAnchor', () => {
    store.loop.mockReturnValue(false);
    store.currentPosition.mockReturnValue(6);
    mockState(3); // stepSlides = 3
    store.lastSlideAnchor.mockReturnValue(7);

    // newIndex = 6 + 3 = 9 → clamp max(lastSlideAnchor)=7
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(7);
  });

  it('en mode non-loop, prev simple descend correctement', () => {
    store.loop.mockReturnValue(false);
    store.currentPosition.mockReturnValue(5);
    mockState(2); // stepSlides = 2
    store.lastSlideAnchor.mockReturnValue(7);

    // newIndex = 5 - 2 = 3
    // clamp min( newIndex, lastSlideAnchor-1 = 6 ) => 3
    // puis max(0, 3) => 3
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  it('en mode non-loop, prev ne descend jamais en dessous de 0', () => {
    store.loop.mockReturnValue(false);
    store.currentPosition.mockReturnValue(1);
    mockState(3); // stepSlides = 3
    store.lastSlideAnchor.mockReturnValue(7);

    // newIndex = 1 - 3 = -2
    // min(-2, lastSlideAnchor-1 = 6) => -2
    // max(0, -2) => 0
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Cas générique : utilisation de stepSlides
  // ---------------------------------------------------------------------------

  it('utilise bien stepSlides du state pour calculer newIndex', () => {
    store.loop.mockReturnValue(false);
    store.currentPosition.mockReturnValue(4);
    mockState(5);
    store.lastSlideAnchor.mockReturnValue(20);

    const resultNext = service.calculateNewPositionAfterNavigation(true);
    const resultPrev = service.calculateNewPositionAfterNavigation(false);

    expect(resultNext).toBe(9); // 4 + 5
    expect(resultPrev).toBe(0); // 4 - 5 = -1 → clamp à 0
  });
});
