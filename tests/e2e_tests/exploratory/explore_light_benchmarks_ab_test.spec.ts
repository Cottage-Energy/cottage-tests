import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('Exploratory');

/** Light encouraged conversion entry point */
const LIGHT_ENCOURAGED_URL = '/move-in?shortCode=txtest';

test.describe('Explore: Light Plan Benchmarks A/B Test (ENG-2355)', () => {
  test.describe.configure({ retries: 0 });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  // ─── TC-010: Savings <= $5 — card hidden ───────────────────────────
  test('TC-010: Savings <= $5 — comparison card should not render', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: when savings are <= $5, the comparison card should be hidden');
    log.info('Precondition: PostHog variant = test, zip code area where PG and market prices are similar');

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress through flow to Plan/LOA step');
    // TODO: Navigate through terms → address (use a zip where savings are minimal) → reach overview
    // Need to identify a TX zip code where PG price is close to market average

    log.step(3, 'Check if comparison card is hidden when savings <= $5');
    // The card should not render — page should look like control variant
    // Look for absence of "What you'd pay" section

    log.section('Findings');
    log.info('Document: Does the card hide when savings are too low?');
    log.info('Document: What threshold triggers the hide? (expected: <= $5)');
    // expect.soft(comparisonCard).not.toBeVisible();
  });

  // ─── TC-011: Non-TX zip code ───────────────────────────────────────
  test('TC-011: Non-TX zip code — card should not render', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: Light.dev API only supports TX — non-TX zips should gracefully show no card');

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Enter a non-TX address and progress to Plan/LOA step');
    // TODO: Enter a non-TX zip (e.g., 90210 CA, 10001 NY)
    // Progress through flow to overview step

    log.step(3, 'Verify no comparison card and no JS errors');
    // Card should not appear
    // Check browser console for errors

    log.section('Findings');
    log.info('Document: Does the API return gracefully for non-TX zips?');
    log.info('Document: Any console errors or broken layout?');
  });

  // ─── TC-020: API failure — graceful degradation ────────────────────
  test('TC-020: API failure — page degrades gracefully to control layout', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: when /api/light/benchmarks fails, card should not render and flow should work normally');
    log.info('Precondition: PostHog variant = test');

    // Block the benchmarks API route
    await page.route('**/api/light/benchmarks**', (route) => {
      log.info('Intercepted benchmarks API request — returning 500');
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow with API blocked');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step');
    // TODO: Navigate through flow to overview step

    log.step(3, 'Verify no comparison card renders');
    // Page should look identical to control group

    log.step(4, 'Verify rest of flow works — terms, get started, back');
    // CTA buttons, navigation should all function normally

    log.step(5, 'Check browser console for JS errors');
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    log.section('Findings');
    log.info('Console errors captured', { count: consoleErrors.length, errors: consoleErrors });
    expect.soft(consoleErrors.length, 'No JS console errors expected').toBe(0);
  });

  // ─── TC-021: PostHog blocked — defaults to control ─────────────────
  test('TC-021: PostHog blocked — defaults to control variant', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: when PostHog SDK is blocked, useFeatureFlagVariantKey returns undefined → defaults to control');

    // Block PostHog SDK
    await page.route('**/*posthog*/**', (route) => {
      log.info('Blocked PostHog request', { url: route.request().url() });
      return route.abort();
    });
    await page.route('**/us.i.posthog.com/**', (route) => {
      log.info('Blocked PostHog tracking request', { url: route.request().url() });
      return route.abort();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow with PostHog blocked');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step');
    // TODO: Navigate through flow to overview step

    log.step(3, 'Verify control variant renders — no card, no benchmarks API call');
    // Should see "What\'s included" heading, not "What you\'d pay"
    // No network request to /api/light/benchmarks

    log.step(4, 'Check for JS errors');
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    log.section('Findings');
    log.info('Console errors captured', { count: consoleErrors.length, errors: consoleErrors });
    expect.soft(consoleErrors.length, 'No JS console errors when PostHog is blocked').toBe(0);
  });

  // ─── TC-022: API timeout (> 3s) ───────────────────────────────────
  test('TC-022: API timeout — card not shown after 3s delay', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: benchmarks API has a 3s timeout — simulating a slow response');
    log.info('Precondition: PostHog variant = test');

    // Delay the benchmarks API response beyond the 3s timeout
    await page.route('**/api/light/benchmarks**', async (route) => {
      log.info('Intercepted benchmarks API — delaying 5s to simulate timeout');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return route.fulfill({ status: 200, body: '{}' });
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow with slow API');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step');
    // TODO: Navigate through flow to overview step

    log.step(3, 'Wait for timeout period and verify card is not shown');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    // Card should not appear after the API times out

    log.step(4, 'Verify page remains functional');
    // Rest of the flow should work normally

    log.section('Findings');
    log.info('Document: Does the page wait for the card or load without it?');
    log.info('Document: Is there any loading spinner that gets stuck?');
  });

  // ─── TC-040: lightBenchmarksDisplayed PostHog event ────────────────
  test('TC-040: lightBenchmarksDisplayed event fires when card renders', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: when comparison card renders, lightBenchmarksDisplayed event should fire');
    log.info('Precondition: PostHog variant = test, TX zip, valid API response');

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              posthogEvents.push({ event: evt.event, properties: evt.properties });
              log.info('Captured PostHog event', { event: evt.event });
            }
          }
        } catch {
          // Not JSON — ignore
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step with TX address');
    // TODO: Navigate through flow with a TX zip (75201, 77001, 78701)

    log.step(3, 'Wait for card to render and check for PostHog event');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const benchmarkEvents = posthogEvents.filter((e) => e.event === 'lightBenchmarksDisplayed');
    log.info('lightBenchmarksDisplayed events captured', { count: benchmarkEvents.length });

    if (benchmarkEvents.length > 0) {
      const props = benchmarkEvents[0].properties;
      log.info('Event properties', {
        variant: props['variant'],
        pgMonthlyEstimate: props['pgMonthlyEstimate'],
        marketMonthlyEstimate: props['marketMonthlyEstimate'],
        monthlySavings: props['monthlySavings'],
        usageKwh: props['usageKwh'],
      });
    }

    expect.soft(benchmarkEvents.length, 'lightBenchmarksDisplayed should fire once').toBe(1);
  });

  // ─── TC-041: lightBenchmarksError PostHog event ────────────────────
  test('TC-041: lightBenchmarksError event fires on API failure', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: when benchmarks API fails, lightBenchmarksError event should fire');
    log.info('Precondition: PostHog variant = test, API returns error');

    // Block the benchmarks API
    await page.route('**/api/light/benchmarks**', (route) => {
      return route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              posthogEvents.push({ event: evt.event, properties: evt.properties });
              log.info('Captured PostHog event', { event: evt.event });
            }
          }
        } catch {
          // Not JSON
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow with API blocked');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step');
    // TODO: Navigate through flow to overview step

    log.step(3, 'Wait and check for error event');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const errorEvents = posthogEvents.filter((e) => e.event === 'lightBenchmarksError');
    log.info('lightBenchmarksError events captured', { count: errorEvents.length });

    if (errorEvents.length > 0) {
      log.info('Error event properties', {
        variant: errorEvents[0].properties['variant'],
        reason: errorEvents[0].properties['reason'],
      });
    }

    expect.soft(errorEvents.length, 'lightBenchmarksError should fire once on API failure').toBe(1);
  });

  // ─── TC-042: No PostHog events in control ──────────────────────────
  test('TC-042: No benchmark events fire in control variant', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: in control variant, no lightBenchmarks* events should fire');
    log.info('Precondition: PostHog variant = control');

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              posthogEvents.push({ event: evt.event, properties: evt.properties });
            }
          }
        } catch {
          // Not JSON
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to Light encouraged conversion flow (control variant)');
    await page.goto(LIGHT_ENCOURAGED_URL, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to Plan/LOA step');
    // TODO: Navigate through flow to overview step

    log.step(3, 'Wait and verify no benchmark events fired');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const benchmarkEvents = posthogEvents.filter(
      (e) => e.event === 'lightBenchmarksDisplayed' || e.event === 'lightBenchmarksError'
    );
    log.info('Benchmark-related events in control', { count: benchmarkEvents.length, events: benchmarkEvents });

    expect.soft(benchmarkEvents.length, 'No benchmark events should fire in control variant').toBe(0);
  });
});
