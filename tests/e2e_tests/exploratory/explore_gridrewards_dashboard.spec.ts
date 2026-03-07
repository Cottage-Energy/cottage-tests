import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('Exploratory:GridRewards:Dashboard');

/**
 * Exploratory tests for GridRewards demand response dashboard card and enrollment modal.
 * Ticket: ENG-2373
 *
 * Investigating:
 * - TC-015: No card when building has DR enabled but no provider configured
 * - TC-026: Modal close methods (X button, outside click, Esc key)
 * - TC-036: PostHog event fires on dashboard enrollment
 * - TC-042: Accordion component regression (shared component modified in PR)
 *
 * Prerequisites:
 * - Test user accounts with different enrollment states (set via Supabase)
 * - AvalonBay building with shouldShowDemandResponse = true and demandResponseProviderID set
 * - User must have an electric account linked
 * - User must be an owner (not a roommate) for card visibility
 */

/** Encouraged conversion entry for DR-enabled AvalonBay building (for accordion test) */
const DR_ENABLED_SHORTCODE = 'TODO_DR_ENABLED_SHORTCODE';

/** Dashboard URL */
const DASHBOARD_URL = '/app/overview';

/** Login URL */
const LOGIN_URL = '/login';

/** Test user credentials — replace with actual test accounts */
const TEST_USERS = {
  /** Owner with electric account, no enrollment, DR-enabled building */
  ownerNoDrProvider: {
    email: 'TODO_OWNER_NO_PROVIDER@test.com',
    password: 'TODO_PASSWORD',
  },
  /** Owner with electric account, no enrollment, DR-enabled building with provider */
  ownerGetStarted: {
    email: 'TODO_OWNER_GET_STARTED@test.com',
    password: 'TODO_PASSWORD',
  },
};

test.describe('Explore: GridRewards Dashboard Card & Modal (ENG-2373)', () => {
  test.describe.configure({ retries: 0 });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  // ─── TC-015: No card when building DR enabled but no provider ──────
  test('TC-015: No DR card when building has DR enabled but no provider configured', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: resident with electric account, no enrollment, building DR enabled but no provider');
    log.info('Expected: no demand response card shown on dashboard');

    log.section('Investigation');
    log.step(1, 'Log in as owner with electric account on building with no DR provider');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    // TODO: Implement login with TEST_USERS.ownerNoDrProvider
    // await page.getByLabel('Email').fill(TEST_USERS.ownerNoDrProvider.email);
    // await page.getByLabel('Password').fill(TEST_USERS.ownerNoDrProvider.password);
    // await page.getByRole('button', { name: /sign in|log in/i }).click();

    log.step(2, 'Navigate to dashboard');
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    log.step(3, 'Check for demand response card — should NOT be visible');
    // Look for the card content from each state
    const getStartedCard = page.getByText('Get paid to save energy');
    const pendingCard = page.getByText(/pending|processing/i);
    const enrolledCard = page.getByText('GridRewards').first();

    const isGetStartedVisible = await getStartedCard.isVisible().catch(() => false);
    const isPendingVisible = await pendingCard.isVisible().catch(() => false);
    const isEnrolledVisible = await enrolledCard.isVisible().catch(() => false);

    log.info('Dashboard card visibility', {
      getStarted: isGetStartedVisible,
      pending: isPendingVisible,
      enrolled: isEnrolledVisible,
    });

    log.section('Findings');
    expect.soft(isGetStartedVisible, 'Get Started card should NOT be visible').toBe(false);
    expect.soft(isPendingVisible, 'Pending card should NOT be visible').toBe(false);
    expect.soft(isEnrolledVisible, 'Enrolled card should NOT be visible').toBe(false);
  });

  // ─── TC-026: Modal close methods ───────────────────────────────────
  test('TC-026: Enrollment modal close via X button, outside click, and Esc', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: all methods to dismiss the enrollment modal without enrolling');
    log.info('Expected: modal closes, no enrollment created, card remains in Get Started state');

    log.section('Investigation');
    log.step(1, 'Log in as owner with Get Started card visible');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    // TODO: Implement login with TEST_USERS.ownerGetStarted

    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // ── Close via "Maybe later" button ──
    log.step(2, 'Open modal via "Get started" button');
    const getStartedButton = page.getByRole('button', { name: /Get started/i });
    // TODO: Uncomment once logged in
    // await getStartedButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    log.step(3, 'Close modal via "Maybe later" button');
    const maybeLaterButton = page.getByRole('button', { name: /Maybe later/i });
    // await maybeLaterButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const isModalVisibleAfterMaybeLater = await page.getByText('Get paid to save energy').locator('..').locator('[role="dialog"]').isVisible().catch(() => false);
    log.info('Modal visible after "Maybe later"', { visible: isModalVisibleAfterMaybeLater });

    // ── Close via X button ──
    log.step(4, 'Open modal again and close via X button');
    // await getStartedButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    // Look for close button (X) in the modal dialog
    const closeButton = page.locator('[role="dialog"]').getByRole('button', { name: /close/i }).or(
      page.locator('[role="dialog"] button').filter({ has: page.locator('svg') }).first()
    );
    // await closeButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const isModalVisibleAfterX = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    log.info('Modal visible after X button', { visible: isModalVisibleAfterX });

    // ── Close via Esc key ──
    log.step(5, 'Open modal again and close via Esc key');
    // await getStartedButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
    // await page.keyboard.press('Escape');
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const isModalVisibleAfterEsc = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    log.info('Modal visible after Esc key', { visible: isModalVisibleAfterEsc });

    // ── Close via outside click ──
    log.step(6, 'Open modal again and close via clicking outside');
    // await getStartedButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    // Click on the overlay/backdrop behind the modal
    // await page.locator('[data-state="open"]').first().click({ position: { x: 10, y: 10 }, force: true });
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const isModalVisibleAfterOutsideClick = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    log.info('Modal visible after outside click', { visible: isModalVisibleAfterOutsideClick });

    log.step(7, 'Verify card still shows Get Started state after all dismissals');
    const cardStillGetStarted = await page.getByText('Get paid to save energy').isVisible().catch(() => false);
    log.info('Card still in Get Started state', { visible: cardStillGetStarted });

    log.section('Findings');
    log.info('TODO: Uncomment interaction steps once test user is configured and login works');
    log.info('Verify: no DemandResponseEnrollment record created after any dismiss method');
  });

  // ─── TC-036: PostHog event on dashboard enrollment ─────────────────
  test('TC-036: PostHog event fires when enrolling from dashboard modal', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: PostHog analytics event fires when user enrolls via dashboard modal');

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
          // Not JSON
        }
      }
      return route.continue();
    });

    log.section('Investigation');
    log.step(1, 'Log in as owner with Get Started card visible');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    // TODO: Implement login with TEST_USERS.ownerGetStarted

    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    log.step(2, 'Click "Get started" to open enrollment modal');
    // const getStartedButton = page.getByRole('button', { name: /Get started/i });
    // await getStartedButton.click();
    // await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    log.step(3, 'Verify consent checkbox is defaulted to checked');
    // const consentCheckbox = page.getByRole('checkbox', { name: /authorize|consent/i });
    // const isChecked = await consentCheckbox.isChecked();
    // log.info('Consent checkbox default state', { checked: isChecked });

    log.step(4, 'Click "Enroll for free"');
    // const enrollButton = page.getByRole('button', { name: /Enroll for free/i });
    // await enrollButton.click();
    // await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.step(5, 'Check PostHog events for enrollment');
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    log.section('Findings');
    const enrollmentEvents = posthogEvents.filter(
      (e) => e.event.toLowerCase().includes('enroll') ||
             e.event.toLowerCase().includes('demand_response') ||
             e.event.toLowerCase().includes('gridrewards') ||
             e.event.toLowerCase().includes('grid_rewards')
    );
    log.info('Enrollment-related PostHog events from dashboard', {
      count: enrollmentEvents.length,
      events: enrollmentEvents.map((e) => ({ event: e.event, props: e.properties })),
    });
    log.info('All captured PostHog event names', {
      events: posthogEvents.map((e) => e.event),
    });

    log.info('TODO: Uncomment steps once test user is configured');
    // expect.soft(enrollmentEvents.length, 'Should fire PostHog event for dashboard enrollment').toBeGreaterThan(0);
  });

  // ─── TC-042: Accordion component regression ────────────────────────
  test('TC-042: Accordion component — no regression after PR changes', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    log.info('Investigating: PR #1050 modified packages/ui/src/accordion.tsx');
    log.info('Verifying: accordion expand/collapse works normally on pages that use it');

    log.section('Investigation');
    log.step(1, 'Navigate to a page that uses the accordion component');
    // The "What is GridRewards?" collapsible section uses an accordion
    // Also check other pages that use accordions (FAQ, settings, etc.)
    await page.goto(`/move-in?shortCode=${DR_ENABLED_SHORTCODE}`, { waitUntil: 'domcontentloaded' });

    log.step(2, 'Progress to welcome page where "What is GridRewards?" accordion exists');
    // TODO: Navigate to the welcome page

    log.step(3, 'Find and interact with accordion/collapsible sections');
    const accordionTrigger = page.getByText('What is GridRewards?');
    const isAccordionVisible = await accordionTrigger.isVisible().catch(() => false);
    log.info('Accordion trigger visible', { visible: isAccordionVisible });

    if (isAccordionVisible) {
      // Expand
      await accordionTrigger.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);

      // Check if content expanded — look for description text from ticket
      const expandedContent = page.getByText(/Earn money for using less energy|demand hours/i);
      const isExpanded = await expandedContent.isVisible().catch(() => false);
      log.info('Accordion expanded', { contentVisible: isExpanded });

      // Collapse
      await accordionTrigger.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);

      const isCollapsed = !(await expandedContent.isVisible().catch(() => false));
      log.info('Accordion collapsed', { contentHidden: isCollapsed });

      expect.soft(isExpanded, 'Accordion content should be visible when expanded').toBe(true);
      expect.soft(isCollapsed, 'Accordion content should be hidden when collapsed').toBe(true);
    } else {
      log.warn('Accordion trigger not found — may need to navigate further into the flow');
    }

    log.step(4, 'Check for JS errors during accordion interaction');
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    log.section('Findings');
    log.info('Console errors during accordion interaction', {
      count: consoleErrors.length,
      errors: consoleErrors,
    });
    expect.soft(consoleErrors.length, 'No JS console errors during accordion interaction').toBe(0);
  });
});
