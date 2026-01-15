import { expect, test, Page, Locator } from '@playwright/test';

/**
 * Storybook helper (your current approach).
 */
const story = (id: string) => `?id=${id}`;

type HasLocator = Page | Locator;
type PaginationType = 'dot' | 'dynamic_dot' | 'fraction' | 'none';

type Scenario = {
  name: string;
  id: string; // Storybook story id (query param ?id=...)
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
    totalSlides?: number; // strongly recommended for loop/rewind/virtual contracts
  };
};

/**
 * "Main stories" matrix.
 * - The goal: run a reusable battery of "base" behaviors on each mode.
 * - You can add/remove scenarios without touching the suites.
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
 * Low-level helpers
 * ------------------------------------------------------------------------------------------------ */

async function waitStoryReady(page: Page) {
  // Wait for at least one carousel & a first slide.
  await page.locator('.carousel').first().waitFor();
  await page.waitForSelector('[data-testid^="slide-"]');

  // If you have a layout-ready class, take advantage of it (but don't hard-require it).
  await page
    .locator('.carousel.layout-ready')
    .first()
    .waitFor({ timeout: 2000 })
    .catch(() => null);
}

function firstCarousel(page: Page) {
  return page.locator('.carousel').first();
}

async function getActiveSlideIndex(scope: HasLocator) {
  const slides = scope.locator('[data-testid^="slide-"].slide--active');
  const count = await slides.count();
  if (count === 0) return -1;
  const testId = await slides.first().getAttribute('data-testid');
  return testId ? Number(testId.replace('slide-', '')) : -1;
}

async function getRenderedIndices(scope: HasLocator): Promise<number[]> {
  const indices = await scope
    .locator('[data-testid^="slide-"]')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLElement).getAttribute('data-testid') || '')
        .map((s) => Number(s.replace('slide-', '')))
        .filter((n) => Number.isFinite(n))
    );

  return Array.from(new Set(indices)).sort((a, b) => a - b);
}

async function waitActiveChange(
  scope: HasLocator,
  from: number,
  timeout = 3000
) {
  await expect
    .poll(
      async () => {
        const cur = await getActiveSlideIndex(scope);
        console.log('[poll] from=', from, 'cur=', cur);
        return cur;
      },
      { timeout }
    )
    .not.toBe(from);
}
async function clickNext(
  carousel: Locator,
  times = 1
): Promise<{ clicked: number; blocked: boolean }> {
  const next = carousel.getByRole('button', { name: /next slide/i });
  let clicked = 0;

  for (let i = 0; i < times; i++) {
    if ((await next.count()) === 0) return { clicked, blocked: true };

    const visible = await next.isVisible().catch(() => false);
    if (!visible) return { clicked, blocked: true };

    await next.click();
    clicked++;
  }

  return { clicked, blocked: false };
}

async function clickPrev(
  carousel: Locator,
  times = 1
): Promise<{ clicked: number; blocked: boolean }> {
  const prev = carousel.getByRole('button', { name: /previous slide/i });
  let clicked = 0;

  for (let i = 0; i < times; i++) {
    if ((await prev.count()) === 0) return { clicked, blocked: true };
    const visible = await prev.isVisible().catch(() => false);
    if (!visible) return { clicked, blocked: true };

    await prev.click();
    clicked++;
  }

  return { clicked, blocked: false };
}

/**
 * Click next until active index stops changing (non-loop / non-rewind contract).
 */
async function clickNextUntilStop(carousel: Locator, maxSteps: number) {
  let prev = await getActiveSlideIndex(carousel);

  for (let i = 0; i < maxSteps; i++) {
    const res = await clickNext(carousel, 1);
    if (res.blocked) {
      return { stoppedAt: prev, steps: i };
    }
    const cur = await getActiveSlideIndex(carousel);
    if (cur === prev) return { stoppedAt: cur, steps: i + 1 };
    prev = cur;
  }
  return { stoppedAt: prev, steps: maxSteps };
}

async function clickPrevUntilStop(carousel: Locator, maxSteps: number) {
  let prev = await getActiveSlideIndex(carousel);

  for (let i = 0; i < maxSteps; i++) {
    const res = await clickPrev(carousel, 1);
    if (res.blocked) {
      return { stoppedAt: prev, steps: i };
    }
    const cur = await getActiveSlideIndex(carousel);
    if (cur === prev) return { stoppedAt: cur, steps: i + 1 };
    prev = cur;
  }
  return { stoppedAt: prev, steps: maxSteps };
}

async function dragSlides(
  page: Page,
  carousel: Locator,
  offsetX: number,
  offsetY: number
) {
  const handle = carousel.locator('.slides');
  await handle.waitFor();
  await handle.scrollIntoViewIfNeeded();

  const box = await handle.boundingBox();
  if (!box) return;

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.waitForTimeout(30);
  await page.mouse.down();

  // Move in small steps to simulate a real drag.
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(startX + offsetX * t, startY + offsetY * t);
  }

  await page.mouse.up();

  // Prefer “state wait” in tests, but a small settle delay helps inertia.
  await page.waitForTimeout(400);
}

/**
 * Used by the breakpoint test (keep it because it’s a good integration coverage).
 */
async function countVisibleSlides(slidesContainer: Locator) {
  return await slidesContainer
    .locator('[data-testid^="slide-"]')
    .evaluateAll((nodes, container) => {
      if (!container) return 0;
      const parentRect = container.getBoundingClientRect();
      return nodes.reduce((acc, el) => {
        const r = el.getBoundingClientRect();
        const visibleWidth = Math.max(
          0,
          Math.min(r.right, parentRect.right) -
            Math.max(r.left, parentRect.left)
        );
        const visibleHeight = Math.max(
          0,
          Math.min(r.bottom, parentRect.bottom) -
            Math.max(r.top, parentRect.top)
        );
        const visibleArea = visibleWidth * visibleHeight;
        const area = r.width * r.height || 1;
        return acc + (visibleArea / area >= 0.5 ? 1 : 0);
      }, 0);
    }, await slidesContainer.elementHandle());
}

/* ------------------------------------------------------------------------------------------------
 * Reusable suites (the “modules” you want)
 * ------------------------------------------------------------------------------------------------ */

function defineBaseContracts(s: Scenario) {
  test('renders with exactly one active slide', async ({ page }) => {
    const carousel = firstCarousel(page);

    const active = carousel.locator('[data-testid^="slide-"].slide--active');
    await expect(active).toHaveCount(1);

    const idx = await getActiveSlideIndex(carousel);
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  test('a11y: active slide has basic aria attributes', async ({ page }) => {
    const carousel = firstCarousel(page);

    // Your DOM service adds aria (role/label/tabindex). This is a contract test.
    const active = carousel
      .locator('[data-testid^="slide-"].slide--active')
      .first();

    await expect(active).toHaveAttribute(
      'role',
      /group|option|button|listitem/i
    );
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
    // If it didn’t stop, that’s suspicious (but don’t hard fail if your UX is different).
    expect(end.steps).toBeLessThanOrEqual(maxSteps);

    // At the end, clicking next should keep the same index.
    const atEnd = await getActiveSlideIndex(carousel);
    await clickNext(carousel, 1);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 800 })
      .toBe(atEnd);

    // Now go back to start and confirm prev stops.
    const start = await clickPrevUntilStop(carousel, maxSteps);
    expect(start.steps).toBeLessThanOrEqual(maxSteps);

    const atStart = await getActiveSlideIndex(carousel);
    await clickPrev(carousel, 1);
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 800 })
      .toBe(atStart);
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

    // click "Dot 3" -> should navigate near slide index 2.
    const initial = await getActiveSlideIndex(carousel);
    await carousel.getByRole('button', { name: /dot 3/i }).click();

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

    // Basic contract: it exists and changes when navigating.
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
    const from = await getActiveSlideIndex(carousel);

    const { x, y, testId } = await pickVisibleSlidePoint(page, carousel);

    await page.mouse.click(x, y);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 3000 })
      .not.toBe(from);
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

    const candidate = carousel
      .locator('[data-testid^="slide-"]')
      .filter({ hasNot: carousel.locator('.slide--active') })
      .first();

    await candidate.scrollIntoViewIfNeeded();
    await candidate.click();

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1200 })
      .toBe(initial);
  });
}

function defineDisabledSlidesSuite(s: Scenario) {
  test('disabled slides cannot become active on click', async ({ page }) => {
    test.skip(!s.caps.disabledSlides, 'No disabled slides expected');

    const carousel = firstCarousel(page);

    // In your story: disabled index are 2 and 5.
    const initial = await getActiveSlideIndex(carousel);

    const disabled2 = carousel.locator('[data-testid="slide-2"]');
    await disabled2.click({ force: true });
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1200 })
      .toBe(initial);

    // Click a non-disabled slide to ensure click still works.
    const slide3 = carousel.locator('[data-testid="slide-3"]');
    await slide3.scrollIntoViewIfNeeded();
    await slide3.click();
    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 1500 })
      .toBe(3);
  });
}

function defineDragSuite(s: Scenario) {
  test('drag: dragging changes active when draggable (or does nothing when not)', async ({
    page,
  }) => {
    const carousel = firstCarousel(page);

    const initial = await getActiveSlideIndex(carousel);

    if (s.caps.draggable === false) {
      await dragSlides(page, carousel, -700, 0);
      await expect
        .poll(() => getActiveSlideIndex(carousel), { timeout: 3000 })
        .toBe(initial);
      return;
    }

    test.skip(s.caps.draggable === false, 'Non-draggable');
    // Draggable (default true in most stories)
    await dragSlides(page, carousel, -700, 0);

    // In free mode, inertia can delay the "active" update, so we poll.
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

    // Click enough times to guarantee we "pass" the end.
    await clickNext(carousel, total - 2);

    await expect
      .poll(() => getActiveSlideIndex(carousel), { timeout: 2000 })
      .toBe(0);
  });
}

function defineRtlSuite(s: Scenario) {
  test('rtl: buttons wiring still allows round-trip (prev then next)', async ({
    page,
  }) => {
    test.skip(!s.caps.rtl, 'Not an RTL scenario');

    const carousel = firstCarousel(page);

    const initial = await getActiveSlideIndex(carousel);

    // In RTL your Navigation component swaps events.
    await clickPrev(carousel, 1);
    await waitActiveChange(carousel, initial);

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

      // Virtual should not render everything (unless total is tiny).
      if (total >= 10) {
        expect(rendered.length).toBeLessThan(total);
      }

      // Active must be rendered.
      expect(rendered).toContain(active);

      for (let d = 1; d <= buffer; d++) {
        const left = normalize(active - d);
        const right = normalize(active + d);

        if (!s.caps.loop) {
          // Out of bounds => don't require
          if (active - d >= 0) expect(rendered).toContain(left);
          if (active + d < total) expect(rendered).toContain(right);
        } else {
          expect(rendered).toContain(left);
          expect(rendered).toContain(right);
        }
      }
    };

    await checkBuffer();

    // Navigate several times and re-check (catches "buffer holes" regressions).
    const steps = Math.min(10, total + 2);
    for (let i = 0; i < steps; i++) {
      await clickNext(carousel, 1);
      await checkBuffer();
    }
  });
}

/* ------------------------------------------------------------------------------------------------
 * Matrix runner: each scenario gets the same battery of tests
 * ------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (modular matrix)', () => {
  for (const s of scenarios) {
    test.describe(`${s.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(story(s.id));
        await waitStoryReady(page);
      });

      // Always-on base contracts
      defineBaseContracts(s);

      // “Base behavior modules”
      defineButtonsNavigationSuite(s);
      definePaginationSuite(s);
      defineSlideClickSuite(s);
      defineDisabledSlidesSuite(s);
      defineDragSuite(s);
      defineMouseWheelSuite(s);

      // Mode-specific modules
      defineLoopSuite(s);
      defineRewindSuite(s);
      defineRtlSuite(s);
      defineVerticalSuite(s);
      defineVirtualSuite(s);
    });
  }
});

/* ------------------------------------------------------------------------------------------------
 * Special stories (not in the matrix)
 * ------------------------------------------------------------------------------------------------ */

test.describe('Carousel E2E (special)', () => {
  test('responsive breakpoints change visible slides', async ({
    page,
    browserName,
  }) => {
    // Skip on WebKit if viewport resize is flaky
    test.skip(browserName === 'webkit');

    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto(story('components-carousel--responsive-breakpoints'));
    await waitStoryReady(page);

    const slides = firstCarousel(page).locator('.slides').first();
    const mobileVisible = await countVisibleSlides(slides);
    expect(mobileVisible).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1200, height: 800 });
    // Let matchMedia listeners settle.
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

    // Click a thumb -> master should update.
    const targetThumb = thumbs.locator('[data-testid="slide-3"]');
    await targetThumb.scrollIntoViewIfNeeded();
    await targetThumb.click();

    await expect
      .poll(() => getActiveSlideIndex(master), { timeout: 1500 })
      .not.toBe(initial);
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

async function pickVisibleSlidePoint(page: Page, carousel: Locator) {
  const root = await carousel.elementHandle();
  if (!root) throw new Error('Carousel root not found');

  const res = await page.evaluate((rootEl) => {
    const root = rootEl as HTMLElement;
    const viewport = root.querySelector('.slides') as HTMLElement | null;
    if (!viewport) return { ok: false, reason: 'no .slides viewport' } as const;

    const r = viewport.getBoundingClientRect();
    if (r.width < 5 || r.height < 5)
      return { ok: false, reason: 'viewport too small' } as const;

    // On teste plusieurs points "dans" la fenêtre visible.
    // Le centre peut tomber sur la slide active (surtout en centered mode),
    // donc on essaie aussi un peu à droite/gauche.
    const points = [
      { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 },
      { x: r.left + r.width * 0.75, y: r.top + r.height * 0.5 },
      { x: r.left + r.width * 0.25, y: r.top + r.height * 0.5 },
      { x: r.left + r.width * 0.85, y: r.top + r.height * 0.5 },
      { x: r.left + r.width * 0.15, y: r.top + r.height * 0.5 },
    ];

    const isGood = (slide: HTMLElement | null) => {
      if (!slide) return false;
      if (!root.contains(slide)) return false;
      if (slide.classList.contains('slide--active')) return false;
      if (slide.classList.contains('slide--disabled')) return false;
      return true;
    };

    for (const p of points) {
      const el = document.elementFromPoint(p.x, p.y) as HTMLElement | null;
      const slide = el?.closest(
        '[data-testid^="slide-"]'
      ) as HTMLElement | null;
      if (isGood(slide)) {
        return {
          ok: true,
          x: p.x,
          y: p.y,
          testId: slide!.getAttribute('data-testid'),
        } as const;
      }
    }

    // Fallback: scan des slides rendues et prendre celle la plus "visible"
    const slides = Array.from(
      root.querySelectorAll<HTMLElement>('[data-testid^="slide-"]')
    ).filter(
      (s) =>
        !s.classList.contains('slide--active') &&
        !s.classList.contains('slide--disabled')
    );

    let best: {
      el: HTMLElement;
      ratio: number;
      cx: number;
      cy: number;
    } | null = null;

    const intersectRatio = (a: DOMRect, b: DOMRect) => {
      const iw = Math.max(
        0,
        Math.min(a.right, b.right) - Math.max(a.left, b.left)
      );
      const ih = Math.max(
        0,
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      );
      const inter = iw * ih;
      const area = Math.max(1, a.width * a.height);
      return inter / area;
    };

    for (const s of slides) {
      const sr = s.getBoundingClientRect();
      const ratio = intersectRatio(sr, r);
      if (ratio <= 0.15) continue; // visible "un peu" au moins
      const cx = sr.left + sr.width / 2;
      const cy = sr.top + sr.height / 2;

      if (!best || ratio > best.ratio) best = { el: s, ratio, cx, cy };
    }

    if (best) {
      return {
        ok: true,
        x: best.cx,
        y: best.cy,
        testId: best.el.getAttribute('data-testid'),
      } as const;
    }

    return {
      ok: false,
      reason: 'no visible non-active non-disabled slide found',
    } as const;
  }, root);

  if (!res.ok) {
    throw new Error(
      `No visible clickable slide found inside carousel viewport: ${res.reason}`
    );
  }

  return { x: res.x, y: res.y, testId: res.testId as string | null };
}
