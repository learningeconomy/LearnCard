import type { TrustedBoostRegistryEntry } from './types';

export const DEFAULT_TRUSTED_BOOST_REGISTRY: readonly TrustedBoostRegistryEntry[] = [
    {
        id: 'LearnCard Network',
        url: 'https://network.learncard.com',
        did: 'did:web:network.learncard.com',
    },
];

/** A slow registry host must not stall credential verification for long. */
export const TRUSTED_BOOST_REGISTRY_TIMEOUT_MS = 5_000;

const isRegistryEntry = (value: unknown): value is TrustedBoostRegistryEntry =>
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'url' in value &&
    typeof value.url === 'string' &&
    'did' in value &&
    typeof value.did === 'string';

const parseRegistry = (body: string): TrustedBoostRegistryEntry[] | undefined => {
    const parsed: unknown = JSON.parse(body);
    return Array.isArray(parsed) && parsed.every(isRegistryEntry) ? parsed : undefined;
};

const requestRegistry = async (
    url: string,
    timeoutMs: number
): Promise<TrustedBoostRegistryEntry[] | undefined> => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Racing the timer also covers fetch implementations that ignore abort signals.
    const timedOut = new Promise<undefined>(resolve => {
        timer = setTimeout(() => {
            controller.abort();
            resolve(undefined);
        }, timeoutMs);
    });
    const request = (async () => {
        const res = await fetch(url, { signal: controller.signal });
        return res.status === 200 ? parseRegistry(await res.text()) : undefined;
    })().catch(() => undefined);

    try {
        return await Promise.race([request, timedOut]);
    } finally {
        clearTimeout(timer);
    }
};

const loadedRegistries = new Map<string, Promise<TrustedBoostRegistryEntry[] | undefined>>();

/**
 * Loads a remote trust registry once per URL, on first use. A failed, malformed, or slow
 * request falls back to the default registry and is retried by the next verification.
 */
export const loadTrustedBoostRegistry = async (
    url: string | undefined,
    timeoutMs = TRUSTED_BOOST_REGISTRY_TIMEOUT_MS
): Promise<readonly TrustedBoostRegistryEntry[]> => {
    if (!url) return DEFAULT_TRUSTED_BOOST_REGISTRY;

    let pending = loadedRegistries.get(url);
    if (!pending) {
        pending = requestRegistry(url, timeoutMs);
        loadedRegistries.set(url, pending);
    }

    const registry = await pending;
    if (registry) return registry;

    if (loadedRegistries.get(url) === pending) loadedRegistries.delete(url);
    return DEFAULT_TRUSTED_BOOST_REGISTRY;
};

/** Test hook: forget loaded registries. */
export const resetTrustedBoostRegistryCache = (): void => loadedRegistries.clear();
