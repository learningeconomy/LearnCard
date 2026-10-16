import localforage from 'localforage';

import { trySummarizeCredential, type CredentialSummary } from './credentialFacts';

export const CREDENTIAL_FACTS_DATABASE_NAME = 'lcb-in-app-messages-facts';

// Force IndexedDB so summaries never fall through to localStorage. The memory map
// below is the only fallback when IndexedDB is unavailable (for example, private mode).
const storage = localforage.createInstance({
    name: CREDENTIAL_FACTS_DATABASE_NAME,
    driver: localforage.INDEXEDDB,
});

// Keys include the active DID, which prevents summaries from leaking across
// switched profiles. Memory also gives callers an immediately updated snapshot.
const memory = new Map<string, CredentialSummary>();
const factListeners = new Set<(did: string, summary: CredentialSummary) => void>();

// Serialize writes so a later save cannot be persisted before an earlier save.
let pendingWrites: Promise<void> = Promise.resolve();

// Clearing increments the epoch. Work that began under an older epoch must not
// repopulate memory, IndexedDB, or listeners after logout/account cleanup.
let epoch = 0;

export const getCredentialFactsEpoch = (): number => epoch;

const keyFor = (did: string, uri: string): string => `${encodeURIComponent(did)}:${uri}`;
const prefixFor = (did: string): string => `${encodeURIComponent(did)}:`;

// IndexedDB values are untrusted at runtime. Reject stale or malformed records
// instead of allowing them into targeting evaluation.
const isSummary = (value: unknown): value is CredentialSummary => {
    if (typeof value !== 'object' || value === null) return false;

    const summary = value as Partial<CredentialSummary>;

    return (
        typeof summary.uri === 'string' &&
        (typeof summary.name === 'string' || summary.name === null || summary.name === undefined) &&
        (typeof summary.category === 'string' || summary.category === null) &&
        Array.isArray(summary.types) &&
        summary.types.every(value => typeof value === 'string') &&
        (typeof summary.issuer === 'string' || summary.issuer === null) &&
        Array.isArray(summary.nestedIssuers) &&
        summary.nestedIssuers.every(value => typeof value === 'string') &&
        Array.isArray(summary.achievementTypes) &&
        summary.achievementTypes.every(value => typeof value === 'string') &&
        (typeof summary.issuedAt === 'string' || summary.issuedAt === null)
    );
};

export const loadCredentialFacts = async (did: string): Promise<CredentialSummary[]> => {
    const prefix = prefixFor(did);
    const loadEpoch = epoch;

    // Observe all saves requested before this load, producing a consistent snapshot.
    await pendingWrites;

    try {
        const keys = (await storage.keys()).filter(key => key.startsWith(prefix));
        const stored = await Promise.all(keys.map(key => storage.getItem<unknown>(key)));
        const summaries = stored.filter(isSummary);

        if (loadEpoch !== epoch) return [];

        // Merge valid persisted values into the in-memory cache. This also keeps
        // facts added during the current session if they are not on disk yet.
        summaries.forEach(summary => memory.set(keyFor(did, summary.uri), summary));

        return [...memory.entries()]
            .filter(([key]) => key.startsWith(prefix))
            .map(([, summary]) => summary);
    } catch {
        // IndexedDB failures are intentionally non-fatal; targeting can continue
        // with facts collected during this app session.
        if (loadEpoch !== epoch) return [];
        return [...memory.entries()]
            .filter(([key]) => key.startsWith(prefix))
            .map(([, summary]) => summary);
    }
};

export const saveCredentialFact = async (
    did: string,
    summary: CredentialSummary
): Promise<void> => {
    const key = keyFor(did, summary.uri);
    const writeEpoch = epoch;

    // Publish to the session cache immediately, then persist in queue order.
    memory.set(key, summary);

    pendingWrites = pendingWrites.then(async () => {
        if (writeEpoch !== epoch) return;
        try {
            await storage.setItem(key, summary);
        } catch {
            // The in-memory copy remains available when IndexedDB is unavailable.
        }
    });
    await pendingWrites;
};

export const addCredentialSummary = async (
    did: string,
    uri: string,
    vc: unknown,
    category?: string | null
): Promise<CredentialSummary> => {
    const summary = trySummarizeCredential(uri, vc, category);

    if (!summary) throw new Error('Credential could not be summarized safely');
    const writeEpoch = epoch;

    await saveCredentialFact(did, summary);

    // Notify active loaders only if the account lifecycle did not reset while
    // persistence was pending.
    if (writeEpoch === epoch) factListeners.forEach(listener => listener(did, summary));

    return summary;
};

export const onCredentialSummaryAdded = (
    listener: (did: string, summary: CredentialSummary) => void
): (() => void) => {
    factListeners.add(listener);

    return () => factListeners.delete(listener);
};

export const removeMissingCredentialFacts = async (
    did: string,
    currentUris: Set<string>
): Promise<void> => {
    const removeEpoch = epoch;
    const prefix = prefixFor(did);
    // Build the removal set from both layers. A key may exist in only one layer
    // after an IndexedDB failure or an interrupted previous session.
    const keys = new Set(
        [...memory.keys()].filter(
            key => key.startsWith(prefix) && !currentUris.has(key.slice(prefix.length))
        )
    );

    try {
        (await storage.keys())
            .filter(key => key.startsWith(prefix) && !currentUris.has(key.slice(prefix.length)))
            .forEach(key => keys.add(key));
    } catch {
        // Memory cleanup still proceeds.
    }

    if (removeEpoch !== epoch) return;

    // Removal is best-effort on disk but authoritative in memory.
    await Promise.all(
        [...keys].map(async key => {
            memory.delete(key);

            try {
                await storage.removeItem(key);
            } catch {
                // IndexedDB cleanup is best-effort when the driver is unavailable.
            }
        })
    );
};

export const clearCredentialFacts = async (did?: string): Promise<void> => {
    // Invalidate in-flight reads and writes before waiting for the existing queue.
    epoch += 1;
    await pendingWrites;

    // No DID means a full logout cleanup; otherwise clear one switched profile.
    if (!did) {
        memory.clear();

        try {
            await storage.clear();
        } catch {
            // Memory cleanup is enough for the fallback path.
        }

        return;
    }

    await removeMissingCredentialFacts(did, new Set());
};

/** Close the IndexedDB connection before the app's logout database sweep. */
export const disposeCredentialFacts = async (): Promise<void> => {
    await clearCredentialFacts();
    try {
        await storage.dropInstance();
    } catch {
        // The memory fallback was already cleared.
    }
};
