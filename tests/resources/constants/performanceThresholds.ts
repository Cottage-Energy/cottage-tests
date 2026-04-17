/**
 * Performance testing thresholds and configuration
 *
 * Thresholds are intentionally generous for dev environments.
 * Tighten based on observed baselines after 2-4 weeks of data.
 *
 * Google Web Vitals "Good" targets for reference:
 *   TTFB < 800ms, LCP < 2500ms, CLS < 0.1
 * Dev environments run without CDN, with debug bundles, so we start at ~1.5-2x.
 */

import type {
  PerformanceEnvironment,
  PerformanceThreshold,
  PerformanceThresholdConfig,
} from '../types/performance.types';

/** Default performance thresholds (baseline for dev environment) */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThreshold = {
  ttfb: 2000,
  lcp: 6000,
  cls: 0.25,
  domContentLoaded: 8000,
  pageLoad: 15000,
} as const;

/**
 * Environment multipliers applied to timing thresholds.
 * CLS is excluded from scaling — layout stability is not speed-dependent.
 */
export const PERFORMANCE_ENVIRONMENT_MULTIPLIERS: Record<PerformanceEnvironment, number> = {
  'dev': 1.0,
  'tanstack-dev': 1.2,
  'staging': 0.8,
  'production': 0.6,
} as const;

/** Page-specific threshold overrides (merged on top of defaults) */
export const PAGE_SPECIFIC_THRESHOLDS: PerformanceThresholdConfig = {
  '/': {},
  '/move-in': { ttfb: 5000, domContentLoaded: 10000 },
  '/move-in?shortCode=autotest': { ttfb: 5000, domContentLoaded: 10000 },
  '/sign-in': { pageLoad: 10000 },
  '/transfer': {},
  '/bill-upload/connect-account': {},
  '/app/overview': { lcp: 8000, pageLoad: 18000 },
  '/app/billing': { lcp: 8000, pageLoad: 20000 },
} as const;

/**
 * Compute final thresholds for a given page and environment.
 * Merges: defaults → page overrides → environment multiplier (except CLS).
 */
export function getThresholdsForPage(
  pagePath: string,
  environment: PerformanceEnvironment
): PerformanceThreshold {
  const pageOverrides = PAGE_SPECIFIC_THRESHOLDS[pagePath] ?? {};
  const multiplier = PERFORMANCE_ENVIRONMENT_MULTIPLIERS[environment];

  const merged: PerformanceThreshold = {
    ...DEFAULT_PERFORMANCE_THRESHOLDS,
    ...pageOverrides,
  };

  return {
    ttfb: Math.round(merged.ttfb * multiplier),
    lcp: Math.round(merged.lcp * multiplier),
    cls: merged.cls, // CLS is not scaled by environment
    domContentLoaded: Math.round(merged.domContentLoaded * multiplier),
    pageLoad: Math.round(merged.pageLoad * multiplier),
  };
}
