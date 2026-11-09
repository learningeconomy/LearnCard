/**
 * Browser/Node fetch cache for did:web documents (`…/did.json`).
 *
 * DIDKit WASM resolves and verifies through `globalThis.fetch` with no in-flight
 * dedupe (ssi did-web drops its TimedCache lock before the HTTP GET). Opening one
 * credential can therefore stampede the same issuer document dozens of times.
 *
 * This module wraps `fetch` once so every WASM/JS caller shares:
 * - in-flight promise dedupe keyed by normalized document URL (simple GETs only)
 * - a short TTL success cache (failures are never stored; Cache-Control honored)
 *
 * Non-equivalent requests (Authorization, credentials, custom headers, non-default
 * mode/cache, etc.) bypass the cache so authenticated and anonymous fetches never
 * share bodies. `clearDidWebDocumentFetchCache` / per-DID invalidate bump a
 * generation so stale in-flight work cannot repopulate or be joined afterward.
 */

export const DEFAULT_DID_WEB_DOCUMENT_TTL_MS = 10_000;
export const DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES = 64;

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

type StoredDocument = {
    expiresAt: number;
    status: number;
    statusText: string;
    headers: [string, string][];
    body: ArrayBuffer | null;
};

type InflightEntry = {
    generation: number;
    controller: AbortController;
    promise: Promise<StoredDocument>;
    waiters: number;
};

type FetchLike = typeof globalThis.fetch;

let installed = false;
let underlyingFetch: FetchLike | undefined;
let ttlMs = DEFAULT_DID_WEB_DOCUMENT_TTL_MS;
let maxEntries = DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES;
/** Bumped by clear/invalidate so stale in-flight work cannot join or repopulate. */
let cacheGeneration = 0;

const successCache = new Map<string, StoredDocument>();
const inflight = new Map<string, InflightEntry>();
/** Per-URL generation; cleared URLs bump this so old in-flight writes are ignored. */
const urlGeneration = new Map<string, number>();

export type DidWebDocumentCacheStats = {
    installed: boolean;
    ttlMs: number;
    maxEntries: number;
    successEntries: number;
    inflightEntries: number;
    cacheGeneration: number;
};

export type InstallDidWebDocumentFetchCacheOptions = {
    /** Success-entry lifetime in ms. Defaults to {@link DEFAULT_DID_WEB_DOCUMENT_TTL_MS}. */
    ttlMs?: number;
    /** Max success entries (LRU). Defaults to {@link DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES}. */
    maxEntries?: number;
    /** Replace a previous install (tests). */
    force?: boolean;
};

const normalizeAbsoluteUrl = (href: string): string => new URL(href).href;

const toAbsoluteUrl = (input: RequestInfo | URL): string => {
    if (typeof input === 'string') return normalizeAbsoluteUrl(new URL(input).href);
    if (input instanceof URL) return normalizeAbsoluteUrl(input.href);
    return normalizeAbsoluteUrl(new URL(input.url).href);
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

const requestCredentials = (
    input: RequestInfo | URL,
    init?: RequestInit
): RequestCredentials | undefined => {
    if (init?.credentials) return init.credentials;
    if (typeof input !== 'string' && !(input instanceof URL)) return input.credentials;
    return undefined;
};

const requestMode = (input: RequestInfo | URL, init?: RequestInit): RequestMode | undefined => {
    if (init?.mode) return init.mode;
    if (typeof input !== 'string' && !(input instanceof URL)) return input.mode;
    return undefined;
};

const requestHeaders = (input: RequestInfo | URL, init?: RequestInit): Headers => {
    const headers = new Headers();
    if (typeof input !== 'string' && !(input instanceof URL) && input.headers) {
        new Headers(input.headers).forEach((value, key) => headers.set(key, value));
    }
    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    return headers;
};

const requestSignal = (input: RequestInfo | URL, init?: RequestInit): AbortSignal | undefined => {
    if (init?.signal) return init.signal;
    if (typeof input !== 'string' && !(input instanceof URL)) return input.signal;
    return undefined;
};

/**
 * Only plain did:web document GETs are cacheable/deduped. Anything that could change
 * auth, cookies, CORS mode, or cache policy bypasses so distinct request contexts
 * never share a body (e.g. unauthenticated callers must not see Authorization results).
 */
const isCacheableResolverRequest = (input: RequestInfo | URL, init?: RequestInit): boolean => {
    if (requestMethod(input, init) !== 'GET') return false;

    const cacheMode = requestCacheMode(input, init);
    if (cacheMode === 'no-store' || cacheMode === 'reload' || cacheMode === 'no-cache') {
        return false;
    }

    const credentials = requestCredentials(input, init);
    if (credentials && credentials !== 'omit' && credentials !== 'same-origin') {
        return false;
    }

    const mode = requestMode(input, init);
    if (mode && mode !== 'cors' && mode !== 'same-origin') {
        return false;
    }

    if (init?.redirect && init.redirect !== 'follow') return false;
    if (init?.integrity) return false;
    if (init?.keepalive) return false;
    if (init?.referrer && init.referrer !== 'about:client') return false;
    if (init?.referrerPolicy) return false;

    if (typeof input !== 'string' && !(input instanceof URL)) {
        if (input.redirect && input.redirect !== 'follow') return false;
        if (input.integrity) return false;
        if (input.keepalive) return false;
    }

    const headers = requestHeaders(input, init);
    let hasHeaders = false;
    headers.forEach(() => {
        hasHeaders = true;
    });
    if (hasHeaders) return false;

    return true;
};

/** True for did:web document URLs (`/did.json`), including `.well-known/did.json`. */
export const isDidWebDocumentUrl = (url: string): boolean => {
    try {
        const pathname = new URL(url).pathname;
        return pathname === '/did.json' || pathname.endsWith('/did.json');
    } catch {
        return false;
    }
};

/**
 * Mirrors ssi `did_web_url`, then normalizes via the URL constructor (host case,
 * default ports) so invalidate keys match fetch keys.
 */
export const didWebToDocumentUrl = (did: string): string | undefined => {
    if (!did.startsWith('did:web:')) return undefined;

    const parts = did.slice('did:web:'.length).split(':');
    const domainName = parts[0];
    if (!domainName) return undefined;

    const domain = domainName.replace(/%3A/gi, ':');
    const path = parts.length > 1 ? parts.slice(1).join('/') : '.well-known';
    const proto = domain.startsWith('localhost') ? 'http' : 'https';

    try {
        return normalizeAbsoluteUrl(`${proto}://${domain}/${path}/did.json`);
    } catch {
        return undefined;
    }
};

const getUrlGeneration = (url: string): number => urlGeneration.get(url) ?? 0;

const bumpUrlGeneration = (url: string): void => {
    urlGeneration.set(url, getUrlGeneration(url) + 1);
    inflight.delete(url);
};

const headersToTuples = (headers: Headers): [string, string][] => {
    const tuples: [string, string][] = [];
    headers.forEach((value, key) => {
        tuples.push([key, value]);
    });
    return tuples;
};

const parseCacheControlMaxAgeMs = (headers: Headers): number | undefined => {
    const raw = headers.get('cache-control');
    if (!raw) return undefined;
    const directives = raw
        .toLowerCase()
        .split(',')
        .map(part => part.trim());
    if (directives.some(d => d === 'no-store' || d === 'no-cache')) return 0;
    for (const directive of directives) {
        const match = /^max-age=(\d+)$/.exec(directive);
        if (match) return Number(match[1]) * 1000;
    }
    return undefined;
};

const storedToResponse = (stored: StoredDocument): Response => {
    const body =
        stored.body === null || NULL_BODY_STATUSES.has(stored.status) ? null : stored.body.slice(0);
    return new Response(body, {
        status: stored.status,
        statusText: stored.statusText,
        headers: stored.headers,
    });
};

const readResponse = async (
    response: Response,
    effectiveTtlMs: number
): Promise<StoredDocument> => {
    const body = NULL_BODY_STATUSES.has(response.status) ? null : await response.arrayBuffer();
    return {
        expiresAt: Date.now() + effectiveTtlMs,
        status: response.status,
        statusText: response.statusText,
        headers: headersToTuples(response.headers),
        body,
    };
};

const sweepExpired = (now = Date.now()): void => {
    for (const [key, entry] of successCache) {
        if (entry.expiresAt <= now) successCache.delete(key);
    }
};

const touchLru = (url: string, stored: StoredDocument): void => {
    // Re-insert to move to the end (newest) of Map insertion order.
    successCache.delete(url);
    successCache.set(url, stored);
    while (successCache.size > maxEntries) {
        const oldest = successCache.keys().next().value;
        if (oldest === undefined) break;
        successCache.delete(oldest);
    }
};

const getFreshSuccess = (url: string, now = Date.now()): StoredDocument | undefined => {
    sweepExpired(now);
    const hit = successCache.get(url);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
        successCache.delete(url);
        return undefined;
    }
    touchLru(url, hit);
    return hit;
};

const abortError = (): DOMException => {
    if (typeof DOMException === 'function') {
        return new DOMException('The operation was aborted.', 'AbortError');
    }
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error as DOMException;
};

const waitForAbort = (signal: AbortSignal): Promise<never> =>
    new Promise((_, reject) => {
        if (signal.aborted) {
            reject(abortError());
            return;
        }
        signal.addEventListener('abort', () => reject(abortError()), { once: true });
    });

const releaseInflightWaiter = (url: string, entry: InflightEntry): void => {
    entry.waiters -= 1;
    if (entry.waiters > 0) return;
    if (inflight.get(url) === entry) inflight.delete(url);
    if (!entry.controller.signal.aborted) {
        entry.controller.abort();
    }
};

async function joinInflight(
    url: string,
    entry: InflightEntry,
    callerSignal: AbortSignal | undefined
): Promise<Response> {
    entry.waiters += 1;
    try {
        if (callerSignal?.aborted) throw abortError();
        const stored = callerSignal
            ? await Promise.race([entry.promise, waitForAbort(callerSignal)])
            : await entry.promise;
        return storedToResponse(stored);
    } finally {
        releaseInflightWaiter(url, entry);
    }
}

async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const fetchImpl = underlyingFetch;
    if (!fetchImpl) {
        if (typeof globalThis.fetch !== 'function') {
            throw new TypeError('globalThis.fetch is not available');
        }
        return globalThis.fetch(input, init);
    }

    let url: string;
    try {
        url = toAbsoluteUrl(input);
    } catch {
        return fetchImpl(input, init);
    }

    if (!isDidWebDocumentUrl(url) || !isCacheableResolverRequest(input, init)) {
        return fetchImpl(input, init);
    }

    const callerSignal = requestSignal(input, init);
    if (callerSignal?.aborted) throw abortError();

    const cached = getFreshSuccess(url);
    if (cached) return storedToResponse(cached);

    const existing = inflight.get(url);
    if (existing && existing.generation === cacheGeneration) {
        return joinInflight(url, existing, callerSignal);
    }

    const generationAtStart = cacheGeneration;
    const urlGenerationAtStart = getUrlGeneration(url);
    // Shared controller: aborted only when every waiter has left (see releaseInflightWaiter).
    const controller = new AbortController();

    const pending = (async (): Promise<StoredDocument> => {
        const response = await fetchImpl(url, { signal: controller.signal });
        const responseMaxAgeMs = parseCacheControlMaxAgeMs(response.headers);
        const canStore =
            response.ok &&
            responseMaxAgeMs !== 0 &&
            generationAtStart === cacheGeneration &&
            urlGenerationAtStart === getUrlGeneration(url);

        const effectiveTtlMs =
            responseMaxAgeMs === undefined ? ttlMs : Math.max(0, Math.min(ttlMs, responseMaxAgeMs));

        const stored = await readResponse(response, effectiveTtlMs || ttlMs);

        if (canStore && effectiveTtlMs > 0) {
            touchLru(url, stored);
        }

        return stored;
    })();

    const entry: InflightEntry = {
        generation: generationAtStart,
        controller,
        promise: pending,
        waiters: 0,
    };
    inflight.set(url, entry);

    // Leader is also a waiter for refcounting / shared abort.
    return joinInflight(url, entry, callerSignal);
}

export const installDidWebDocumentFetchCache = (
    options: InstallDidWebDocumentFetchCacheOptions = {}
): void => {
    if (typeof globalThis.fetch !== 'function') {
        throw new TypeError(
            'installDidWebDocumentFetchCache requires globalThis.fetch; none is available'
        );
    }

    if (typeof options.ttlMs === 'number' && options.ttlMs > 0) {
        ttlMs = options.ttlMs;
    }
    if (typeof options.maxEntries === 'number' && options.maxEntries > 0) {
        maxEntries = options.maxEntries;
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
    cacheGeneration += 1;
    successCache.clear();
    // Drop join handles so new callers start fresh; in-flight promises still settle
    // but refuse to repopulate because their captured generation is stale.
    inflight.clear();
    urlGeneration.clear();
};

export const invalidateDidWebDocument = (didOrUrl: string): void => {
    const raw = didOrUrl.startsWith('did:')
        ? didWebToDocumentUrl(didOrUrl)
        : isDidWebDocumentUrl(didOrUrl)
          ? didOrUrl
          : undefined;
    if (!raw) return;

    let url: string;
    try {
        url = normalizeAbsoluteUrl(raw);
    } catch {
        return;
    }

    successCache.delete(url);
    bumpUrlGeneration(url);
};

export const getDidWebDocumentFetchCacheStats = (): DidWebDocumentCacheStats => ({
    installed,
    ttlMs,
    maxEntries,
    successEntries: successCache.size,
    inflightEntries: inflight.size,
    cacheGeneration,
});

/** Test helper: restore `fetch` and empty caches. */
export const resetDidWebDocumentFetchCacheForTests = (): void => {
    if (installed && underlyingFetch) {
        globalThis.fetch = underlyingFetch;
    }
    installed = false;
    underlyingFetch = undefined;
    ttlMs = DEFAULT_DID_WEB_DOCUMENT_TTL_MS;
    maxEntries = DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES;
    cacheGeneration = 0;
    successCache.clear();
    inflight.clear();
    urlGeneration.clear();
};
