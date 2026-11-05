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
    listUsers(
        maxResults?: number,
        pageToken?: string
    ): Promise<{ users: { uid: string; email?: string }[]; pageToken?: string }>;
    deleteUsers(uids: string[]): Promise<{ successCount: number; failureCount: number }>;
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

/** Pages through every Firebase user; returns the uids whose email matches. */
export const findRunUsers = async (
    auth: Pick<AdminAuth, 'listUsers'>,
    matches: (email: string | undefined) => boolean,
    maxPages = 10_000
): Promise<string[]> => {
    const uids: string[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < maxPages; page += 1) {
        const result = await auth.listUsers(1000, pageToken);
        for (const user of result.users) if (matches(user.email)) uids.push(user.uid);
        if (!result.pageToken) return uids;
        pageToken = result.pageToken;
    }
    throw new Error('Too many user pages');
};

/** `deleteUsers` accepts at most 1000 uids per call. */
export const deleteUsersInBatches = async (
    auth: Pick<AdminAuth, 'deleteUsers'>,
    uids: string[],
    batch = 1000
): Promise<{ deleted: number; failed: number }> => {
    let deleted = 0;
    let failed = 0;
    for (let start = 0; start < uids.length; start += batch) {
        const result = await auth.deleteUsers(uids.slice(start, start + batch));
        deleted += result.successCount;
        failed += result.failureCount;
    }
    return { deleted, failed };
};
