import { defineConfig, devices } from '@playwright/test';
import baseEnvUrl from './tests/resources/utils/environmentBaseUrl';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e_tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-results' }]],
  use: {
    trace: 'on-first-retry',
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.ENV === 'production' 
    ? baseEnvUrl.production.home
    : process.env.ENV === 'staging' 
      ? baseEnvUrl.staging.home
      : baseEnvUrl.dev.home
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'Safari',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
       name: 'Mobile Chrome',
       use: { ...devices['Pixel 5'] },
    },
    {
       name: 'Mobile Safari',
       use: { ...devices['iPhone 12'] },
    },

    /* Test against specific tags. */
    {
      name: 'Smoke',
      grep: /@smoke/,
    },
    {
      name: 'Regression',
      grep: /@regression/,
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
