import { supabase } from '../../utils/supabase';
import { executeSQL } from '../../utils/postgres';
import { createLogger } from '../../utils/logger';

const log = createLogger('HouseholdQueries');

/**
 * Household / PropertyGroupResident query helpers.
 *
 * Used by household_invite_accept.spec.ts to seed a fresh pending invite
 * tied to a known-good test owner, so the recipient-accept flow can be
 * verified end-to-end without depending on customer data churn.
 */

export interface SeededInvite {
    pgrId: string;
    inviteCode: string;
    propertyGroupId: string;
    ownerEmail: string;
    inviteEmail: string;
}

/**
 * Pick a stable owner with a working PropertyGroup for seeding test invites.
 * Strategy: find any test-account user that has at least one
 * PropertyGroupResident WHERE status='accepted' AND cottageUserID IS NOT NULL
 * — that proves the propertyGroup actually accepts new members. Fall back to
 * the most-recently-accepted invite's group.
 */
export async function findSeedablePropertyGroup(): Promise<{
    propertyGroupId: string;
    ownerEmail: string;
} | null> {
    const rows = await executeSQL<{
        propertyGroupId: string;
        ownerEmail: string;
    }>(
        `SELECT pgr."propertyGroupID" as "propertyGroupId", au.email as "ownerEmail"
         FROM "PropertyGroupResident" pgr
         JOIN auth.users au ON au.id = pgr."cottageUserID"
         WHERE pgr.status = 'accepted'
           AND au.email ILIKE 'pgtest+%'
         ORDER BY pgr.invited_at DESC
         LIMIT 1`,
    );
    if (rows.length === 0) return null;
    return rows[0];
}

/**
 * Seed a fresh pending invite into PropertyGroupResident. Returns the
 * inviteCode + row id for cleanup. Caller must clean up via
 * `deleteSeededInvite(pgrId)` and `deleteAuthUserByEmail(inviteEmail)`
 * after the test runs.
 */
export async function seedPendingInvite(
    propertyGroupId: string,
    inviteEmail: string,
    ownerEmail: string,
): Promise<SeededInvite> {
    // 8-char hex inviteCode matches what the app generates
    const inviteCode = Math.random().toString(16).slice(2, 10);

    const { data, error } = await supabase
        .from('PropertyGroupResident')
        .insert({
            propertyGroupID: propertyGroupId,
            inviteCode,
            email: inviteEmail.toLowerCase(),
            status: 'pending',
            invited_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (error || !data) {
        throw new Error(`Failed to seed invite: ${error?.message}`);
    }

    log.info('Seeded household invite', {
        pgrId: data.id,
        inviteCode,
        propertyGroupId,
        inviteEmail,
    });

    return {
        pgrId: data.id,
        inviteCode,
        propertyGroupId,
        ownerEmail,
        inviteEmail,
    };
}

/**
 * Delete a seeded PropertyGroupResident row. Best-effort cleanup — logs but
 * doesn't throw on error so tests don't mask the original failure.
 */
export async function deleteSeededInvite(pgrId: string): Promise<void> {
    const { error } = await supabase
        .from('PropertyGroupResident')
        .delete()
        .eq('id', pgrId);

    if (error) {
        log.error('Failed to delete seeded invite', { pgrId, error: error.message });
    } else {
        log.info('Deleted seeded invite', { pgrId });
    }
}

/**
 * Delete an auth.users row by email. Used to clean up the invitee account
 * created during the recipient-accept flow.
 */
export async function deleteAuthUserByEmail(email: string): Promise<void> {
    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiKey) {
        log.warn('SUPABASE_API_KEY missing — cannot delete invitee user', { email });
        return;
    }

    // First find the user id
    const rows = await executeSQL<{ id: string }>(
        `SELECT id FROM auth.users WHERE email = '${email.toLowerCase()}' LIMIT 1`,
    );
    if (rows.length === 0) return;

    const userId = rows[0].id;
    const res = await fetch(
        `https://wzlacfmshqvjhjczytan.supabase.co/auth/v1/admin/users/${userId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                apikey: apiKey,
            },
        },
    );

    if (!res.ok) {
        log.error('Failed to delete invitee user', { email, status: res.status });
    } else {
        log.info('Deleted invitee user', { email, userId });
    }
}
