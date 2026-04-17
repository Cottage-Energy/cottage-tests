/**
 * Performance measurement utilities for Playwright tests
 *
 * Collects Navigation Timing, Core Web Vitals (LCP, CLS), and resource metrics
 * using browser-native Performance API via page.evaluate(). No external dependencies.
 *
 * Usage:
 *   await injectPerformanceObservers(page);
 *   await page.goto(url, { waitUntil: 'load' });
 *   await page.waitForTimeout(TIMEOUTS.CLS_SETTLE);
 *   const result = await collectPerformanceMetrics(page, url, env);
 *   logPerformanceSummary(result, logger);
 *   const assertions = assertPerformanceThresholds(result, thresholds, logger);
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import type {
  PerformanceEnvironment,
  PagePerformanceResult,
  PerformanceRunReport,
  NavigationTimingMetrics,
  WebVitalMetrics,
  ResourceMetrics,
  PerformanceThreshold,
  PerformanceAssertionResult,
} from '../types/performance.types';
import { Logger, createLogger } from './logger';

const log = createLogger('Performance');

/** Raw shape returned by the browser-side collection script */
interface RawBrowserMetrics {
  navigation: NavigationTimingMetrics;
  lcp: number | null;
  cls: number | null;
  resources: ResourceMetrics;
}

/**
 * Inject PerformanceObserver scripts that survive navigation.
 * Must be called BEFORE page.goto(). Uses addInitScript so observers
 * are re-injected in every new document context (including redirects).
 */
export async function injectPerformanceObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // LCP observer — collects all LCP candidates; we take the last one
    (window as Record<string, unknown>).__perfLCP = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          ((window as Record<string, unknown>).__perfLCP as Array<{ startTime: number }>).push({
            startTime: entry.startTime,
          });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // PerformanceObserver for LCP not supported in this browser
    }

    // CLS observer — collects layout shifts without recent user input
    (window as Record<string, unknown>).__perfCLS = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            ((window as Record<string, unknown>).__perfCLS as Array<{ value: number }>).push({
              value: layoutShift.value,
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // PerformanceObserver for layout-shift not supported in this browser
    }
  });
}

/**
 * Collect all performance metrics from the current page.
 * Call after page.goto() has completed and CLS has settled.
 */
export async function collectPerformanceMetrics(
  page: Page,
  url: string,
  environment: PerformanceEnvironment
): Promise<PagePerformanceResult> {
  const rawMetrics = await page.evaluate((): RawBrowserMetrics => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const w = window as Record<string, unknown>;
    const lcpEntries = (w.__perfLCP as Array<{ startTime: number }>) || [];
    const clsEntries = (w.__perfCLS as Array<{ value: number }>) || [];

    return {
      navigation: {
        ttfb: nav.responseStart - nav.requestStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        pageLoad: nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.fetchStart : 0,
        domInteractive: nav.domInteractive - nav.fetchStart,
        dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
        tcpConnection: nav.connectEnd - nav.connectStart,
        serverResponse: nav.responseEnd - nav.requestStart,
        domParsing: nav.domInteractive - nav.responseEnd,
      },
      lcp: lcpEntries.length > 0
        ? lcpEntries[lcpEntries.length - 1].startTime
        : null,
      cls: clsEntries.length > 0
        ? clsEntries.reduce((sum, entry) => sum + entry.value, 0)
        : null,
      resources: {
        totalResources: resources.length,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        resourcesByType: resources.reduce<Record<string, number>>((acc, r) => {
          acc[r.initiatorType] = (acc[r.initiatorType] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  });

  if (rawMetrics.navigation.pageLoad === 0) {
    log.warn('loadEventEnd was 0 — page load metric may be inaccurate', { url });
  }

  return {
    url,
    environment,
    timestamp: new Date().toISOString(),
    navigation: rawMetrics.navigation,
    webVitals: {
      lcp: rawMetrics.lcp,
      cls: rawMetrics.cls,
    },
    resources: rawMetrics.resources,
  };
}

/**
 * Compare metrics against thresholds. Returns assertion results without
 * calling expect() — the spec decides how to assert (soft vs hard).
 */
export function assertPerformanceThresholds(
  result: PagePerformanceResult,
  thresholds: PerformanceThreshold,
  logger: Logger
): PerformanceAssertionResult[] {
  const assertions: PerformanceAssertionResult[] = [];

  const check = (metric: string, actual: number | null, threshold: number): void => {
    if (actual === null) {
      logger.info(`${metric}: not measured (null) — skipping`, { url: result.url });
      return;
    }
    const passed = actual <= threshold;
    const delta = threshold - actual;
    assertions.push({ metric, actual, threshold, passed, delta });
    logger.info(`${metric}: ${actual.toFixed(metric === 'CLS' ? 3 : 0)} (threshold: ${threshold}${metric === 'CLS' ? '' : 'ms'}) — ${passed ? 'PASS' : 'FAIL'}`, {
      url: result.url,
      delta: Number(delta.toFixed(metric === 'CLS' ? 3 : 0)),
    });
  };

  check('TTFB', result.navigation.ttfb, thresholds.ttfb);
  check('LCP', result.webVitals.lcp, thresholds.lcp);
  check('CLS', result.webVitals.cls, thresholds.cls);
  check('DOM Content Loaded', result.navigation.domContentLoaded, thresholds.domContentLoaded);
  check('Page Load', result.navigation.pageLoad, thresholds.pageLoad);

  return assertions;
}

/**
 * Log a formatted performance summary using the structured logger.
 */
export function logPerformanceSummary(result: PagePerformanceResult, logger: Logger): void {
  logger.section(`Performance Results: ${result.url} (${result.environment})`);

  logger.info('Navigation Timing', {
    ttfb: `${result.navigation.ttfb.toFixed(0)}ms`,
    domContentLoaded: `${result.navigation.domContentLoaded.toFixed(0)}ms`,
    pageLoad: `${result.navigation.pageLoad.toFixed(0)}ms`,
    domInteractive: `${result.navigation.domInteractive.toFixed(0)}ms`,
    dnsLookup: `${result.navigation.dnsLookup.toFixed(0)}ms`,
    tcpConnection: `${result.navigation.tcpConnection.toFixed(0)}ms`,
    serverResponse: `${result.navigation.serverResponse.toFixed(0)}ms`,
    domParsing: `${result.navigation.domParsing.toFixed(0)}ms`,
  });

  logger.info('Web Vitals', {
    lcp: result.webVitals.lcp !== null ? `${result.webVitals.lcp.toFixed(0)}ms` : 'N/A',
    cls: result.webVitals.cls !== null ? result.webVitals.cls.toFixed(3) : 'N/A',
  });

  const transferMB = (result.resources.totalTransferSize / (1024 * 1024)).toFixed(2);
  logger.info('Resources', {
    total: result.resources.totalResources,
    transferred: `${transferMB}MB`,
    ...result.resources.resourcesByType,
  });
}

const RESULTS_DIR = path.resolve(__dirname, '../../performance_tests/results');

/**
 * Save a performance result to the collector array.
 * Call once per test. Use savePerformanceReport() in afterAll to flush to disk.
 */
export function addPerformanceResult(
  collector: PagePerformanceResult[],
  result: PagePerformanceResult
): void {
  collector.push(result);
}

/**
 * Write collected results to JSON files:
 *   results/perf-latest.json           — always overwritten with most recent run
 *   results/perf-{env}-{date}.json     — timestamped snapshot for history
 */
export function savePerformanceReport(
  results: PagePerformanceResult[],
  environment: PerformanceEnvironment
): void {
  if (results.length === 0) {
    log.warn('No performance results to save');
    return;
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const report: PerformanceRunReport = {
    runTimestamp: new Date().toISOString(),
    environment,
    pages: results,
  };

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const latestPath = path.join(RESULTS_DIR, 'perf-latest.json');
  const snapshotPath = path.join(RESULTS_DIR, `perf-${environment}-${date}.json`);

  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(snapshotPath, JSON.stringify(report, null, 2));

  log.info('Performance results saved', {
    latest: latestPath,
    snapshot: snapshotPath,
    pages: results.length,
  });
}

/**
 * Detect the current environment from env vars.
 */
export function detectEnvironment(): PerformanceEnvironment {
  const baseUrl = process.env.BASE_URL || '';
  if (baseUrl.includes('tanstack-dev')) return 'tanstack-dev';
  if (baseUrl.includes('staging')) return 'staging';

  const env = process.env.ENV || 'dev';
  if (env === 'staging') return 'staging';
  if (env === 'production') return 'production';

  return 'dev';
}
