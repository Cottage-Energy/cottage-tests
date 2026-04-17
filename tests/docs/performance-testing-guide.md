# Performance Testing Guide

## Overview

The performance test suite measures page load performance using Playwright's native Performance API access. No external dependencies — all metrics come from browser-native `PerformanceObserver` and Navigation Timing API via `page.evaluate()`.

**8 tests**: 6 public pages + 2 authenticated pages.

## What's Measured

### Navigation Timing (from `PerformanceNavigationTiming`)
| Metric | Formula | What it tells you |
|--------|---------|-------------------|
| TTFB | `responseStart - requestStart` | Server response time (includes DNS, TCP, TLS, server processing) |
| DOM Content Loaded | `domContentLoadedEventEnd - fetchStart` | HTML parsed + deferred scripts executed |
| Page Load | `loadEventEnd - fetchStart` | Everything loaded (images, stylesheets, scripts) |
| DOM Interactive | `domInteractive - fetchStart` | DOM ready for JS interaction |
| DNS Lookup | `domainLookupEnd - domainLookupStart` | DNS resolution time |
| TCP Connection | `connectEnd - connectStart` | TCP handshake |
| Server Response | `responseEnd - requestStart` | Full server response transfer |
| DOM Parsing | `domInteractive - responseEnd` | Browser parsing HTML into DOM |

### Core Web Vitals (from `PerformanceObserver`)
| Metric | What it measures | Google "Good" threshold |
|--------|-----------------|------------------------|
| LCP (Largest Contentful Paint) | When the largest visible element renders | < 2,500ms |
| CLS (Cumulative Layout Shift) | Visual stability — how much content shifts | < 0.1 |

### Resource Metrics (from `PerformanceResourceTiming`)
- Total resource count
- Total transfer size (bytes)
- Breakdown by type: script, css, img, fetch, etc.

## Pages Tested

### Public Pages (no auth required)
| Page | Path | Notes |
|------|------|-------|
| Homepage | `/` | Static-heavy, SSR/ISR |
| Move-In | `/move-in` | High TTFB due to SSR data fetching |
| Move-In (shortcode) | `/move-in?shortCode=autotest` | Partner-branded entry |
| Sign In | `/sign-in` | Light page, auth UI |
| Transfer | `/transfer` | Transfer flow entry |
| Bill Upload Connect | `/bill-upload/connect-account` | Non-billing flow entry |

### Authenticated Pages (OTP sign-in via Fastmail)
| Page | Path | Notes |
|------|------|-------|
| Overview Dashboard | `/app/overview` | Main dashboard, multiple API calls |
| Billing | `/app/billing` | Bill history, payment status |

## How to Run

```bash
# Full suite (public + authenticated)
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance

# Public pages only
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/performance_tests/public_pages_perf.spec.ts --project=Performance

# Against TanStack (auto-detects environment, scales thresholds 1.2x)
BASE_URL=https://tanstack-dev.onepublicgrid.com PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance

# With custom test user for authenticated pages
PERF_TEST_EMAIL=pgtest+someuser@joinpublicgrid.com PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance
```

## Thresholds

### Default Thresholds (dev baseline)
| Metric | Threshold | Google "Good" | Why higher |
|--------|-----------|---------------|------------|
| TTFB | 2,000ms | 800ms | Dev has no CDN, cold starts |
| LCP | 6,000ms | 2,500ms | Debug bundles, no optimization |
| CLS | 0.25 | 0.1 | "Needs improvement" range |
| DOM Content Loaded | 8,000ms | — | SSR + hydration overhead |
| Page Load | 15,000ms | — | Full resource loading |

### Environment Multipliers
Thresholds scale by environment. CLS is excluded (layout stability doesn't depend on speed).

| Environment | Multiplier | Effect on 2,000ms TTFB |
|-------------|-----------|------------------------|
| dev | 1.0x | 2,000ms |
| tanstack-dev | 1.2x | 2,400ms |
| staging | 0.8x | 1,600ms |
| production | 0.6x | 1,200ms |

### Page-Specific Overrides
Some pages have custom thresholds (e.g., `/move-in` has TTFB 5,000ms due to SSR). See `tests/resources/constants/performanceThresholds.ts`.

## Results & Baselines

Results are saved automatically after each run to `tests/performance_tests/results/`:

| File | Purpose |
|------|---------|
| `perf-latest.json` | Most recent run (overwritten each time) |
| `perf-{env}-{date}.json` | Timestamped snapshot (e.g., `perf-dev-2026-04-17.json`) |

The results directory is gitignored — baselines are local. To share, copy to `tests/test_reports/`.

### JSON Structure
```json
{
  "runTimestamp": "2026-04-17T01:40:04.105Z",
  "environment": "dev",
  "pages": [
    {
      "url": "/",
      "environment": "dev",
      "timestamp": "...",
      "navigation": { "ttfb": 559, "domContentLoaded": 871, ... },
      "webVitals": { "lcp": 952, "cls": 0.134 },
      "resources": { "totalResources": 47, "totalTransferSize": 1527508, "resourcesByType": { ... } }
    }
  ]
}
```

## Architecture

| File | Purpose |
|------|---------|
| `tests/resources/types/performance.types.ts` | All type definitions |
| `tests/resources/constants/performanceThresholds.ts` | Thresholds, multipliers, page overrides, `getThresholdsForPage()` |
| `tests/resources/utils/performanceHelper.ts` | Metric collection, assertion, logging, environment detection |
| `tests/performance_tests/public_pages_perf.spec.ts` | 6 public page tests (data-driven) |
| `tests/performance_tests/authenticated_pages_perf.spec.ts` | 2 authenticated tests (OTP + storage state) |
| `playwright.config.ts` | `Performance` project (Chromium-only, no retries, no screenshots) |

### Key Design Decisions
- **Chromium only**: PerformanceObserver for LCP is best-supported in Chromium. Cross-browser noise eliminated.
- **No retries**: Retries mask real regressions.
- **No screenshots/video/trace**: These add overhead and skew timing.
- **Serial execution**: `fullyParallel: false` avoids resource contention.
- **`expect.soft()`**: All metrics checked even if one fails — full picture on every run.
- **`addInitScript()`**: Observers injected before navigation, survive page transitions.
- **Auth skip on failure**: If login fails, authenticated tests are skipped (not crashed).

## Adding New Pages

1. Add to the `PUBLIC_PAGES` or `AUTHENTICATED_PAGES` array in the relevant spec file
2. Optionally add page-specific thresholds in `performanceThresholds.ts` → `PAGE_SPECIFIC_THRESHOLDS`
3. Run and verify the new page passes thresholds

## Calibrating Thresholds

Thresholds should be calibrated from real data, not guessed:

1. Run the suite 3-5 times across different times of day
2. Look at the range of values for each metric
3. Set threshold at roughly the 95th percentile observed value
4. Review and tighten quarterly as the app improves

**First calibration (Apr 17, 2026)**: Initial thresholds were set at Google "Good" levels, failed on first run (homepage TTFB 1,515ms vs 800ms threshold). Raised to dev-realistic values after 2 calibration rounds. Move-in pages got custom TTFB override (5,000ms) due to consistent SSR cold-start behavior.

## Comparison Reports

To compare environments (e.g., Next.js vs TanStack):
1. Run against environment A → baseline saved
2. Run against environment B → baseline saved
3. Compare the two JSON files side by side
4. Generate a markdown report in `tests/test_reports/`

See `tests/test_reports/ENG-2188_performance_comparison_2026-04-17.md` for an example comparison report.
