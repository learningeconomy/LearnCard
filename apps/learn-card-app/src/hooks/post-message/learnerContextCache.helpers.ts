export type LearnerContextRequestOptions = {
    includeCredentials?: boolean;
    includePersonalData?: boolean;
    format?: 'prompt' | 'structured';
    instructions?: string;
    detailLevel?: 'compact' | 'expanded';
    waitForSync?: boolean;
};

export type LearnerContextSourceData = {
    appId: string;
    did: string;
    credentialUris: string[];
    personalData?: Record<string, unknown>;
    displayName?: string;
};

export type LearnerContextCacheEntry = {
    key: string;
    prompt: string;
    did: string;
    displayName?: string;
    credentialUris: string[];
    personalData?: Record<string, unknown>;
    backendMetadata?: Record<string, unknown>;
    createdAt: number;
};

export const LEARNER_CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;

const CACHE_PREFIX = 'learncard:learner-context:v1:';
const cache = new Map<string, LearnerContextCacheEntry>();

const stableStringify = (value: unknown): string => {
    if (value === null || value === undefined) return JSON.stringify(value);
    if (typeof value !== 'object') return JSON.stringify(value);

    if (Array.isArray(value)) return `[${value.map(item => stableStringify(item)).join(',')}]`;

    const record = value as Record<string, unknown>;

    return `{${Object.keys(record)
        .sort()
        .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(',')}}`;
};

const fnv1a64 = (input: string): string => {
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    const mask = 0xffffffffffffffffn;

    for (let i = 0; i < input.length; i += 1) {
        hash ^= BigInt(input.charCodeAt(i));
        hash = (hash * prime) & mask;
    }

    return hash.toString(16).padStart(16, '0');
};

const getSessionStorage = (): Storage | undefined => {
    try {
        return typeof window === 'undefined' ? undefined : window.sessionStorage;
    } catch {
        return undefined;
    }
};

const isFresh = (entry: LearnerContextCacheEntry, now: number): boolean =>
    now - entry.createdAt < LEARNER_CONTEXT_CACHE_TTL_MS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseCacheEntry = (value: unknown): LearnerContextCacheEntry | undefined => {
    if (!isRecord(value)) return undefined;
    if (typeof value.key !== 'string') return undefined;
    if (typeof value.prompt !== 'string') return undefined;
    if (typeof value.did !== 'string') return undefined;
    if (!Array.isArray(value.credentialUris)) return undefined;
    if (!value.credentialUris.every(uri => typeof uri === 'string')) return undefined;
    if (typeof value.createdAt !== 'number') return undefined;
    if (value.displayName !== undefined && typeof value.displayName !== 'string') return undefined;
    if (value.personalData !== undefined && !isRecord(value.personalData)) return undefined;
    if (value.backendMetadata !== undefined && !isRecord(value.backendMetadata)) return undefined;

    return {
        key: value.key,
        prompt: value.prompt,
        did: value.did,
        displayName: value.displayName,
        credentialUris: value.credentialUris,
        personalData: value.personalData,
        backendMetadata: value.backendMetadata,
        createdAt: value.createdAt,
    };
};

export const getLearnerContextCacheKey = (
    source: LearnerContextSourceData,
    options: LearnerContextRequestOptions
): string => {
    const includePersonalData = options.includePersonalData === true;

    return fnv1a64(
        stableStringify({
            version: 'v1',
            appId: source.appId,
            did: source.did,
            credentialUris: [...source.credentialUris].sort(),
            includeCredentials: options.includeCredentials !== false,
            includePersonalData,
            format: options.format ?? 'prompt',
            instructions: options.instructions ?? '',
            detailLevel: options.detailLevel ?? 'compact',
            personalData: includePersonalData ? source.personalData ?? {} : {},
        })
    );
};

export const readLearnerContextCache = (
    key: string,
    now = Date.now()
): LearnerContextCacheEntry | undefined => {
    const memoryEntry = cache.get(key);

    if (memoryEntry) {
        if (isFresh(memoryEntry, now)) return memoryEntry;

        cache.delete(key);
    }

    try {
        const raw = getSessionStorage()?.getItem(`${CACHE_PREFIX}${key}`);
        if (!raw) return undefined;

        const entry = parseCacheEntry(JSON.parse(raw));
        if (!entry) return undefined;
        if (!isFresh(entry, now)) {
            getSessionStorage()?.removeItem(`${CACHE_PREFIX}${key}`);
            return undefined;
        }

        cache.set(key, entry);
        return entry;
    } catch {
        return undefined;
    }
};

const shouldPersistCacheEntry = (entry: LearnerContextCacheEntry): boolean =>
    entry.personalData === undefined && entry.credentialUris.length === 0;

export const writeLearnerContextCache = (entry: LearnerContextCacheEntry): void => {
    cache.set(entry.key, entry);

    try {
        const storage = getSessionStorage();
        if (!storage) return;

        if (!shouldPersistCacheEntry(entry)) {
            storage.removeItem(`${CACHE_PREFIX}${entry.key}`);
            return;
        }

        storage.setItem(`${CACHE_PREFIX}${entry.key}`, JSON.stringify(entry));
    } catch {
        // Best-effort cache. Storage quota/private-mode failures must not affect the flow.
    }
};

export const clearLearnerContextCacheForDid = (did: string): void => {
    for (const [key, entry] of cache.entries()) {
        if (entry.did === did) cache.delete(key);
    }

    try {
        const storage = getSessionStorage();
        if (!storage) return;

        const keysToRemove: string[] = [];

        for (let i = 0; i < storage.length; i += 1) {
            const storageKey = storage.key(i);
            if (!storageKey?.startsWith(CACHE_PREFIX)) continue;

            const raw = storage.getItem(storageKey);
            if (!raw) continue;

            const entry = parseCacheEntry(JSON.parse(raw));
            if (entry?.did === did) keysToRemove.push(storageKey);
        }

        keysToRemove.forEach(key => storage.removeItem(key));
    } catch {
        // Best-effort cache cleanup.
    }
};

export const clearLearnerContextCache = (): void => {
    cache.clear();

    try {
        const storage = getSessionStorage();
        if (!storage) return;

        const keysToRemove: string[] = [];

        for (let i = 0; i < storage.length; i += 1) {
            const storageKey = storage.key(i);
            if (storageKey?.startsWith(CACHE_PREFIX)) keysToRemove.push(storageKey);
        }

        keysToRemove.forEach(key => storage.removeItem(key));
    } catch {
        // Best-effort cache cleanup.
    }
};
