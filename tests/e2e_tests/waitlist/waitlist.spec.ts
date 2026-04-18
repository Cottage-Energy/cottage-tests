import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { executeSQL } from '../../resources/utils/postgres';

const log = createLogger('Waitlist');

/**
 * Waitlist DB Persistence — regression guard
 *
 * Added after the Apr 18 ENG-2188 retrospective retest. The Apr 14
 * consolidated retest marked waitlist "⚠️ (no title — Fix #3)" — evidence
 * was "the waitlist page rendered; heading copy was missing". The submit
 * form was NOT exercised, so no Apr 14 row exists for the Wyoming
 * scenario. (The only Apr 14 WaitList row, #352, is a Dixon IL
 * existing-utility case — a different code path that correctly persists
 * address + reference.)
 *
 * The Apr 18 retest actually submitted the Wyoming no-service waitlist
 * form and confirmed:
 *   - A row IS created (verified row #353, email + name + zip populated)
 *   - `address` column is NULL despite the UI showing
 *     "155 N Nebraska Ave, Casper, WY"
 *   - `reference` column is NULL (no flow context like "Move In - No Service")
 *
 * Earlier rows #339 (zip 48933 Lansing), #340 (zip 82609), and #343
 * (Bill Upload, zip 82609) show the same NULL-address pattern from
 * Apr 1 — this is a LONG-STANDING data-loss bug on the no-service
 * waitlist branch, not a new regression. But the Apr 14 retest never
 * would have caught it either way because it stopped at "page
 * rendered" before submit.
 *
 * User/ops impact: ops cannot query WaitList by address to know which
 * customers are waiting for service at a specific market. Email + zip
 * are the only usable fields. Flow provenance is lost entirely.
 */

const WAITLIST_ADDRESS = '155 N Nebraska Ave, Casper';
const WAITLIST_ZIP = '82609';

test.describe('Waitlist — no-service address end-to-end', () => {
    test.describe.configure({ timeout: TIMEOUTS.TEST_UI, retries: 0 });

    test('Wyoming waitlist submit creates WaitList row with address + reference populated', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.MOVE_IN],
    }, async ({ page, moveInpage, waitlistPage }) => {
        const testEmail = `pgtest+tsk-waitlist-${Date.now()}@joinpublicgrid.com`;

        // /move-in pages on some environments auto-redirect via mi-session/start
        // before the user can interact. Install an early fetch block so the
        // first request is intercepted; addInitScript runs BEFORE page JS.
        // Using a string script because the callback body runs in the browser
        // (not Node) so Node-level lib types like `window` aren't available.
        await page.addInitScript(`
            (() => {
                var origFetch = window.fetch;
                window.fetch = function () {
                    var args = arguments;
                    var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
                    if (url.indexOf('mi-session/start') !== -1) {
                        return new Promise(function () { /* hang */ });
                    }
                    return origFetch.apply(this, args);
                };
            })();
        `);

        log.section('Step 1 — Navigate to /move-in (no shortCode, standard flow)');
        await page.goto('/move-in');
        // Wait for the welcome page's Get Started button — it's an aria-labeled
        // role button that renders reliably, unlike the terms label which can
        // hydrate slower.
        await expect(moveInpage.Move_In_Get_Started_Button)
            .toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.section('Step 2 — Accept terms + Let\'s get started');
        await moveInpage.Agree_on_Terms_and_Get_Started();

        log.section('Step 3 — Enter Wyoming no-service address');
        await expect(moveInpage.Move_In_Address_Field).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await moveInpage.Move_In_Address_Field.pressSequentially(WAITLIST_ADDRESS, { delay: 50 });
        // Use MoveInPage.Move_In_Address_Dropdown to select the Google Places
        // suggestion. The locator function takes the street text and matches
        // the custom autocomplete dropdown via the POM.
        const autocompleteOption = moveInpage.Move_In_Address_Dropdown(WAITLIST_ADDRESS);
        await expect(autocompleteOption).toBeVisible({ timeout: TIMEOUTS.LONG });
        await autocompleteOption.click();
        await expect(moveInpage.Move_In_Address_Field)
            .toHaveValue(/82609/, { timeout: TIMEOUTS.MEDIUM });
        await moveInpage.Next_Move_In_Button();

        log.section('Step 4 — Waitlist page renders with heading (Tomy Fix #3)');
        await waitlistPage.expectVisible();

        log.section('Step 5 — Fill waitlist form + submit');
        await waitlistPage.fillForm('Waitlist Retest', testEmail, WAITLIST_ZIP);
        await waitlistPage.submit();

        log.section('Step 6 — Success toast appears');
        await waitlistPage.expectReceivedToast();

        log.section('Step 7 — DB row created with ALL fields populated');
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        const rows = await executeSQL<{
            id: number;
            email: string;
            name: string | null;
            address: string | null;
            zip: string | null;
            reference: string | null;
        }>(
            `SELECT id, email, name, address, zip, reference FROM "WaitList"
             WHERE email = '${testEmail}' ORDER BY created_at DESC LIMIT 1`,
        );

        expect(rows.length).toBe(1);
        expect(rows[0].email).toBe(testEmail);
        expect(rows[0].name).toBe('Waitlist Retest');
        expect(rows[0].zip).toBe(WAITLIST_ZIP);

        // Regression guard for the known data-loss bug (Apr 18 retest, Finding
        // #2): the no-service waitlist branch persists email/name/zip but
        // drops `address` and `reference`. This test is EXPECTED TO FAIL until
        // dev fixes the persistence. When the fix lands, all three soft
        // assertions below should go green automatically — no test change
        // needed. If the product team decides NULL address is by-design,
        // delete these three assertions and document it in the header.
        expect.soft(rows[0].address, 'address must persist on waitlist row')
            .not.toBeNull();
        if (rows[0].address !== null) {
            expect.soft(rows[0].address, 'address must match submitted street')
                .toContain('Nebraska Ave');
        }
        expect.soft(rows[0].reference, 'reference (flow context) must persist')
            .not.toBeNull();
    });
});

test.describe('Waitlist — DB invariants', () => {
    test.describe.configure({ timeout: TIMEOUTS.TEST_UI, retries: 0 });

    test('All recent WaitList rows have email populated', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async () => {
        // Email is the minimum-viable field — it's how ops notify a
        // customer when service arrives. Losing it means the row is
        // useless. Zip is NOT asserted here because the existing-utility
        // branch (e.g. row #352) legitimately writes zip as NULL.
        const rows = await executeSQL<{ count: string }>(
            `SELECT count(*)::text as count FROM "WaitList"
             WHERE created_at > now() - interval '30 days'
             AND email IS NULL`,
        );
        const invalidCount = parseInt(rows[0].count, 10);
        log.info('WaitList rows missing email (last 30d)', { count: invalidCount });
        expect(invalidCount).toBe(0);
    });
});
