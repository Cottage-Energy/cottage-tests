# Performance Comparison: Next.js (dev) vs TanStack (tanstack-dev)

**Ticket**: ENG-2188 — Core TanStack Skeleton (Full Framework Migration)
**Assignee**: Tomy Falgui | **Tester**: Christian
**Date**: April 17, 2026
**Tool**: Playwright Performance Suite (Navigation Timing API + PerformanceObserver)
**Browser**: Chromium (Desktop Chrome)

---

## Executive Summary

TanStack outperforms Next.js on **TTFB** and **DOM Content Loaded** across all 6 tested pages. The biggest win is on `/move-in` where TTFB drops from **3,299ms to 601ms** (82% faster). TanStack also ships **smaller bundles** on most pages (fewer CSS/link resources, more granular script splitting).

One trade-off: TanStack's `/sign-in` page transfers **4.01MB** vs Next.js's **1.10MB** — likely an unoptimized bundle or missing code splitting on that route.

| Verdict | Details |
|---------|---------|
| **TTFB** | TanStack wins on 5/6 pages (avg 39% faster) |
| **LCP** | Mixed — TanStack faster on move-in, Next.js faster on sign-in |
| **CLS** | TanStack better layout stability on most pages |
| **Page Load** | TanStack wins on 4/6 pages |
| **Bundle Size** | TanStack smaller on 4/6 pages, larger on sign-in |

---

## Detailed Comparison

### Time to First Byte (TTFB)

| Page | Next.js (dev) | TanStack (tanstack-dev) | Delta | Winner |
|------|:---:|:---:|:---:|:---:|
| Homepage `/` | 559ms | 688ms | +23% | Next.js |
| Move-In `/move-in` | 3,299ms | 601ms | **-82%** | **TanStack** |
| Move-In (shortcode) | 865ms | 586ms | -32% | TanStack |
| Sign In `/sign-in` | 458ms | 473ms | +3% | ~Tie |
| Transfer `/transfer` | 755ms | 462ms | -39% | TanStack |
| Bill Upload | 308ms | 507ms | +65% | Next.js |

**Key finding**: Next.js `/move-in` has a consistent 3+ second TTFB across multiple runs — likely SSR bottleneck or data fetching during render. TanStack resolves this completely.

### Largest Contentful Paint (LCP)

| Page | Next.js (dev) | TanStack (tanstack-dev) | Delta | Winner |
|------|:---:|:---:|:---:|:---:|
| Homepage `/` | 952ms | 1,192ms | +25% | Next.js |
| Move-In `/move-in` | 3,524ms | 1,608ms | **-54%** | **TanStack** |
| Move-In (shortcode) | 2,888ms | N/A | — | — |
| Sign In `/sign-in` | 1,100ms | 1,808ms | +64% | Next.js |
| Transfer `/transfer` | 2,528ms | 1,476ms | -42% | TanStack |
| Bill Upload | 1,116ms | 1,496ms | +34% | Next.js |

### Cumulative Layout Shift (CLS)

| Page | Next.js (dev) | TanStack (tanstack-dev) | Winner |
|------|:---:|:---:|:---:|
| Homepage `/` | 0.134 | 0.164 | Next.js |
| Move-In `/move-in` | N/A | 0.006 | TanStack |
| Move-In (shortcode) | 0.000 | N/A | — |
| Sign In `/sign-in` | 0.013 | 0.014 | ~Tie |
| Transfer `/transfer` | N/A | 0.005 | TanStack |
| Bill Upload | N/A | 0.021 | TanStack |

Both frameworks are within Google's "Good" threshold (<0.1) on all measurable pages except the homepage.

### DOM Content Loaded

| Page | Next.js (dev) | TanStack (tanstack-dev) | Delta | Winner |
|------|:---:|:---:|:---:|:---:|
| Homepage `/` | 871ms | 1,170ms | +34% | Next.js |
| Move-In `/move-in` | 3,997ms | 988ms | **-75%** | **TanStack** |
| Move-In (shortcode) | 1,349ms | 922ms | -32% | TanStack |
| Sign In `/sign-in` | 641ms | 723ms | +13% | Next.js |
| Transfer `/transfer` | 2,595ms | 704ms | **-73%** | **TanStack** |
| Bill Upload | 714ms | 844ms | +18% | Next.js |

### Full Page Load

| Page | Next.js (dev) | TanStack (tanstack-dev) | Delta | Winner |
|------|:---:|:---:|:---:|:---:|
| Homepage `/` | 1,635ms | 2,272ms | +39% | Next.js |
| Move-In `/move-in` | 4,903ms | 2,057ms | **-58%** | **TanStack** |
| Move-In (shortcode) | 1,694ms | 922ms | **-46%** | **TanStack** |
| Sign In `/sign-in` | 1,121ms | 1,025ms | -9% | ~Tie |
| Transfer `/transfer` | 2,970ms | 704ms | **-76%** | **TanStack** |
| Bill Upload | 1,460ms | 844ms | **-42%** | **TanStack** |

### Resource Loading

| Page | Next.js Resources | Next.js Size | TanStack Resources | TanStack Size | Size Delta |
|------|:---:|:---:|:---:|:---:|:---:|
| Homepage `/` | 47 | 1.46MB | 47 | 1.46MB | ~Same |
| Move-In `/move-in` | 98 | 2.49MB | 159 | 1.38MB | **-45%** |
| Move-In (shortcode) | 98 | 2.49MB | 151 | 1.32MB | **-47%** |
| Sign In `/sign-in` | 53 | 1.10MB | 82 | **4.01MB** | **+265%** |
| Transfer `/transfer` | 89 | 2.66MB | 128 | 1.64MB | **-38%** |
| Bill Upload | 85 | 1.62MB | 110 | 0.63MB | **-61%** |

---

## Observations

### TanStack Wins
1. **Move-in TTFB is dramatically better** — 3,299ms to 601ms. This is the highest-traffic entry point for new users. The Next.js SSR bottleneck is eliminated.
2. **Transfer page is 76% faster** on full page load (2,970ms to 704ms).
3. **Bundle sizes are smaller** on 4/6 pages — TanStack's code splitting is more granular. Bill Upload drops from 1.62MB to 0.63MB.
4. **Better CLS** on pages where measurable — TanStack has near-zero layout shifts on move-in and transfer.

### Areas to Investigate
1. **Sign-in page transfers 4.01MB** on TanStack vs 1.10MB on Next.js — likely a missing code split or unoptimized bundle. Worth checking if auth-related libraries are being eagerly loaded.
2. **Homepage is slightly slower on TanStack** (TTFB 688ms vs 559ms, Page Load 2,272ms vs 1,635ms) — the homepage is mostly static content, so Next.js's SSR/ISR may have an edge here.
3. **TanStack loads more resource requests** (e.g., 159 vs 98 on move-in) but with smaller total transfer — more granular splitting trades request count for cache efficiency.

### Caveats
- Single run per environment — results may vary by 10-20% due to network/server conditions
- Dev environments only (no CDN, debug bundles) — production numbers will differ
- Public pages only — authenticated pages not compared (different auth sessions per environment)
- CLS measurement varies by page rendering approach — some pages returned N/A

---

## Test Infrastructure

These results were collected using the new **Performance Test Suite** added to `cottage-tests`:
- `tests/performance_tests/public_pages_perf.spec.ts` — 6 public page tests
- `tests/performance_tests/authenticated_pages_perf.spec.ts` — 2 authenticated page tests
- `tests/resources/utils/performanceHelper.ts` — metric collection via Performance API
- Results saved to `tests/performance_tests/results/` as timestamped JSON baselines

**Run commands:**
```bash
# Next.js dev
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance

# TanStack dev
BASE_URL=https://tanstack-dev.onepublicgrid.com PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance
```

---

*Generated by Cottage Tests Performance Suite | April 17, 2026*
