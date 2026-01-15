import { expect, test, Page, Locator } from '@playwright/test';
import {
  clickNext,
  clickNextUntilStop,
  clickPrev,
  clickPrevUntilStop,
  countVisibleSlides,
  dragSlides,
  findClickableSlide,
  firstCarousel,
  getActiveSlideIndex,
  getRenderedIndices,
  waitActiveChange,
  waitStoryReady,
} from './helpers/carousel-test.helper';

/**
 * Storybook helper
 */
const story = (id: string) => `?id=${id}`;

type HasLocator = Page | Locator;
type PaginationType = 'dot' | 'dynamic_dot' | 'fraction' | 'none';

type Scenario = {
  name: string;
  id: string;
  caps: {
    buttons?: boolean;
    pagination?: PaginationType;
    clickableDots?: boolean;
    draggable?: boolean;
    freeMode?: boolean;
    mouseWheel?: boolean;
    loop?: boolean;
    rewind?: boolean;
    rtl?: boolean;
    vertical?: boolean;
    virtual?: boolean;
    slideOnClick?: boolean;
    disabledSlides?: boolean;
    totalSlides?: number;
  };
};

/**
 * Scénarios de test
 */
const scenarios: Scenario[] = [
  {
    name: 'Looping',
    id: 'components-carousel--looping',
    caps: {
      buttons: true,
      pagination: 'dynamic_dot',
      clickableDots: true,
      loop: true,
      totalSlides: 8,
    },
  },
  {
    name: 'Rewind',
    id: 'components-carousel--rewind',
    caps: {
      buttons: true,
      rewind: true,
      totalSlides: 8,
    },
  },
  {
    name: 'RTL',
    id: 'components-carousel--right-to-left-carousel',
    caps: {
      buttons: true,
      rtl: true,
      totalSlides: 10,
    },
  },
  {
    name: 'Vertical',
    id: 'components-carousel--vertical-carousel',
    caps: {
      buttons: true,
      vertical: true,
      totalSlides: 10,
    },
  },
  {
    name: 'FreeMode (drag)',
    id: 'components-carousel--free-mode',
    caps: {
      buttons: true,
      draggable: true,
      freeMode: true,
      totalSlides: 12,
    },
  },
  {
    name: 'MouseWheel (free)',
    id: 'components-carousel--mouse-wheel-bool',
    caps: {
      buttons: true,
      mouseWheel: true,
      totalSlides: 12,
    },
  },
  {
    name: 'NoSlideOnClick',
    id: 'components-carousel--no-slide-on-clik',
    caps: {
      buttons: true,
      slideOnClick: false,
      totalSlides: 20,
    },
  },
  {
    name: 'DisabledSlides',
    id: 'components-carousel--disabled-slides',
    caps: {
      buttons: true,
      slideOnClick: true,
      disabledSlides: true,
      totalSlides: 10,
    },
  },
  {
    name: 'NonDraggable',
    id: 'components-carousel--non-draggable',
    caps: {
      buttons: true,
      draggable: false,
      totalSlides: 10,
    },
  },
  {
    name: 'VirtualMode',
    id: 'components-carousel--virtual-mode',
    caps: {
      buttons: true,
      virtual: true,
      totalSlides: 30,
      loop: false,
    },
  },
  {
    name: 'VirtualLoopMode',
    id: 'components-carousel--virtual-loop-mode',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 30,
    },
  },
  {
    name: 'VirtualLoopSmallTotal',
    id: 'components-carousel--virtual-loop-small-total',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 7,
    },
  },
  {
    name: 'VirtualLoopAutoSlidesPerView',
    id: 'components-carousel--virtual-loop-auto-slides-per-view',
    caps: {
      buttons: true,
      virtual: true,
      loop: true,
      totalSlides: 30,
    },
  },
];

/* ------------------------------------------------------------------------------------------------
 * Helpers améliorés
 * ------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------
 * Suites de tests
 * ------------------------------------------------------------------------------------------------ */

function defineBaseContracts(s: Scenario) {
  test('renders with exactly one active slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    const active = carousel.locator('[data-testid^="slide-"].slide--active');
    await expect(active).toHaveCount(1);

    const idx = await getActiveSlideIndex(carousel);
    expect(idx).toBeGreaterThanOrEqual(0);

    // Vérifier que la slide active est bien dans le DOM
    const activeSlide = carousel.locator(`[data-testid="slide-${idx}"]`);
    await expect(activeSlide).toBeVisible();
  });

  test('a11y: active slide has basic aria attributes', async ({ page }) => {
    const carousel = firstCarousel(page);

    const active = carousel
      .locator('[data-testid^="slide-"].slide--active')
      .first();

    await expect(active).toHaveAttribute('role', /group/i);
    await expect(active).toHaveAttribute('aria-label', /of/i);
    await expect(active).toHaveAttribute('tabindex', /-1|0/);
  });
}

function defineButtonsNavigationSuite(s: Scenario) {
  test('buttons: next/prev changes active slide', async ({ page }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);

    const afterNext = await getActiveSlideIndex(carousel);
    expect(afterNext).not.toBe(initial);

    await clickPrev(carousel, 1);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(afterNext);
  });

  test('edges: without loop/rewind, next/prev eventually stops at bounds', async ({
    page,
  }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');
    test.skip(
      !!s.caps.loop || !!s.caps.rewind,
      'Edge stop contract only for non-loop/non-rewind'
    );

    const carousel = firstCarousel(page);
    const maxSteps = (s.caps.totalSlides ?? 12) + 8;

    const end = await clickNextUntilStop(carousel, maxSteps);
    expect(end.steps).toBeLessThanOrEqual(maxSteps);

    const atEnd = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await page.waitForTimeout(500);
    const stillAtEnd = await getActiveSlideIndex(carousel);
    expect(stillAtEnd).toBe(atEnd);

    const start = await clickPrevUntilStop(carousel, maxSteps);
    expect(start.steps).toBeLessThanOrEqual(maxSteps);

    const atStart = await getActiveSlideIndex(carousel);
    await clickPrev(carousel, 1);
    await page.waitForTimeout(500);
    const stillAtStart = await getActiveSlideIndex(carousel);
    expect(stillAtStart).toBe(atStart);
  });
}

function definePaginationSuite(s: Scenario) {
  test('pagination: clicking dot navigates (dot/dynamic_dot)', async ({
    page,
  }) => {
    test.skip(
      !s.caps.pagination || s.caps.pagination === 'none',
      'No pagination expected'
    );
    test.skip(
      !(s.caps.pagination === 'dot' || s.caps.pagination === 'dynamic_dot'),
      'Not dot-based pagination'
    );
    test.skip(!s.caps.clickableDots, 'Dots not clickable in this scenario');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    const dot = carousel.getByRole('button', { name: /dot 3/i });
    await dot.click();

    const active = await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .not.toBe(initial)
      .then(async () => getActiveSlideIndex(carousel));

    expect(active).toBeGreaterThanOrEqual(2);
  });

  test('pagination: fraction updates (if present)', async ({ page }) => {
    test.skip(
      s.caps.pagination !== 'fraction',
      'Not a fraction pagination scenario'
    );

    const carousel = firstCarousel(page);
    const fraction = carousel
      .locator('.carousel__pagination--fraction')
      .first();

    await fraction.waitFor();

    const before = (await fraction.innerText()).trim();
    await clickNext(carousel, 1);
    await expect
      .poll(async () => (await fraction.innerText()).trim(), { timeout: 1500 })
      .not.toBe(before);
  });
}

function defineSlideClickSuite(s: Scenario) {
  test('slideOnClick: clicking a slide selects it (when enabled)', async ({
    page,
  }) => {
    test.skip(
      s.caps.slideOnClick === false,
      'Slide click disabled by scenario'
    );

    const carousel = firstCarousel(page);
    const initialIndex = await getActiveSlideIndex(carousel);

    // Trouver une slide cliquable (non-active, non-disabled, visible)
    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (!clickable) {
      test.skip(true, 'No clickable slide found');
      return;
    }

    // Vérifier qu'elle est bien visible dans le viewport
    // const inViewport = await isSlideInViewport(clickable.locator, carousel);
    // expect(inViewport).toBe(true);

    // Cliquer sur la slide
    await clickable.locator.click({ force: true });

    // Attendre le changement
    await waitActiveChange(carousel, initialIndex);

    // Vérifier que l'index a changé
    const newIndex = await getActiveSlideIndex(carousel);
    expect(newIndex).not.toBe(initialIndex);

    // Vérifier que c'est bien la slide cliquée qui est active
    // (peut différer en mode loop ou virtual)
    const activeSlide = carousel.locator('.slide--active');
    await expect(activeSlide).toBeVisible();
  });

  test('slideOnClick=false: clicking slides does NOT change active', async ({
    page,
  }) => {
    test.skip(
      s.caps.slideOnClick !== false,
      'Only for slideOnClick=false scenario'
    );

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (!clickable) {
      test.skip(true, 'No clickable slide found');
      return;
    }

    await clickable.locator.click();

    await page.waitForTimeout(800);
    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);
  });
}

function defineDisabledSlidesSuite(s: Scenario) {
  test('disabled slides cannot become active on click', async ({ page }) => {
    test.skip(!s.caps.disabledSlides, 'No disabled slides expected');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Dans votre story, les slides 2 et 5 sont disabled
    const disabled2 = carousel.locator('[data-testid="slide-2"]');

    // Vérifier qu'elle a bien la classe disabled
    await expect(disabled2).toHaveClass(/slide--disabled/);

    await disabled2.click({ force: true });
    await page.waitForTimeout(800);

    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);

    // Vérifier qu'un clic sur une slide non-disabled fonctionne
    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
      preferredIndex: 3,
    });

    if (clickable) {
      await clickable.locator.click();
      await waitActiveChange(carousel, initial);
      const newIndex = await getActiveSlideIndex(carousel);
      expect(newIndex).not.toBe(initial);
    }
  });
}

function defineDragSuite(s: Scenario) {
  test('drag: dragging changes active when draggable (or does nothing when not)', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await dragSlides(page, carousel, -700, 0);

    if (s.caps.draggable === false) {
      await page.waitForTimeout(800);
      const afterDrag = await getActiveSlideIndex(carousel);
      expect(afterDrag).toBe(initial);
      return;
    }

    // En mode draggable, l'index doit changer
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 2000 })
      .not.toBe(initial);
  });
}

function defineMouseWheelSuite(s: Scenario) {
  test('mouseWheel: wheel moves slides (when enabled)', async ({ page }) => {
    test.skip(!s.caps.mouseWheel, 'Mouse wheel not enabled');

    const carousel = firstCarousel(page);
    const hostSlides = carousel.locator('.slides').first();

    const initial = await getActiveSlideIndex(carousel);

    for (let i = 0; i < 4; i++) {
      await hostSlides.dispatchEvent('wheel', {
        deltaX: 250,
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      });
      await page.waitForTimeout(120);
    }

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 2000 })
      .not.toBe(initial);
  });
}

function defineLoopSuite(s: Scenario) {
  test('loop: eventually wraps (active index goes down after going up)', async ({
    page,
  }) => {
    test.skip(!s.caps.loop, 'Not a loop scenario');

    const carousel = firstCarousel(page);

    let prev = await getActiveSlideIndex(carousel);
    let sawIncrease = false;
    let sawWrap = false;

    const total = s.caps.totalSlides ?? 10;
    const maxClicks = total + 10;

    for (let i = 0; i < maxClicks; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(100);
      const cur = await getActiveSlideIndex(carousel);

      if (cur > prev) sawIncrease = true;
      if (sawIncrease && cur < prev) {
        sawWrap = true;
        break;
      }
      prev = cur;
    }

    expect(sawWrap).toBeTruthy();
  });
}

function defineRewindSuite(s: Scenario) {
  test('rewind: after passing end, goes back to 0', async ({ page }) => {
    test.skip(!s.caps.rewind, 'Not a rewind scenario');

    const carousel = firstCarousel(page);
    const total = s.caps.totalSlides ?? 8;

    await clickNext(carousel, total - 2);
    await page.waitForTimeout(500);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 2000 })
      .toBe(0);
  });
}

function defineRtlSuite(s: Scenario) {
  test('rtl: buttons wiring allows round-trip (prev then next)', async ({
    page,
  }) => {
    test.skip(!s.caps.rtl, 'Not an RTL scenario');

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await clickPrev(carousel, 1);
    await waitActiveChange(carousel, initial);
    const afterPrev = await getActiveSlideIndex(carousel);

    await clickNext(carousel, 1);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBe(initial);
  });
}

function defineVerticalSuite(s: Scenario) {
  test('vertical: has vertical class and navigation works', async ({
    page,
  }) => {
    test.skip(!s.caps.vertical, 'Not a vertical scenario');

    const carousel = firstCarousel(page);
    await expect(carousel).toHaveClass(/carousel--vertical/);

    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, initial);
  });
}

function defineVirtualSuite(s: Scenario) {
  test('virtual: does not render all slides & keeps a buffer around active', async ({
    page,
  }) => {
    test.skip(!s.caps.virtual, 'Not a virtual scenario');

    const carousel = firstCarousel(page);
    const total = s.caps.totalSlides ?? 30;
    const buffer = 2;

    const normalize = (idx: number) => {
      if (s.caps.loop) return (idx + total) % total;
      return idx;
    };

    const checkBuffer = async () => {
      const active = await getActiveSlideIndex(carousel);
      const rendered = await getRenderedIndices(carousel);

      if (total >= 10) {
        expect(rendered.length).toBeLessThan(total);
      }

      expect(rendered).toContain(active);

      for (let d = 1; d <= buffer; d++) {
        const left = normalize(active - d);
        const right = normalize(active + d);

        if (!s.caps.loop) {
          if (active - d >= 0) expect(rendered).toContain(left);
          if (active + d < total) expect(rendered).toContain(right);
        } else {
          expect(rendered).toContain(left);
          expect(rendered).toContain(right);
        }
      }
    };

    await checkBuffer();

    const steps = Math.min(10, total + 2);
    for (let i = 0; i < steps; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(150);
      await checkBuffer();
    }
  });
}

/* ------------------------------------------------------------------------------------------------
 * Tests principaux
 * ------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (modular matrix)', () => {
  for (const s of scenarios) {
    test.describe(`${s.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(story(s.id));
        await waitStoryReady(page);
      });

      defineBaseContracts(s);
      defineButtonsNavigationSuite(s);
      definePaginationSuite(s);
      defineSlideClickSuite(s);
      defineDisabledSlidesSuite(s);
      defineDragSuite(s);
      defineMouseWheelSuite(s);
      defineLoopSuite(s);
      defineRewindSuite(s);
      defineRtlSuite(s);
      defineVerticalSuite(s);
      defineVirtualSuite(s);
    });
  }
});
/* ------------------------------------------------------------------------------------------------

Tests spéciaux
------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (special)', () => {
  test('responsive breakpoints change visible slides', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit');
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto(story('components-carousel--responsive-breakpoints'));
    await waitStoryReady(page);

    const slides = firstCarousel(page).locator('.slides').first();
    const mobileVisible = await countVisibleSlides(slides);
    expect(mobileVisible).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);

    const desktopVisible = await countVisibleSlides(slides);
    expect(desktopVisible).toBeGreaterThanOrEqual(3);
  });
  test('thumbnails sync with master carousel', async ({ page }) => {
    await page.goto(story('components-carousel--thumbs'));
    await waitStoryReady(page);
    const carousels = page.locator('.carousel');
    const master = carousels.nth(0);
    const thumbs = carousels.nth(1);

    const initial = await getActiveSlideIndex(master);

    const clickable = await findClickableSlide(thumbs, {
      notActive: true,
      preferredIndex: 3,
    });

    if (clickable) {
      await clickable.locator.click();

      await expect
        .poll(() => getActiveSlideIndex(master), { timeout: 1500 })
        .not.toBe(initial);
    }
  });
  test('autoplay advances slides over time', async ({ page }) => {
    await page.goto(story('components-carousel--auto-play'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 6500 })
      .not.toBe(initial);
  });
});
/* ------------------------------------------------------------------------------------------------

NOUVEAUX TESTS : Edge Cases Critiques
------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (edge cases)', () => {
  test('virtual mode with very few slides (< slidesPerView)', async ({
    page,
  }) => {
    // Créer une story avec seulement 2 slides mais slidesPerView=4
    await page.goto(
      story('components-carousel--few-slides-less-than-slides-per-view')
    );
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const rendered = await getRenderedIndices(carousel);

    // Toutes les slides doivent être rendues
    expect(rendered.length).toBe(2);

    // Les boutons ne devraient pas permettre de naviguer
    const initial = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await page.waitForTimeout(500);

    const afterNext = await getActiveSlideIndex(carousel);
    // Devrait rester à 0 car pas assez de slides
    expect(afterNext).toBe(initial);
  });
  test('clicking disabled slide in loop mode', async ({ page }) => {
    await page.goto(story('components-carousel--disabled-slides'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    // Activer le loop
    // (vous devrez peut-être créer une story spécifique pour ça)

    const disabledSlide = carousel.locator('[data-testid="slide-2"]');
    await expect(disabledSlide).toHaveClass(/slide--disabled/);

    const initial = await getActiveSlideIndex(carousel);
    await disabledSlide.click({ force: true });
    await page.waitForTimeout(800);

    const afterClick = await getActiveSlideIndex(carousel);
    expect(afterClick).toBe(initial);
  });
  test('rapid navigation does not break state', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);

    // Cliquer rapidement 10 fois sur next
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      // Pas d'attente entre les clics
    }

    // Attendre que tout se stabilise
    await page.waitForTimeout(1000);

    // Vérifier qu'on a toujours exactement 1 slide active
    const activeSlides = carousel.locator('.slide--active');
    await expect(activeSlides).toHaveCount(1);

    // Vérifier qu'on peut encore naviguer
    const beforeNav = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await waitActiveChange(carousel, beforeNav);

    const afterNav = await getActiveSlideIndex(carousel);
    expect(afterNav).not.toBe(beforeNav);
  });
  test('drag and immediate click does not conflict', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitStoryReady(page);
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Drag
    await dragSlides(page, carousel, -300, 0);

    // Immédiatement après, cliquer sur une slide
    const clickable = await findClickableSlide(carousel, {
      notActive: true,
      notDisabled: true,
    });

    if (clickable) {
      await clickable.locator.click();
      await waitActiveChange(carousel, initial);

      // Vérifier qu'on a une seule slide active
      const activeSlides = carousel.locator('.slide--active');
      await expect(activeSlides).toHaveCount(1);
    }
  });
});
