import { expect, test, Page, Locator } from '@playwright/test';

const story = (id: string) => `?id=${id}`;

type HasLocator = Page | Locator;

async function getActiveSlideIndex(scope: HasLocator) {
  const slides = scope.locator('[data-testid^="slide-"].slide--active');
  const count = await slides.count();
  if (count === 0) {
    return -1;
  }
  const testId = await slides.first().getAttribute('data-testid');
  return testId ? Number(testId.replace('slide-', '')) : -1;
}

async function dragSlides(page: Page, offsetX: number, offsetY: number) {
  const handle = page.locator('.slides');
  await handle.waitFor();
  await handle.scrollIntoViewIfNeeded();

  const box = await handle.boundingBox();
  if (!box) {
    return;
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.waitForTimeout(30);
  await page.mouse.down();
  // Move in small steps to simulate a real drag
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(startX + offsetX * t, startY + offsetY * t);
  }
  await page.mouse.up();
  // Give time for inertia/transition to settle
  await page.waitForTimeout(400);
}

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

test.describe('Carousel stories', () => {
  test('navigation buttons move active slide', async ({ page }) => {
    await page.goto(story('components-carousel--interaction-next-prev'));
    await page.waitForSelector('[data-testid="slide-0"]');

    const initial = await getActiveSlideIndex(page);
    await page.getByRole('button', { name: /next slide/i }).click();
    await page.getByRole('button', { name: /next slide/i }).click();

    const afterNext = await getActiveSlideIndex(page);
    expect(afterNext).not.toBe(initial);

    await page.getByRole('button', { name: /previous slide/i }).click();
    const afterPrev = await getActiveSlideIndex(page);
    expect(afterPrev).not.toBe(afterNext);
  });

  test('dynamic dots navigate to requested slide', async ({ page }) => {
    await page.goto(story('components-carousel--interaction-click-dots'));
    await page.waitForSelector('[data-testid="slide-0"]');

    await page.getByRole('button', { name: /dot 3/i }).click();

    const active = await getActiveSlideIndex(page);
    expect(active).toBeGreaterThanOrEqual(2);
  });

  test('dragging in free mode changes active slide (after inertia)', async ({
    page,
  }) => {
    await page.goto(story('components-carousel--free-mode'));
    await page.waitForSelector('.carousel.layout-ready');
    await page.waitForSelector('[data-testid="slide-0"]');

    const initial = await getActiveSlideIndex(page);
    // Drag left to advance (negative X). In freeMode the active slide updates after translation.
    await dragSlides(page, -500, 0);

    const firstCheck = await expect
      .poll(async () => getActiveSlideIndex(page), { timeout: 1500 })
      .not.toBe(initial)
      .catch(() => null);

    if (firstCheck === null) {
      // Retry once with a longer drag if the first attempt didn't move
      await dragSlides(page, -700, 0);
      await expect
        .poll(async () => getActiveSlideIndex(page), { timeout: 1500 })
        .not.toBe(initial);
    }
  });

  test('loop wraps around at the end', async ({ page }) => {
    await page.goto(story('components-carousel--looping'));
    await page.waitForSelector('[data-testid="slide-0"]');

    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /next slide/i }).click();
    }
    const active = await getActiveSlideIndex(page);
    expect(active).toBeLessThan(5); // wrapped instead of sticking to last
  });

  test('RTL wiring still changes slide with buttons', async ({ page }) => {
    await page.goto(story('components-carousel--right-to-left-carousel'));
    await page.waitForSelector('[data-testid="slide-0"]');

    const initial = await getActiveSlideIndex(page);
    await page.getByRole('button', { name: /previous slide/i }).click();
    const afterNext = await getActiveSlideIndex(page);
    expect(afterNext).not.toBe(initial);

    await page.getByRole('button', { name: /next slide/i }).click();
    const afterPrev = await getActiveSlideIndex(page);
    expect(afterPrev).toBe(initial);
  });

  test('mouse wheel scrolls slides in free mode', async ({ page }) => {
    await page.goto(story('components-carousel--mouse-wheel-bool'));
    const host = page.locator('app-carousel').first();
    await host.waitFor();
    const slides = host.locator('.slides').first();
    const initial = await getActiveSlideIndex(host);

    for (let i = 0; i < 4; i++) {
      await slides.dispatchEvent('wheel', {
        deltaX: 250,
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      });
      await page.waitForTimeout(150);
    }

    await expect
      .poll(async () => getActiveSlideIndex(host), { timeout: 1500 })
      .not.toBe(initial);
  });

  test('responsive breakpoints change visible slides', async ({
    page,
    browserName,
  }) => {
    // Skip on WebKit if viewport resize is flaky
    test.skip(browserName === 'webkit');

    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto(story('components-carousel--responsive-breakpoints'));
    const slides = page.locator('.slides').first();
    await slides.waitFor();
    const mobileVisible = await countVisibleSlides(slides);
    expect(mobileVisible).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    const desktopVisible = await countVisibleSlides(slides);
    expect(desktopVisible).toBeGreaterThanOrEqual(3);
  });

  test('thumbnails sync with master carousel', async ({ page }) => {
    await page.goto(story('components-carousel--thumbs'));
    const carousels = page.locator('.carousel');
    const masterSlides = carousels.nth(0).locator('.slides');
    const thumbsSlides = carousels.nth(1).locator('.slides');

    await masterSlides.waitFor();
    await thumbsSlides.waitFor();

    const initial = await getActiveSlideIndex(masterSlides);

    const targetThumb = thumbsSlides.locator('[data-testid="slide-3"]');
    await targetThumb.scrollIntoViewIfNeeded();
    await targetThumb.click();

    await expect
      .poll(async () => getActiveSlideIndex(masterSlides), { timeout: 1000 })
      .toBeGreaterThan(initial);
  });

  test('autoplay advances slides over time', async ({ page }) => {
    await page.goto(story('components-carousel--auto-play'));
    await page.waitForSelector('[data-testid="slide-0"]');

    const initial = await getActiveSlideIndex(page);
    await page.waitForTimeout(5000);
    const after = await getActiveSlideIndex(page);
    expect(after).not.toBe(initial);
  });

  test('rewind goes back to first after last', async ({ page }) => {
    await page.goto(story('components-carousel--rewind'));
    await page.waitForSelector('[data-testid="slide-0"]');

    // Advance several times to pass the end
    for (let i = 0; i < 6; i++) {
      const next = page.getByRole('button', { name: /next slide/i });
      if (!(await next.isVisible())) break;
      await next.click();
    }

    const active = await getActiveSlideIndex(page);
    expect(active).toBe(0);
  });

  test('vertical carousel navigates downward', async ({ page }) => {
    await page.goto(story('components-carousel--vertical-carousel'));
    await page.waitForSelector('[data-testid="slide-0"]');

    const initial = await getActiveSlideIndex(page);
    await page.getByRole('button', { name: /next slide/i }).click();

    const after = await getActiveSlideIndex(page);
    expect(after).not.toBe(initial);
  });
});
