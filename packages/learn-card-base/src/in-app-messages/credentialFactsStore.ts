import localforage from 'localforage';

import { summarizeCredential, type CredentialSummary } from './credentialFacts';

export const CREDENTIAL_FACTS_DATABASE_NAME = 'lcb-in-app-messages-facts';

const storage = localforage.createInstance({ name: CREDENTIAL_FACTS_DATABASE_NAME });
const memory = new Map<string, CredentialSummary>();
const factListeners = new Set<(did: string, summary: CredentialSummary) => void>();

const keyFor = (did: string, uri: string): string => `${encodeURIComponent(did)}:${uri}`;
const prefixFor = (did: string): string => `${encodeURIComponent(did)}:`;

const isSummary = (value: unknown): value is CredentialSummary => {
    if (typeof value !== 'object' || value === null) return false;

    const summary = value as Partial<CredentialSummary>;

    return (
        typeof summary.uri === 'string' &&
        (typeof summary.category === 'string' || summary.category === null) &&
        Array.isArray(summary.types) &&
        (typeof summary.issuer === 'string' || summary.issuer === null) &&
        Array.isArray(summary.nestedIssuers) &&
        Array.isArray(summary.achievementTypes) &&
        (typeof summary.issuedAt === 'string' || summary.issuedAt === null)
    );
};

export const loadCredentialFacts = async (did: string): Promise<CredentialSummary[]> => {
    const prefix = prefixFor(did);

    try {
        const keys = (await storage.keys()).filter(key => key.startsWith(prefix));
        const stored = await Promise.all(keys.map(key => storage.getItem<unknown>(key)));
        const summaries = stored.filter(isSummary);

        summaries.forEach(summary => memory.set(keyFor(did, summary.uri), summary));

        return summaries;
    } catch {
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

    memory.set(key, summary);

    try {
        await storage.setItem(key, summary);
    } catch {
        // The in-memory copy remains available when IndexedDB is unavailable.
    }
};

export const addCredentialSummary = async (
    did: string,
    uri: string,
    vc: unknown,
    category?: string | null
): Promise<CredentialSummary> => {
    const summary = summarizeCredential(uri, vc, category);

    await saveCredentialFact(did, summary);
    factListeners.forEach(listener => listener(did, summary));

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
    const prefix = prefixFor(did);
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
