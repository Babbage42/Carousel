// Playwright config for Carousel E2E
const { devices } = require('@playwright/test');
module.exports = {
  timeout: 120000,
  testDir: './tests',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile', use: { ...devices['Pixel 5'] } }
  ]
};
