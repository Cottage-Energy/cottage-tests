/**
 * Performance testing type definitions
 * Used by performance helper utilities and performance test specs
 */

/** Supported environments for performance threshold scaling */
export type PerformanceEnvironment = 'dev' | 'tanstack-dev' | 'staging' | 'production';

/** Navigation Timing API metrics extracted from PerformanceNavigationTiming */
export interface NavigationTimingMetrics {
  /** Time to First Byte — responseStart - requestStart (ms) */
  ttfb: number;
  /** DOM Content Loaded — domContentLoadedEventEnd - fetchStart (ms) */
  domContentLoaded: number;
  /** Full page load — loadEventEnd - fetchStart (ms) */
  pageLoad: number;
  /** DOM interactive — domInteractive - fetchStart (ms) */
  domInteractive: number;
  /** DNS lookup duration — domainLookupEnd - domainLookupStart (ms) */
  dnsLookup: number;
  /** TCP connection duration — connectEnd - connectStart (ms) */
  tcpConnection: number;
  /** Server response duration — responseEnd - requestStart (ms) */
  serverResponse: number;
  /** DOM parsing duration — domInteractive - responseEnd (ms) */
  domParsing: number;
}

/** Core Web Vitals collected via PerformanceObserver */
export interface WebVitalMetrics {
  /** Largest Contentful Paint (ms). Null if no qualifying LCP element observed. */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless score). Null if no layout shifts observed. */
  cls: number | null;
}

/** Resource loading summary from PerformanceResourceTiming */
export interface ResourceMetrics {
  /** Total number of resources loaded */
  totalResources: number;
  /** Total bytes transferred across all resources */
  totalTransferSize: number;
  /** Resource count grouped by initiator type (script, css, img, fetch, etc.) */
  resourcesByType: Record<string, number>;
}

/** Complete performance measurement result for a single page load */
export interface PagePerformanceResult {
  /** Page path tested (e.g., '/move-in') */
  url: string;
  /** Environment where the measurement was taken */
  environment: PerformanceEnvironment;
  /** ISO 8601 timestamp of the measurement */
  timestamp: string;
  /** Navigation Timing API metrics */
  navigation: NavigationTimingMetrics;
  /** Core Web Vitals */
  webVitals: WebVitalMetrics;
  /** Resource loading summary */
  resources: ResourceMetrics;
}

/** Threshold values for performance assertions */
export interface PerformanceThreshold {
  /** Max acceptable TTFB (ms) */
  ttfb: number;
  /** Max acceptable LCP (ms) */
  lcp: number;
  /** Max acceptable CLS (unitless) */
  cls: number;
  /** Max acceptable DOM Content Loaded (ms) */
  domContentLoaded: number;
  /** Max acceptable full page load (ms) */
  pageLoad: number;
}

/** Page-specific threshold overrides keyed by page path */
export type PerformanceThresholdConfig = Record<string, Partial<PerformanceThreshold>>;

/** Result of comparing a single metric against its threshold */
export interface PerformanceAssertionResult {
  /** Metric name (e.g., 'TTFB', 'LCP') */
  metric: string;
  /** Measured value */
  actual: number;
  /** Threshold value */
  threshold: number;
  /** Whether the metric passed (actual <= threshold) */
  passed: boolean;
  /** Margin: positive = within budget, negative = over budget */
  delta: number;
}

/** Configuration for a page to be tested */
export interface PerformancePageConfig {
  /** URL path (e.g., '/move-in') */
  path: string;
  /** Human-readable page name */
  name: string;
}

/** Full run report saved to JSON — contains all page results from a single run */
export interface PerformanceRunReport {
  /** ISO 8601 timestamp when the run started */
  runTimestamp: string;
  /** Environment tested */
  environment: PerformanceEnvironment;
  /** Individual page results */
  pages: PagePerformanceResult[];
}
