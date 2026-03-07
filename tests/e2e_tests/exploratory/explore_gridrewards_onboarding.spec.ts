import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('Exploratory:GridRewards:Onboarding');

/**
 * Exploratory tests for GridRewards demand response toggle in the onboarding flow.
 * Ticket: ENG-2373
 *
 * Investigating:
 * - TC-003: Toggle hidden when building has DR enabled but no provider configured
 * - TC-008: Toggle state cycling (ON → OFF → ON) — final state honored on submit
 * - TC-034: PostHog event fires on toggle interaction
 * - TC-035: PostHog event fires on enrollment during onboarding
 * - TC-037: No enrollment event when toggle is OFF
 *
 * Prerequisites:
 * - AvalonBay building with shouldShowDemandResponse = true and demandResponseProviderID set
 * - A second building with shouldShowDemandResponse = true but demandResponseProviderID = null
 * - Encouraged conversion shortcode for each building
 */

/** Encouraged conversion entry for DR-enabled AvalonBay building */
const DR_ENABLED_SHORTCODE = 'TODO_DR_ENABLED_SHORTCODE';
/** Encouraged conversion entry for building with DR enabled but no provider */
const DR_NO_PROVIDER_SHORTCODE = 'TODO_DR_NO_PROVIDER_SHORTCODE';

test.describe('Explore: GridRewards Onboarding Toggle (ENG-2373)', () => {
  test.describe.configure({ retries: 0 });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  // ─── TC-003: Toggle hidden when no provider configured ─────────────
  test('TC-003: Toggle hidden when building has DR enabled but no provider', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page, moveInpage }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: building has shouldShowDemandResponse=true but demandResponseProviderID=null');
    log.info('Expected: GridRewards toggle should NOT appear on welcome page');

    log.section('Investigation');
    log.step(1, 'Navigate to encouraged conversion flow for building with no DR provider');
    await page.goto(`/move-in?shortCode=${DR_NO_PROVIDER_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress through terms to welcome page');
    // TODO: Accept terms and navigate to the welcome/utility setup page
    // Use moveInpage POM methods once flow is identified:
    // await moveInpage.Move_In_Terms_Checkbox.check();
    // await moveInpage.Move_In_Get_Started_Button.click();

    log.step(3, 'Verify GridRewards toggle is NOT visible');
    // The toggle text from the ticket: "Enroll in GridRewards, get notifications"
    const gridRewardsToggle = page.getByText('Enroll in GridRewards');
    const isToggleVisible = await gridRewardsToggle.isVisible().catch(() => false);
    log.info('GridRewards toggle visibility', { visible: isToggleVisible });

    log.step(4, 'Verify renewable energy toggle still works independently');
    const renewableToggle = moveInpage.Move_In_Renewable_Energy_Switch;
    const isRenewableVisible = await renewableToggle.isVisible().catch(() => false);
    log.info('Renewable energy toggle visibility', { visible: isRenewableVisible });

    log.section('Findings');
    expect.soft(isToggleVisible, 'GridRewards toggle should NOT be visible when no provider configured').toBe(false);
    expect.soft(isRenewableVisible, 'Renewable energy toggle should still be visible').toBe(true);
  });

  // ─── TC-008: Toggle ON → OFF → ON — final state honored ───────────
  test('TC-008: Toggle state cycling — final ON state creates enrollment', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page, moveInpage }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: toggling GridRewards ON → OFF → ON, then submitting');
    log.info('Expected: enrollment record created because final state is ON');

    log.section('Investigation');
    log.step(1, 'Navigate to encouraged conversion flow for DR-enabled building');
    await page.goto(`/move-in?shortCode=${DR_ENABLED_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress through terms to welcome page');
    // TODO: Accept terms and navigate to welcome page
    // await moveInpage.Move_In_Terms_Checkbox.check();
    // await moveInpage.Move_In_Get_Started_Button.click();

    log.step(3, 'Verify toggle defaults to ON');
    const gridRewardsToggle = page.getByRole('switch', { name: /GridRewards|demand response/i });
    const isCheckedInitially = await gridRewardsToggle.isChecked().catch(() => false);
    log.info('Toggle initial state', { checked: isCheckedInitially });

    log.step(4, 'Cycle toggle: ON → OFF → ON');
    // Turn OFF
    await gridRewardsToggle.click();
    const afterFirstClick = await gridRewardsToggle.isChecked().catch(() => false);
    log.info('After first click (should be OFF)', { checked: afterFirstClick });

    // Turn back ON
    await gridRewardsToggle.click();
    const afterSecondClick = await gridRewardsToggle.isChecked().catch(() => false);
    log.info('After second click (should be ON)', { checked: afterSecondClick });

    log.step(5, 'Submit the form and verify enrollment created');
    // TODO: Complete form submission
    // After submission, query DemandResponseEnrollment via Supabase to verify record exists

    log.section('Findings');
    expect.soft(isCheckedInitially, 'Toggle should default to ON').toBe(true);
    expect.soft(afterFirstClick, 'Toggle should be OFF after first click').toBe(false);
    expect.soft(afterSecondClick, 'Toggle should be ON after second click').toBe(true);
    log.info('TODO: Verify DemandResponseEnrollment record created with PENDING_ENROLLMENT status');
  });

  // ─── TC-034: PostHog event on toggle interaction ───────────────────
  test('TC-034: PostHog event fires on GridRewards toggle interaction', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: PostHog analytics events when user interacts with GridRewards toggle');

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed: unknown = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              const typedEvt = evt as { event: string; properties: Record<string, unknown> };
              posthogEvents.push({ event: typedEvt.event, properties: typedEvt.properties });
              log.info('Captured PostHog event', { event: typedEvt.event });
            }
          }
        } catch {
          // Not JSON — ignore
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to encouraged conversion flow for DR-enabled building');
    await page.goto(`/move-in?shortCode=${DR_ENABLED_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to welcome page with GridRewards toggle');
    // TODO: Navigate through terms to welcome page

    log.step(3, 'Toggle GridRewards OFF');
    const gridRewardsToggle = page.getByRole('switch', { name: /GridRewards|demand response/i });
    await gridRewardsToggle.click();
    await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    log.step(4, 'Toggle GridRewards back ON');
    await gridRewardsToggle.click();
    await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    log.step(5, 'Check captured PostHog events for toggle interactions');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    // Look for demand response / GridRewards related events
    const drEvents = posthogEvents.filter(
      (e) => e.event.toLowerCase().includes('demand') ||
             e.event.toLowerCase().includes('gridrewards') ||
             e.event.toLowerCase().includes('grid_rewards') ||
             e.event.toLowerCase().includes('enrollment')
    );
    log.info('Demand response related PostHog events', {
      count: drEvents.length,
      events: drEvents.map((e) => ({ event: e.event, props: e.properties })),
    });
    log.info('All captured PostHog event names', {
      events: posthogEvents.map((e) => e.event),
    });

    expect.soft(drEvents.length, 'Should have PostHog events for toggle interaction').toBeGreaterThan(0);
  });

  // ─── TC-035: PostHog event on enrollment during onboarding ─────────
  test('TC-035: PostHog enrollment event fires on form submit with toggle ON', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: PostHog event fires when form is submitted with GridRewards toggle ON');

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed: unknown = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              const typedEvt = evt as { event: string; properties: Record<string, unknown> };
              posthogEvents.push({ event: typedEvt.event, properties: typedEvt.properties });
            }
          }
        } catch {
          // Not JSON
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to encouraged conversion flow for DR-enabled building');
    await page.goto(`/move-in?shortCode=${DR_ENABLED_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to welcome page — leave GridRewards toggle ON (default)');
    // TODO: Navigate through terms to welcome page

    log.step(3, 'Submit the form with toggle ON');
    // TODO: Submit the form and complete the step

    log.step(4, 'Check PostHog events for enrollment event');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const enrollmentEvents = posthogEvents.filter(
      (e) => e.event.toLowerCase().includes('enroll') ||
             e.event.toLowerCase().includes('demand_response') ||
             e.event.toLowerCase().includes('gridrewards')
    );
    log.info('Enrollment-related PostHog events', {
      count: enrollmentEvents.length,
      events: enrollmentEvents.map((e) => ({ event: e.event, props: e.properties })),
    });

    expect.soft(enrollmentEvents.length, 'Should fire PostHog event for enrollment').toBeGreaterThan(0);
  });

  // ─── TC-037: No enrollment event when toggle OFF ───────────────────
  test('TC-037: No enrollment PostHog event when toggle is OFF', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: no enrollment event fires when GridRewards toggle is OFF and form is submitted');

    // Capture PostHog events
    const posthogEvents: Array<{ event: string; properties: Record<string, unknown> }> = [];
    await page.route('**/us.i.posthog.com/e**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        try {
          const parsed: unknown = JSON.parse(postData);
          if (Array.isArray(parsed)) {
            for (const evt of parsed) {
              const typedEvt = evt as { event: string; properties: Record<string, unknown> };
              posthogEvents.push({ event: typedEvt.event, properties: typedEvt.properties });
            }
          }
        } catch {
          // Not JSON
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Navigate to encouraged conversion flow for DR-enabled building');
    await page.goto(`/move-in?shortCode=${DR_ENABLED_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to welcome page and turn GridRewards toggle OFF');
    // TODO: Navigate through terms to welcome page
    const gridRewardsToggle = page.getByRole('switch', { name: /GridRewards|demand response/i });
    // TODO: Uncomment once toggle is reachable
    // await gridRewardsToggle.click(); // Turn OFF from default ON

    log.step(3, 'Submit the form with toggle OFF');
    // TODO: Submit the form

    log.step(4, 'Check PostHog events — no enrollment event should fire');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const enrollmentEvents = posthogEvents.filter(
      (e) => e.event.toLowerCase().includes('enroll') &&
             !e.event.toLowerCase().includes('opt_out')
    );
    log.info('Enrollment-related PostHog events (should be 0)', {
      count: enrollmentEvents.length,
      events: enrollmentEvents.map((e) => e.event),
    });

    // An opt-out toggle event may still fire — that's expected
    const optOutEvents = posthogEvents.filter(
      (e) => e.event.toLowerCase().includes('opt_out') ||
             e.event.toLowerCase().includes('toggle')
    );
    log.info('Opt-out / toggle events (may still fire)', {
      count: optOutEvents.length,
      events: optOutEvents.map((e) => e.event),
    });

    expect.soft(enrollmentEvents.length, 'No enrollment event should fire when toggle is OFF').toBe(0);
  });
});
