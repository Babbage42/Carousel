import { CarouselNavigationService } from './carousel-navigation.service';
import { CarouselStore } from '../carousel.store';
import { CarouselStoreFake } from '../helpers/tests/test.utils.helper';

describe('CarouselNavigationService', () => {
  let storeFake: CarouselStoreFake;
  let service: CarouselNavigationService;

  beforeEach(() => {
    storeFake = new CarouselStoreFake();
    service = new CarouselNavigationService(
      storeFake as unknown as CarouselStore
    );
  });

  // ---------------------------------------------------------------------------
  // Cas LOOP = true → on doit utiliser positiveModulo
  // ---------------------------------------------------------------------------

  it('en mode loop, next wrap correctement avec positiveModulo', () => {
    storeFake.setLoop(true);
    storeFake.setCurrentPosition(2);
    storeFake.setStepSlides(3);
    storeFake.setTotalSlides(5);

    // newIndex = 2 + 3 = 5 → 5 mod 5 = 0
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(0);
  });

  it('en mode loop, prev wrap correctement avec positiveModulo', () => {
    storeFake.setLoop(true);
    storeFake.setCurrentPosition(0);
    storeFake.setStepSlides(2);
    storeFake.setTotalSlides(5);

    // newIndex = 0 - 2 = -2 → -2 mod 5 = 3
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // Cas LOOP = false → on clamp entre 0 et les anchors
  // ---------------------------------------------------------------------------

  it('en mode non-loop, next simple reste dans les bornes', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(2);
    storeFake.setStepSlides(2);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 2 + 2 = 4, clamp entre [0, lastSlideAnchor=7] → 4
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(4);
  });

  it('en mode non-loop, next ne dépasse pas lastSlideAnchor', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(6);
    storeFake.setStepSlides(3);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 6 + 3 = 9 → clamp max(lastSlideAnchor)=7
    const result = service.calculateNewPositionAfterNavigation(true);

    expect(result).toBe(7);
  });

  it('en mode non-loop, prev simple descend correctement', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(5);
    storeFake.setStepSlides(2);
    storeFake.setLastSlideAnchor(7);

    // newIndex = 5 - 2 = 3
    // clamp min( newIndex, lastSlideAnchor-1 = 6 ) => 3
    // puis max(0, 3) => 3
    const result = service.calculateNewPositionAfterNavigation(false);

    expect(result).toBe(3);
  });

  it('en mode non-loop, prev ne descend jamais en dessous de 0', () => {
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(1);
    storeFake.setStepSlides(3);
    storeFake.setLastSlideAnchor(7);

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
    storeFake.setLoop(false);
    storeFake.setCurrentPosition(4);
    storeFake.setStepSlides(5);
    storeFake.setLastSlideAnchor(20);

    const resultNext = service.calculateNewPositionAfterNavigation(true);
    const resultPrev = service.calculateNewPositionAfterNavigation(false);

    expect(resultNext).toBe(9); // 4 + 5
    expect(resultPrev).toBe(0); // 4 - 5 = -1 → clamp à 0
  });
});
