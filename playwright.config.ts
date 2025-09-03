import { defineConfig, devices } from '@playwright/test';
import baseEnvUrl from './tests/resources/utils/environmentBaseUrl';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  //testDir: './tests/e2e_tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined,
  reporter: [
    ["line"],
    ["html", { outputFolder: "test-results" }]
  ],
  use: {
    trace: 'on-first-retry',
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.ENV === 'production' 
    ? baseEnvUrl.prod.home
    : process.env.ENV === 'staging' 
      ? baseEnvUrl.staging.home
      : baseEnvUrl.dev.home
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Chromium',
      use: { 
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        screenshot: 'on',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },

    {
      name: 'Safari',
      use: { 
        screenshot: 'on',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },

    /* Test against mobile viewports. */
    {
       name: 'Mobile_Chrome',
       use: { 
      ...devices['Pixel 7'],
      screenshot: 'on',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
      },
    },
    {
       name: 'Mobile_Safari',
       use: { 
      ...devices['iPhone 14'],
      screenshot: 'on',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
      },
    },
    {
       name: 'Mobile_Samsung',
       use: { 
      ...devices['Galaxy S9+'],
      screenshot: 'on',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
      },
    },
    {
       name: 'Tablet_iPad',
       use: { 
      ...devices['iPad Pro'],
      screenshot: 'on',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
      },
    },

    /* Test against specific tags. */
    {
      name: 'Smoke',
      grep: /@smoke/,
    },
    {
      name: 'Regression1',
      grep: /@regression1/,
    },
    {
      name: 'Regression2',
      grep: /@regression2/,
    },
    {
      name: 'Regression3',
      grep: /@regression3/,
    },
    {
      name: 'Regression4',
      grep: /@regression4/,
    },
    {
      name: 'Regression5',
      grep: /@regression5/,
    },
    {
      name: 'Regression6',
      grep: /@regression6/,
    },
    {
      name: 'Regression7',
      grep: /@regression7/,
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
