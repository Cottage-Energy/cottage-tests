import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_TAGS, TIMEOUTS } from '../resources/constants';
import { getThresholdsForPage } from '../resources/constants/performanceThresholds';
import { createLogger } from '../resources/utils/logger';
import { signInWithOTP, dismissPasswordResetIfPresent } from '../resources/fixtures/otpSignIn';
import {
  injectPerformanceObservers,
  collectPerformanceMetrics,
  assertPerformanceThresholds,
  logPerformanceSummary,
  detectEnvironment,
  addPerformanceResult,
  savePerformanceReport,
} from '../resources/utils/performanceHelper';
import type { PagePerformanceResult, PerformancePageConfig } from '../resources/types/performance.types';

const log = createLogger('PerfTest:Auth');
const collectedResults: PagePerformanceResult[] = [];

// Default to a persistent test user that won't be cleaned up by afterEach hooks.
// Override via PERF_TEST_EMAIL env var if needed.
const PERF_TEST_EMAIL = process.env.PERF_TEST_EMAIL || 'pgtest+reminder001@joinpublicgrid.com';
const AUTH_STATE_PATH = path.join(__dirname, '.auth-perf.json');

let authReady = false;

const AUTHENTICATED_PAGES: readonly PerformancePageConfig[] = [
  { path: '/app/overview', name: 'Overview Dashboard' },
  { path: '/app/billing', name: 'Billing' },
] as const;

test.describe('Authenticated Pages Performance', () => {

  test.beforeAll(async ({ browser }) => {
    log.info('Signing in to save auth state', { email: PERF_TEST_EMAIL });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await signInWithOTP(page, PERF_TEST_EMAIL);
      await dismissPasswordResetIfPresent(page);
      await context.storageState({ path: AUTH_STATE_PATH });
      authReady = true;
      log.info('Auth state saved');
    } catch (error) {
      log.warn('Login failed — authenticated perf tests will be skipped', {
        email: PERF_TEST_EMAIL,
        error: String(error),
      });
    }

    await page.close();
    await context.close();
  });

  test.afterAll(async () => {
    savePerformanceReport(collectedResults, detectEnvironment());
    if (fs.existsSync(AUTH_STATE_PATH)) {
      fs.rmSync(AUTH_STATE_PATH);
      log.info('Auth state file cleaned up');
    }
  });

  for (const pageConfig of AUTHENTICATED_PAGES) {
    test(`${pageConfig.name} — ${pageConfig.path}`, {
      tag: [TEST_TAGS.PERFORMANCE],
    }, async ({ browser }) => {
      test.skip(!authReady, `Login failed for ${PERF_TEST_EMAIL} — skipping`);
      test.setTimeout(TIMEOUTS.TEST_PERFORMANCE);
      const env = detectEnvironment();
      const thresholds = getThresholdsForPage(pageConfig.path, env);

      // Create a fresh context with saved auth state
      const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
      const page = await context.newPage();

      // Inject LCP + CLS observers before navigation
      await injectPerformanceObservers(page);

      // Navigate with 'load' waitUntil for complete navigation timing
      await page.goto(pageConfig.path, { waitUntil: 'load' });

      // Wait for layout shifts to settle
      await page.waitForTimeout(TIMEOUTS.CLS_SETTLE);

      // Collect all metrics
      const result = await collectPerformanceMetrics(page, pageConfig.path, env);
      addPerformanceResult(collectedResults, result);

      // Log formatted summary
      logPerformanceSummary(result, log);

      // Assert each metric with soft assertions
      const assertions = assertPerformanceThresholds(result, thresholds, log);
      for (const assertion of assertions) {
        expect.soft(
          assertion.actual,
          `${assertion.metric} (${assertion.actual.toFixed(assertion.metric === 'CLS' ? 3 : 0)}) should be within threshold (${assertion.threshold})`
        ).toBeLessThanOrEqual(assertion.threshold);
      }

      // Hard fail if any soft assertion failed
      expect(test.info().errors).toHaveLength(0);

      await page.close();
      await context.close();
    });
  }
});
