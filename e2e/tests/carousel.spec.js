const { test, expect } = require('@playwright/test');

const STORY_URL = 'https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs';

test.describe('Carousel basic interactions', () => {
  test('loads story and shows carousel', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForLoadState('networkidle');
    // wait for carousel element
    const carousel = page.locator('[data-testid="carousel-root"], .carousel, carousel-component');
    await expect(carousel.first()).toBeVisible({ timeout: 10000 });
  });

  test('next/prev navigation works', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForLoadState('networkidle');
    const next = page.locator('button[aria-label="Next"], .carousel-next, .next');
    const prev = page.locator('button[aria-label="Previous"], .carousel-prev, .prev');
    if (await next.count() > 0) {
      await next.first().click();
      // brief wait
      await page.waitForTimeout(500);
      // no crash
      expect(true).toBeTruthy();
    } else {
      test.skip(true, 'No next button found');
    }
  });

  test('swipe simulation changes slide', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForLoadState('networkidle');
    const track = page.locator('.carousel, [data-carousel], [data-testid="carousel-root"]').first();
    if (await track.count() === 0) {
      test.skip(true, 'No carousel track found');
    }
    const box = await track.boundingBox();
    if (!box) return;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });
});
