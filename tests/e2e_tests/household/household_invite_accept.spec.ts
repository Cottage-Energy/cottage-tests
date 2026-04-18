import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { executeSQL } from '../../resources/utils/postgres';
import {
    findSeedablePropertyGroup,
    seedPendingInvite,
    deleteSeededInvite,
    deleteAuthUserByEmail,
    type SeededInvite,
} from '../../resources/fixtures/database/householdQueries';

const log = createLogger('HouseholdInvite');

/**
 * Household Invite Accept Flow — regression guard
 *
 * Added after the Apr 17 ENG-2188 retrospective retest showed that 3
 * consecutive Apr 13/14 household invites sat in PropertyGroupResident
 * with status=pending, cottageUserID=null — because the Apr 14 retest
 * only verified "invite row created" and never walked the recipient
 * side of the flow. This is an evidence-of-artifact vs evidence-of-effect
 * gap: the downstream effect (another user actually joining the household)
 * was never confirmed.
 *
 * Seeds a fresh pending invite in Supabase, walks the accept flow, and
 * cleans up both the seeded row and the newly-created auth user.
 */

const TEST_INVITEE_EMAIL_PREFIX = 'pgtest+tsk-hh-invitee';

test.describe('Household invite — recipient accept flow', () => {
    test.describe.configure({ timeout: TIMEOUTS.TEST_MOVE_IN, retries: 0 });

    // Track seeded state across a single test so afterEach can clean up.
    // afterEach is preferred over try/finally because it runs even if the
    // test itself throws partway, keeping the DB clean.
    let seeded: SeededInvite | null = null;
    let inviteeEmail: string | null = null;

    test.afterEach(async () => {
        log.section('Teardown — delete seeded invite + invitee auth user');
        if (seeded) await deleteSeededInvite(seeded.pgrId);
        if (inviteeEmail) await deleteAuthUserByEmail(inviteeEmail);
        seeded = null;
        inviteeEmail = null;
    });

    test('Recipient accepts seeded pending invite -> household membership recorded', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.NEW_USER],
    }, async ({ page, residentInvitePage, overviewPage }) => {
        inviteeEmail = `${TEST_INVITEE_EMAIL_PREFIX}-${Date.now()}@joinpublicgrid.com`;

        log.section('Setup — seed pending invite into a known-good PropertyGroup');
        const owner = await findSeedablePropertyGroup();
        if (!owner) {
            test.skip(true, 'No seedable PropertyGroup found in dev');
            return;
        }
        seeded = await seedPendingInvite(owner.propertyGroupId, inviteeEmail, owner.ownerEmail);
        log.info('Using seeded invite', { code: seeded.inviteCode, owner: owner.ownerEmail });

        log.section('Step 1 — Open invite-accept page with inviteCode');
        await residentInvitePage.navigateWithCode(seeded.inviteCode);
        await residentInvitePage.expectAcceptFormVisible();

        log.section('Step 2 — Fill + submit accept form');
        await residentInvitePage.fillAcceptForm('Invitee', `Retest-${Date.now()}`);
        await residentInvitePage.submitAccept();

        log.section('Step 3 — Redirects through /session-init to /app/overview');
        await page.waitForURL(/\/app\/overview/, { timeout: TIMEOUTS.LONG });

        log.section('Step 4 — Handle password + terms dialogs (new users always see these)');
        // Accept_New_Terms_And_Conditions handles BOTH the Set-Up-Password
        // dialog (triggered by Supabase for all freshly-created users) and
        // the new-terms-modal in one call. See overview_dashboard_page.ts.
        await overviewPage.Accept_New_Terms_And_Conditions();

        log.section('Step 5 — DB: invite transitioned pending -> accepted');
        const rows = await executeSQL<{
            status: string;
            cottageUserID: string | null;
            email: string;
        }>(
            `SELECT status, "cottageUserID", email FROM "PropertyGroupResident" WHERE "inviteCode" = '${seeded.inviteCode}'`,
        );
        expect(rows.length).toBe(1);
        expect(rows[0].status).toBe('accepted');
        expect(rows[0].cottageUserID).not.toBeNull();
    });

    test('Invalid inviteCode shows appropriate error', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async ({ residentInvitePage }) => {
        await residentInvitePage.navigateWithCode('invalid-code-12345');
        await residentInvitePage.expectInvalidInvitation();
    });
});

test.describe('Household invite — DB invariants', () => {
    test.describe.configure({ timeout: TIMEOUTS.TEST_UI, retries: 0 });

    test('No stuck-pending invites accumulate past a reasonable window', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async () => {
        // Invites older than 30 days still in pending are either expired/stale
        // or indicate recipients hitting an accept flow that silently fails.
        // If this count spikes, we likely regressed the accept flow.
        const rows = await executeSQL<{ count: string }>(
            `SELECT count(*)::text as count FROM "PropertyGroupResident"
             WHERE status = 'pending' AND invited_at < now() - interval '30 days'`,
        );
        const stalePendingCount = parseInt(rows[0].count, 10);
        log.info('Stale pending invites', { count: stalePendingCount });
        // Soft threshold — adjust if the business intentionally keeps them
        expect(stalePendingCount).toBeLessThan(100);
    });
});
