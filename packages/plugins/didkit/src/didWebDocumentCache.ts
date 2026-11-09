/**
 * Browser/Node fetch cache for did:web documents (`…/did.json`).
 *
 * DIDKit WASM resolves and verifies through `globalThis.fetch` with no in-flight
 * dedupe (ssi did-web drops its TimedCache lock before the HTTP GET). Opening one
 * credential can therefore stampede the same issuer document dozens of times.
 *
 * This module wraps `fetch` once so every WASM/JS caller shares:
 * - in-flight promise dedupe keyed by document URL
 * - a short TTL success cache (failures are never stored)
 *
 * `clearDidWebDocumentFetchCache` / per-DID invalidate keep key rotation and
 * `resolveDid(..., { noCache: true })` honest.
 */

export const DEFAULT_DID_WEB_DOCUMENT_TTL_MS = 10_000;

type StoredDocument = {
    expiresAt: number;
    status: number;
    statusText: string;
    headers: [string, string][];
    body: ArrayBuffer;
};

type FetchLike = typeof globalThis.fetch;

let installed = false;
let underlyingFetch: FetchLike | undefined;
let ttlMs = DEFAULT_DID_WEB_DOCUMENT_TTL_MS;

const successCache = new Map<string, StoredDocument>();
const inflight = new Map<string, Promise<StoredDocument>>();

export type DidWebDocumentCacheStats = {
    installed: boolean;
    ttlMs: number;
    successEntries: number;
    inflightEntries: number;
};

export type InstallDidWebDocumentFetchCacheOptions = {
    /** Success-entry lifetime in ms. Defaults to {@link DEFAULT_DID_WEB_DOCUMENT_TTL_MS}. */
    ttlMs?: number;
    /** Replace a previous install (tests). */
    force?: boolean;
};

const toAbsoluteUrl = (input: RequestInfo | URL): string => {
    if (typeof input === 'string') return new URL(input, 'https://did-web.invalid').href;
    if (input instanceof URL) return input.href;
    return new URL(input.url, 'https://did-web.invalid').href;
};

const requestMethod = (input: RequestInfo | URL, init?: RequestInit): string => {
    if (init?.method) return init.method.toUpperCase();
    if (typeof input !== 'string' && !(input instanceof URL) && input.method) {
        return input.method.toUpperCase();
    }
    return 'GET';
};

const requestCacheMode = (
    input: RequestInfo | URL,
    init?: RequestInit
): RequestCache | undefined => {
    if (init?.cache) return init.cache;
    if (typeof input !== 'string' && !(input instanceof URL)) return input.cache;
    return undefined;
};

/** True for did:web document URLs (`/did.json`), including `.well-known/did.json`. */
export const isDidWebDocumentUrl = (url: string): boolean => {
    try {
        const pathname = new URL(url, 'https://did-web.invalid').pathname;
        return pathname === '/did.json' || pathname.endsWith('/did.json');
    } catch {
        return false;
    }
};

/**
 * Mirrors ssi `did_web_url`: `did:web:example.com:u:bob` →
 * `https://example.com/u/bob/did.json`.
 */
export const didWebToDocumentUrl = (did: string): string | undefined => {
    if (!did.startsWith('did:web:')) return undefined;

    const parts = did.slice('did:web:'.length).split(':');
    const domainName = parts[0];
    if (!domainName) return undefined;

    const domain = domainName.replace(/%3A/gi, ':');
    const path = parts.length > 1 ? parts.slice(1).join('/') : '.well-known';
    const proto = domain.startsWith('localhost') ? 'http' : 'https';

    return `${proto}://${domain}/${path}/did.json`;
};

const storedToResponse = (stored: StoredDocument): Response =>
    new Response(stored.body.slice(0), {
        status: stored.status,
        statusText: stored.statusText,
        headers: stored.headers,
    });

const readResponse = async (response: Response): Promise<StoredDocument> => {
    const body = await response.arrayBuffer();
    return {
        expiresAt: Date.now() + ttlMs,
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()],
        body,
    };
};

const getFreshSuccess = (url: string, now = Date.now()): StoredDocument | undefined => {
    const hit = successCache.get(url);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
        successCache.delete(url);
        return undefined;
    }
    return hit;
};

async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const fetchImpl = underlyingFetch;
    if (!fetchImpl) return globalThis.fetch(input, init);

    const method = requestMethod(input, init);
    let url: string;
    try {
        url = toAbsoluteUrl(input);
    } catch {
        return fetchImpl(input, init);
    }

    const bypass =
        method !== 'GET' ||
        !isDidWebDocumentUrl(url) ||
        requestCacheMode(input, init) === 'no-store' ||
        requestCacheMode(input, init) === 'reload';

    if (bypass) return fetchImpl(input, init);

    const cached = getFreshSuccess(url);
    if (cached) return storedToResponse(cached);

    const existing = inflight.get(url);
    if (existing) return storedToResponse(await existing);

    const pending = (async (): Promise<StoredDocument> => {
        const response = await fetchImpl(input, init);
        const stored = await readResponse(response);
        // Successful documents only — failed resolutions must not stick in the TTL cache.
        if (response.ok) {
            successCache.set(url, stored);
        }
        return stored;
    })();

    inflight.set(url, pending);
    try {
        return storedToResponse(await pending);
    } finally {
        inflight.delete(url);
    }
}

export const installDidWebDocumentFetchCache = (
    options: InstallDidWebDocumentFetchCacheOptions = {}
): void => {
    if (typeof options.ttlMs === 'number' && options.ttlMs > 0) {
        ttlMs = options.ttlMs;
    }

    if (installed && !options.force) return;

    if (installed && options.force && underlyingFetch) {
        globalThis.fetch = underlyingFetch;
    }

    underlyingFetch = globalThis.fetch.bind(globalThis);
    globalThis.fetch = cachedFetch as FetchLike;
    installed = true;
};

export const clearDidWebDocumentFetchCache = (): void => {
    successCache.clear();
    // In-flight promises keep running; they re-populate only on success after settle.
};

export const invalidateDidWebDocument = (didOrUrl: string): void => {
    const url = didOrUrl.startsWith('did:')
        ? didWebToDocumentUrl(didOrUrl)
        : isDidWebDocumentUrl(didOrUrl)
          ? didOrUrl
          : undefined;
    if (!url) return;
    successCache.delete(url);
};

export const getDidWebDocumentFetchCacheStats = (): DidWebDocumentCacheStats => ({
    installed,
    ttlMs,
    successEntries: successCache.size,
    inflightEntries: inflight.size,
});

/** Test helper: restore `fetch` and empty caches. */
export const resetDidWebDocumentFetchCacheForTests = (): void => {
    if (installed && underlyingFetch) {
        globalThis.fetch = underlyingFetch;
    }
    installed = false;
    underlyingFetch = undefined;
    ttlMs = DEFAULT_DID_WEB_DOCUMENT_TTL_MS;
    successCache.clear();
    inflight.clear();
};
