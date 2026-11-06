import cache from '@cache';
import {
    clearExpiredStateStudentIds,
    countExpiredStateStudentIds,
    deleteClassLinkIdentitiesByIdentityKeys,
    getClassLinkIdentitiesCollection,
} from '../models/ClassLinkIdentity';
import { getAuthSubjectsCollection } from '../models/AuthSubject';
import { getTranscriptRequestsCollection } from '../models/TranscriptRequest';
import { findUserKeyByAuthProvider, findUserKeyByDid } from '../models/UserKey';

/** Minimum time between automatic expired-state-ID sweeps, per deployment. */
export const STATE_ID_SWEEP_INTERVAL_SECONDS = 15 * 60;
const STATE_ID_SWEEP_KEY = 'classlink:retention:state-id-sweep';
const CLAIM_SWEEP = `
local claimed = redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2], 'NX')
if claimed then return 'OK' end
return false
`;

/**
 * Automatic retention for state student IDs: at most once per
 * `STATE_ID_SWEEP_INTERVAL_SECONDS` (claimed with an atomic Redis `SET NX EX` script, so
 * concurrent Lambdas do not repeat it), remove every expired or legacy plaintext state ID. Triggered from
 * sign-in and context resolution so retention does not depend on a manual script.
 * Never throws: failures are logged without values and the next trigger retries after the
 * interval. Returns the number of records cleared, or null when skipped or failed.
 */
export const maybeClearExpiredStateStudentIds = async (): Promise<number | null> => {
    try {
        const redis = cache.redis ?? cache.node;
        // SET NX EX in one script: claims the interval without racing other instances.
        const claimed = await redis.eval(
            CLAIM_SWEEP,
            1,
            STATE_ID_SWEEP_KEY,
            String(Date.now()),
            STATE_ID_SWEEP_INTERVAL_SECONDS
        );
        if (claimed !== 'OK') return null;
        const cleared = await clearExpiredStateStudentIds();
        if (cleared > 0) console.info('classlink.retention.state_ids_cleared', { count: cleared });
        return cleared;
    } catch {
        console.warn('classlink.retention.sweep_failed');
        return null;
    }
};

/** Default minimum age before an unlinked identity counts as an orphan. */
export const DEFAULT_ORPHAN_MIN_AGE_DAYS = 30;

export interface OrphanCleanupOptions {
    /** Delete (true) or only report (false). */
    apply: boolean;
    /**
     * Only identities and requests older than this are considered, so a student who signed
     * in but has not finished wallet setup yet is never deleted. Defaults to 30 days.
     */
    minAgeDays?: number;
    now?: Date;
}

/**
 * Whether any account still owns this data: a UserKey with the Firebase uid, a UserKey for
 * a recorded DID, or a Keycloak provider whose id is the identity's subject.
 */
const hasOwner = async ({
    firebaseUid,
    dids,
    subject,
}: {
    firebaseUid?: string;
    dids: (string | undefined)[];
    subject?: string;
}): Promise<boolean> => {
    if (firebaseUid && (await findUserKeyByAuthProvider('firebase', firebaseUid))) return true;
    if (subject && (await findUserKeyByAuthProvider('keycloak', subject))) return true;
    for (const did of new Set(dids.filter((value): value is string => Boolean(value))))
        if (await findUserKeyByDid(did)) return true;
    return false;
};

/**
 * Remove ClassLink identities (and their `classlink:` AuthSubject) and transcript requests
 * that no account owns any more and that are older than `minAgeDays`. Dry run unless
 * `apply`. Logs only counts and opaque identity keys, never emails or state IDs.
 */
export const cleanupOrphanClassLinkData = async (
    options: OrphanCleanupOptions | boolean
): Promise<number> => {
    const {
        apply,
        minAgeDays = DEFAULT_ORPHAN_MIN_AGE_DAYS,
        now = new Date(),
    } = typeof options === 'boolean' ? { apply: options } : options;
    const cutoff = new Date(now.getTime() - minAgeDays * 86_400_000);
    let deleted = 0;

    const identities = getClassLinkIdentitiesCollection().find(
        { createdAt: { $lt: cutoff } },
        { projection: { identityKey: 1, firebaseUid: 1, primaryDid: 1, subject: 1 } }
    );
    for await (const identity of identities) {
        if (
            await hasOwner({
                firebaseUid: identity.firebaseUid,
                dids: [identity.primaryDid],
                subject: identity.subject,
            })
        )
            continue;
        let count = 0;
        if (apply) {
            count += await deleteClassLinkIdentitiesByIdentityKeys([identity.identityKey]);
            count += (
                await getAuthSubjectsCollection().deleteMany({ identityKey: identity.identityKey })
            ).deletedCount;
        }
        deleted += count;
        console.log(`${apply ? 'orphan identity deleted' : 'orphan identity found'} (${count})`);
    }

    const requests = getTranscriptRequestsCollection().find(
        { requestedAt: { $lt: cutoff } },
        { projection: { jti: 1, firebaseUid: 1, did: 1, primaryDid: 1 } }
    );
    for await (const request of requests) {
        if (
            await hasOwner({
                firebaseUid: request.firebaseUid,
                dids: [request.did, request.primaryDid],
            })
        )
            continue;
        const count = apply
            ? (await getTranscriptRequestsCollection().deleteOne({ jti: request.jti })).deletedCount
            : 0;
        deleted += count;
        console.log(`${apply ? 'orphan request deleted' : 'orphan request found'} (${count})`);
    }
    return deleted;
};

/** Remove state student IDs past their sign-in window. Dry runs only count them. */
export const clearExpiredClassLinkStateIds = async (apply: boolean): Promise<number> => {
    const count = apply ? await clearExpiredStateStudentIds() : await countExpiredStateStudentIds();
    console.log(`${apply ? 'expired state IDs cleared' : 'expired state IDs found'}: ${count}`);
    return count;
};
