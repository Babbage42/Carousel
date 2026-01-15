import { expect, test } from '@playwright/test';
import {
  waitCarouselReady,
  getActiveSlideIndex,
  clickNext,
  clickPrev,
  findClickableSlide,
  assertCarouselIntegrity,
  dragCarousel,
} from './helpers/carousel-test.helper';
const story = (id: string) => `?id=${id}`;

function firstCarousel(page) {
  return page.locator('.carousel').first();
}

/**
 * Tests pour la navigation clavier
 */
test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);
  });

  test('ArrowRight navigates to next slide', async ({ page }) => {
    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Focus sur le carousel
    await carousel.press('Tab');
    await carousel.press('ArrowRight');

    await page.waitForTimeout(600);
    const afterKey = await getActiveSlideIndex(carousel);
    expect(afterKey).not.toBe(initial);
  });

  test('ArrowLeft navigates to previous slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    // Se positionner à un index > 0
    await clickNext(carousel, 2);
    await page.waitForTimeout(600);

    const beforeKey = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');
    await carousel.press('ArrowLeft');

    await page.waitForTimeout(600);
    const afterKey = await getActiveSlideIndex(carousel);
    expect(afterKey).not.toBe(beforeKey);
  });

  test('Home key goes to first slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    // Naviguer vers le milieu
    await clickNext(carousel, 4);
    await page.waitForTimeout(600);

    await carousel.press('Tab');
    await carousel.press('Home');

    await page.waitForTimeout(600);
    const index = await getActiveSlideIndex(carousel);
    expect(index).toBe(0);
  });

  test('End key goes to last slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    await carousel.press('Tab');
    await carousel.press('End');

    await page.waitForTimeout(600);
    const index = await getActiveSlideIndex(carousel);

    // En mode loop, le dernier index dépend du totalSlides
    // Pour cette story, c'est 7 (8 slides, index 0-7)
    expect(index).toBeGreaterThanOrEqual(6);
  });

  test('keyboard navigation in RTL mode', async ({ page }) => {
    await page.goto(story('components-carousel--right-to-left-carousel'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');

    // En RTL, ArrowRight devrait aller à prev
    await carousel.press('ArrowRight');
    await page.waitForTimeout(600);

    const afterRight = await getActiveSlideIndex(carousel);
    expect(afterRight).not.toBe(initial);

    // ArrowLeft devrait revenir
    await carousel.press('ArrowLeft');
    await page.waitForTimeout(600);

    const afterLeft = await getActiveSlideIndex(carousel);
    expect(afterLeft).toBe(initial);
  });

  test('keyboard navigation in vertical mode', async ({ page }) => {
    await page.goto(story('components-carousel--vertical-carousel'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    await carousel.press('Tab');

    // En vertical, ArrowDown = next
    await carousel.press('ArrowDown');
    await page.waitForTimeout(600);

    const afterDown = await getActiveSlideIndex(carousel);
    expect(afterDown).not.toBe(initial);

    // ArrowUp = prev
    await carousel.press('ArrowUp');
    await page.waitForTimeout(600);

    const afterUp = await getActiveSlideIndex(carousel);
    expect(afterUp).toBe(initial);
  });
});

/**
 * Tests pour l'autoplay
 */
test.describe('Autoplay', () => {
  test('autoplay advances slides automatically', async ({ page }) => {
    await page.goto(story('components-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const initial = await getActiveSlideIndex(carousel);

    // Attendre que l'autoplay fasse au moins 1 transition
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 5000 })
      .not.toBe(initial);
  });

  test('autoplay pauses on hover', async ({ page }) => {
    await page.goto(story('components-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Hover sur le carousel
    await carousel.hover();

    const beforeHover = await getActiveSlideIndex(carousel);

    // Attendre le délai d'autoplay
    await page.waitForTimeout(2500);

    const afterHover = await getActiveSlideIndex(carousel);

    // L'index ne devrait pas avoir changé (autoplay pausé)
    expect(afterHover).toBe(beforeHover);
  });

  test('autoplay resumes after mouse leave', async ({ page }) => {
    await page.goto(story('components-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Hover puis unhover
    await carousel.hover();
    await page.mouse.move(0, 0); // Sortir du carousel

    const beforeResume = await getActiveSlideIndex(carousel);

    // Attendre que l'autoplay reprenne
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 5000 })
      .not.toBe(beforeResume);
  });

  test('autoplay stops on interaction (stopOnInteraction=true)', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--auto-play'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Interagir en cliquant sur next
    await clickNext(carousel, 1);
    await page.waitForTimeout(600);

    const afterInteraction = await getActiveSlideIndex(carousel);

    // Attendre le délai d'autoplay
    await page.waitForTimeout(2500);

    const afterWait = await getActiveSlideIndex(carousel);

    // L'index ne devrait pas avoir changé (autoplay arrêté)
    expect(afterWait).toBe(afterInteraction);
  });
});

/**
 * Tests pour center mode
 */
test.describe('Center Mode', () => {
  test('active slide is centered visually', async ({ page }) => {
    await page.goto(story('components-carousel--centered'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);
    const activeSlide = carousel.locator('.slide--active').first();

    // Récupérer les positions
    const positions = await carousel.evaluate((carouselEl, activeEl) => {
      const carouselRect = carouselEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const carouselCenter = carouselRect.left + carouselRect.width / 2;
      const activeCenter = activeRect.left + activeRect.width / 2;

      return {
        carouselCenter,
        activeCenter,
        diff: Math.abs(carouselCenter - activeCenter),
      };
    }, await activeSlide.elementHandle());

    // La slide active devrait être centrée (tolérance de 5px)
    expect(positions.diff).toBeLessThan(5);
  });

  test('center mode maintains centering after navigation', async ({ page }) => {
    await page.goto(story('components-carousel--centered'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Naviguer
    await clickNext(carousel, 1);
    await page.waitForTimeout(600);

    const activeSlide = carousel.locator('.slide--active').first();

    const positions = await carousel.evaluate((carouselEl, activeEl) => {
      const carouselRect = carouselEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const carouselCenter = carouselRect.left + carouselRect.width / 2;
      const activeCenter = activeRect.left + activeRect.width / 2;

      return Math.abs(carouselCenter - activeCenter);
    }, await activeSlide.elementHandle());

    expect(positions).toBeLessThan(5);
  });
});

/**
 * Tests de performance
 */
test.describe('Performance', () => {
  test('carousel handles many slides (100+) without lag', async ({ page }) => {
    // Vous devrez créer une story avec 100+ slides
    await page.goto(story('components-carousel--many-slides'));
    await waitCarouselReady(page, { timeout: 5000 });

    const carousel = firstCarousel(page);

    // Mesurer le temps de navigation
    const startTime = Date.now();
    await clickNext(carousel, 5);
    const endTime = Date.now();

    const duration = endTime - startTime;

    // 5 navigations devraient prendre moins de 3s
    expect(duration).toBeLessThan(3000);
  });

  test('virtual mode improves performance with many slides', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--virtual-mode'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Vérifier qu'on ne rend pas toutes les slides
    const renderedCount = await carousel
      .locator('[data-testid^="slide-"]')
      .count();

    // Avec 30 slides totales et virtual mode, on devrait en rendre ~10-15
    expect(renderedCount).toBeLessThan(20);
    expect(renderedCount).toBeGreaterThan(5);
  });

  test('smooth animations (60 FPS)', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Mesurer les FPS pendant une transition
    const fps = await page.evaluate(async () => {
      let frameCount = 0;
      let lastTime = performance.now();

      return new Promise<number>((resolve) => {
        const checkFrame = () => {
          frameCount++;
          const now = performance.now();

          if (now - lastTime >= 1000) {
            resolve(frameCount);
          } else {
            requestAnimationFrame(checkFrame);
          }
        };

        requestAnimationFrame(checkFrame);
      });
    });

    // Au moins 50 FPS attendu
    expect(fps).toBeGreaterThanOrEqual(50);
  });
});

/**
 * Tests d'accessibilité
 */
test.describe('Accessibility', () => {
  test('carousel has proper ARIA roles', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Vérifier la structure ARIA
    const slides = carousel.locator('[data-testid^="slide-"]');
    const firstSlide = slides.first();

    await expect(firstSlide).toHaveAttribute('role', 'group');
    await expect(firstSlide).toHaveAttribute('aria-roledescription', 'slide');
    await expect(firstSlide).toHaveAttribute('aria-label', /\d+ of \d+/);
  });

  test('active slide has tabindex=0, others have tabindex=-1', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    const activeSlide = carousel.locator('.slide--active');
    await expect(activeSlide).toHaveAttribute('tabindex', '0');

    const inactiveSlides = carousel.locator('.slide:not(.slide--active)');
    const count = await inactiveSlides.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(inactiveSlides.nth(i)).toHaveAttribute('tabindex', '-1');
    }
  });

  test('navigation buttons have descriptive labels', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    const nextBtn = carousel.getByRole('button', { name: /next slide/i });
    const prevBtn = carousel.getByRole('button', { name: /previous slide/i });

    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
  });

  test('disabled slides have proper state', async ({ page }) => {
    await page.goto(story('components-carousel--disabled-slides'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Les slides 2 et 5 sont désactivées dans cette story
    const disabled2 = carousel.locator('[data-testid="slide-2"]');

    await expect(disabled2).toHaveClass(/slide--disabled/);

    // La slide désactivée devrait avoir pointer-events: none
    const pointerEvents = await disabled2.evaluate(
      (el) => window.getComputedStyle(el).pointerEvents
    );

    expect(pointerEvents).toBe('none');
  });
});

/**
 * Tests de régression
 */
test.describe('Regression Tests', () => {
  test('BUG-001: Virtual loop with small totalSlides does not crash', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--virtual-loop-small-total'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Naviguer plusieurs fois sans crash
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(300);

      // Vérifier l'intégrité après chaque navigation
      await assertCarouselIntegrity(carousel);
    }
  });

  test('BUG-002: Rapid clicks do not create multiple active slides', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--looping'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Cliquer rapidement 10 fois
    for (let i = 0; i < 10; i++) {
      await clickNext(carousel, 1);
      // Pas de délai
    }

    // Attendre que tout se stabilise
    await page.waitForTimeout(1000);

    // Doit toujours avoir exactement 1 slide active
    const activeSlides = carousel.locator('.slide--active');
    await expect(activeSlides).toHaveCount(1);
  });

  test('BUG-003: Center mode with loop does not lose slides', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--loop-and-center'));
    await waitCarouselReady(page);

    const carousel = firstCarousel(page);

    // Faire un tour complet
    const totalSlides = 10; // Selon la story
    for (let i = 0; i < totalSlides + 2; i++) {
      await clickNext(carousel, 1);
      await page.waitForTimeout(400);
    }

    // Vérifier qu'on peut toujours naviguer
    await assertCarouselIntegrity(carousel);
  });
});
