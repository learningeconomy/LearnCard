import { checkPrefix, checkRunId } from './guards';

/**
 * Synthetic Firebase users for the load test, through the Firebase Admin SDK.
 * The structural `AdminAuth` is the subset of `firebase-admin/auth` `Auth` used
 * here, so tests never load firebase-admin. Addresses are built and matched here
 * and are never printed.
 */
export interface AdminAuth {
    createUser(properties: { email: string; emailVerified: boolean }): Promise<{ uid: string }>;
    createCustomToken(uid: string): Promise<string>;
    /** At most 100 identifiers per call. */
    getUsers(identifiers: { uid: string }[]): Promise<{ users: { uid: string; email?: string }[] }>;
    /** At most 1000 uids per call; `errors[].index` points into `uids`. */
    deleteUsers(uids: string[]): Promise<{
        successCount: number;
        failureCount: number;
        errors: { index: number }[];
    }>;
}

export interface RunAddress {
    prefix: string;
    runId: string;
    domain: string;
}

/** `<prefix>+<runId>-<n>@<domain>`. */
export const syntheticEmail = (address: RunAddress, n: number): string => {
    checkPrefix(address.prefix);
    checkRunId(address.runId);
    if (!Number.isInteger(n) || n < 0) throw new Error('Invalid user number');
    return `${address.prefix}+${address.runId}-${n}@${address.domain}`;
};

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Exactly this run's addresses (case-insensitive), nothing broader. */
export const runEmailMatcher = (address: RunAddress): ((email: string | undefined) => boolean) => {
    checkPrefix(address.prefix);
    checkRunId(address.runId);
    const pattern = new RegExp(
        `^${escape(address.prefix)}\\+${escape(address.runId)}-[0-9]{1,9}@${escape(address.domain)}$`,
        'i'
    );
    return email => typeof email === 'string' && pattern.test(email);
};

/** Firebase Admin `getUsers` accepts at most 100 identifiers per call. */
export const GET_USERS_BATCH = 100;

export interface CleanupCounts {
    /** Distinct uids in the manifest. */
    listed: number;
    /** Recorded as deleted or gone by an earlier cleanup of this manifest; not looked up again. */
    previouslyDone: number;
    deleted: number;
    alreadyGone: number;
    /** The user exists but its current email is not this run's address: left alone. */
    skippedMismatch: number;
    failed: number;
    /** Dry run only: would have been deleted. */
    wouldDelete: number;
}

export interface CleanupInput {
    address: RunAddress;
    users: { uid: string; email: string }[];
    /** uids an earlier cleanup already finished (deleted or gone). */
    done: ReadonlySet<string>;
    dryRun: boolean;
    /** Durable progress record; called after each batch, never in a dry run. */
    record(outcome: 'deleted' | 'gone', uids: string[]): void;
}

/**
 * Deletes exactly the manifest's users that still carry this run's address.
 * Never scans the project: each uid is fetched (`getUsers`, batches of 100) and
 * deleted (`deleteUsers`) only if its CURRENT email matches the run matcher and
 * equals the address recorded for it. Idempotent: gone users count as already
 * gone, and finished uids are recorded so a re-run skips them.
 */
export const cleanupRunUsers = async (
    auth: Pick<AdminAuth, 'getUsers' | 'deleteUsers'>,
    input: CleanupInput
): Promise<CleanupCounts> => {
    const matches = runEmailMatcher(input.address);
    const recorded = new Map<string, string>();
    for (const user of input.users) recorded.set(user.uid, user.email.toLowerCase());
    const counts: CleanupCounts = {
        listed: recorded.size,
        previouslyDone: 0,
        deleted: 0,
        alreadyGone: 0,
        skippedMismatch: 0,
        failed: 0,
        wouldDelete: 0,
    };
    const pending = [...recorded.keys()].filter(uid => {
        if (!input.done.has(uid)) return true;
        counts.previouslyDone += 1;
        return false;
    });
    for (let start = 0; start < pending.length; start += GET_USERS_BATCH) {
        const batch = pending.slice(start, start + GET_USERS_BATCH);
        const { users } = await auth.getUsers(batch.map(uid => ({ uid })));
        const found = new Map(users.map(user => [user.uid, user.email]));
        const gone = batch.filter(uid => !found.has(uid));
        const toDelete = batch.filter(uid => {
            if (!found.has(uid)) return false;
            const email = found.get(uid);
            const ok = matches(email) && email!.toLowerCase() === recorded.get(uid);
            if (!ok) counts.skippedMismatch += 1;
            return ok;
        });
        counts.alreadyGone += gone.length;
        if (input.dryRun) {
            counts.wouldDelete += toDelete.length;
            continue;
        }
        if (gone.length > 0) input.record('gone', gone);
        if (toDelete.length === 0) continue;
        const result = await auth.deleteUsers(toDelete);
        const failedIndexes = new Set(result.errors.map(error => error.index));
        const deleted = toDelete.filter((_uid, index) => !failedIndexes.has(index));
        counts.deleted += deleted.length;
        counts.failed += toDelete.length - deleted.length;
        if (deleted.length > 0) input.record('deleted', deleted);
    }
    return counts;
};
