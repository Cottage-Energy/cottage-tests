import { test, expect } from '@playwright/test';
import { TEST_TAGS, TIMEOUTS } from '../resources/constants';
import { getThresholdsForPage } from '../resources/constants/performanceThresholds';
import { createLogger } from '../resources/utils/logger';
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

const log = createLogger('PerfTest:Public');
const collectedResults: PagePerformanceResult[] = [];

const PUBLIC_PAGES: readonly PerformancePageConfig[] = [
  { path: '/', name: 'Homepage' },
  { path: '/move-in', name: 'Move-In' },
  { path: '/move-in?shortCode=autotest', name: 'Move-In (shortcode)' },
  { path: '/sign-in', name: 'Sign In' },
  { path: '/transfer', name: 'Transfer' },
  { path: '/bill-upload/connect-account', name: 'Bill Upload Connect' },
] as const;

test.describe('Public Pages Performance', () => {

  test.afterAll(() => {
    savePerformanceReport(collectedResults, detectEnvironment());
  });

  for (const pageConfig of PUBLIC_PAGES) {
    test(`${pageConfig.name} — ${pageConfig.path}`, {
      tag: [TEST_TAGS.PERFORMANCE],
    }, async ({ page }) => {
      test.setTimeout(TIMEOUTS.TEST_PERFORMANCE);
      const env = detectEnvironment();
      const thresholds = getThresholdsForPage(pageConfig.path, env);

      // Inject LCP + CLS observers before navigation
      await injectPerformanceObservers(page);

      // Navigate with 'load' waitUntil for complete navigation timing
      await page.goto(pageConfig.path, { waitUntil: 'load' });

      // Wait for layout shifts to settle (hydration, lazy images, fonts)
      await page.waitForTimeout(TIMEOUTS.CLS_SETTLE);

      // Collect all metrics
      const result = await collectPerformanceMetrics(page, pageConfig.path, env);
      addPerformanceResult(collectedResults, result);

      // Log formatted summary
      logPerformanceSummary(result, log);

      // Assert each metric with soft assertions (all metrics checked even if one fails)
      const assertions = assertPerformanceThresholds(result, thresholds, log);
      for (const assertion of assertions) {
        expect.soft(
          assertion.actual,
          `${assertion.metric} (${assertion.actual.toFixed(assertion.metric === 'CLS' ? 3 : 0)}) should be within threshold (${assertion.threshold})`
        ).toBeLessThanOrEqual(assertion.threshold);
      }

      // Hard fail if any soft assertion failed
      expect(test.info().errors).toHaveLength(0);
    });
  }
});
