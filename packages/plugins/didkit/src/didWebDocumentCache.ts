/**
 * Browser/Node fetch cache for did:web documents (`…/did.json`).
 *
 * DIDKit WASM resolves and verifies through `globalThis.fetch` with no in-flight
 * dedupe (ssi did-web drops its TimedCache lock before the HTTP GET). Opening one
 * credential can therefore stampede the same issuer document dozens of times.
 *
 * This module wraps `fetch` once so callers with *equivalent* resolver requests share:
 * - in-flight promise dedupe keyed by normalized request semantics
 * - a short TTL success cache (failures are never stored; Cache-Control honored)
 *
 * Equivalence follows platform `new Request(input, init)` rules (init.headers
 * *replaces* Request headers, it does not merge). Semantics include method, URL,
 * headers (so WASM's `Accept: application/json` is keyed, not bypassed), credentials,
 * mode, cache, redirect, and referrer policy. Requests with `integrity` pass through
 * to native fetch untouched. Rebuilt Responses keep `url` (DIDKit parses it).
 * Clear/invalidate bump a generation so stale in-flight work cannot join or
 * repopulate after the body finishes streaming.
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
    /** Original response URL — required by DIDKit's wasm URL parser. */
    url: string;
};

type RequestSemantics = {
    method: string;
    url: string;
    headers: [string, string][];
    credentials: RequestCredentials;
    mode: RequestMode;
    cache: RequestCache;
    redirect: RequestRedirect;
    referrerPolicy: ReferrerPolicy | '';
};

type InflightEntry = {
    generation: number;
    controller: AbortController;
    promise: Promise<StoredDocument>;
    waiters: number;
    semanticsKey: string;
};

type FetchLike = typeof globalThis.fetch;

let installed = false;
let underlyingFetch: FetchLike | undefined;
let ttlMs = DEFAULT_DID_WEB_DOCUMENT_TTL_MS;
let maxEntries = DEFAULT_DID_WEB_DOCUMENT_CACHE_MAX_ENTRIES;
/** Bumped by clear so stale in-flight work cannot join or repopulate. */
let cacheGeneration = 0;

const successCache = new Map<string, StoredDocument>();
const inflight = new Map<string, InflightEntry>();
/** Per-URL generation; invalidate bumps this so old in-flight writes are ignored. */
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

const headersToSortedTuples = (headers: Headers): [string, string][] => {
    const tuples: [string, string][] = [];
    headers.forEach((value, key) => {
        tuples.push([key.toLowerCase(), value]);
    });
    tuples.sort((a, b) =>
        a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0
    );
    return tuples;
};

/**
 * Normalize with the platform Request constructor so `init.headers` *replaces*
 * (does not merge with) headers from an input Request — matching native fetch.
 */
const normalizeRequest = (input: RequestInfo | URL, init?: RequestInit): Request =>
    new Request(input, init);

const describeSemanticsFromRequest = (request: Request): RequestSemantics => ({
    method: request.method.toUpperCase(),
    url: normalizeAbsoluteUrl(request.url),
    headers: headersToSortedTuples(request.headers),
    credentials: request.credentials,
    mode: request.mode,
    cache: request.cache,
    redirect: request.redirect,
    referrerPolicy: request.referrerPolicy,
});

const semanticsKey = (semantics: RequestSemantics): string =>
    JSON.stringify([
        semantics.method,
        semantics.url,
        semantics.headers,
        semantics.credentials,
        semantics.mode,
        semantics.cache,
        semantics.redirect,
        semantics.referrerPolicy,
    ]);

/** Shared network call: same semantics as the normalized Request, our AbortSignal. */
const sharedNetworkRequest = (normalized: Request, signal: AbortSignal): Request =>
    new Request(normalized, { signal });

const requestHasIntegrity = (request: Request, init?: RequestInit): boolean => {
    if (typeof init?.integrity === 'string' && init.integrity.length > 0) return true;
    return typeof request.integrity === 'string' && request.integrity.length > 0;
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
    // Drop every in-flight join handle for this document URL (semantics key embeds URL).
    for (const key of [...inflight.keys()]) {
        try {
            const parsed = JSON.parse(key) as unknown[];
            if (parsed[1] === url) inflight.delete(key);
        } catch {
            /* ignore malformed keys */
        }
    }
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
    const response = new Response(body, {
        status: stored.status,
        statusText: stored.statusText,
        headers: stored.headers,
    });
    // DIDKit WASM parses response.url; a rebuilt Response defaults to "".
    try {
        Object.defineProperty(response, 'url', {
            value: stored.url,
            writable: false,
            enumerable: true,
            configurable: true,
        });
    } catch {
        /* some runtimes may refuse; clone-based paths still work for inflight */
    }
    return response;
};

const readResponse = async (
    response: Response,
    effectiveTtlMs: number,
    fallbackUrl: string
): Promise<StoredDocument> => {
    const body = NULL_BODY_STATUSES.has(response.status) ? null : await response.arrayBuffer();
    return {
        expiresAt: Date.now() + effectiveTtlMs,
        status: response.status,
        statusText: response.statusText,
        headers: headersToTuples(response.headers),
        body,
        url: response.url || fallbackUrl,
    };
};

const sweepExpired = (now = Date.now()): void => {
    for (const [key, entry] of successCache) {
        if (entry.expiresAt <= now) successCache.delete(key);
    }
};

const touchLru = (key: string, stored: StoredDocument): void => {
    successCache.delete(key);
    successCache.set(key, stored);
    while (successCache.size > maxEntries) {
        const oldest = successCache.keys().next().value;
        if (oldest === undefined) break;
        successCache.delete(oldest);
    }
};

const getFreshSuccess = (key: string, now = Date.now()): StoredDocument | undefined => {
    sweepExpired(now);
    const hit = successCache.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
        successCache.delete(key);
        return undefined;
    }
    touchLru(key, hit);
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

const releaseInflightWaiter = (key: string, entry: InflightEntry): void => {
    entry.waiters -= 1;
    if (entry.waiters > 0) return;
    if (inflight.get(key) === entry) inflight.delete(key);
    if (!entry.controller.signal.aborted) {
        entry.controller.abort();
    }
};

async function joinInflight(
    key: string,
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
        releaseInflightWaiter(key, entry);
    }
}

const shouldBypassRequestCacheMode = (cache: RequestCache): boolean =>
    cache === 'no-store' || cache === 'reload' || cache === 'no-cache';

async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const fetchImpl = underlyingFetch;
    if (!fetchImpl) {
        if (typeof globalThis.fetch !== 'function') {
            throw new TypeError('globalThis.fetch is not available');
        }
        return globalThis.fetch(input, init);
    }

    let normalized: Request;
    try {
        normalized = normalizeRequest(input, init);
    } catch {
        return fetchImpl(input, init);
    }

    // Content integrity must stay on the native path (cold + warm). Keying/caching
    // would skip the check on hits; passthrough is the simpler correct fix.
    if (requestHasIntegrity(normalized, init)) {
        return fetchImpl(input, init);
    }

    const semantics = describeSemanticsFromRequest(normalized);

    if (semantics.method !== 'GET' || !isDidWebDocumentUrl(semantics.url)) {
        return fetchImpl(input, init);
    }

    // Request cache modes that mean "don't use a stored response" skip both success
    // cache and in-flight join (each caller hits the network with full semantics).
    if (shouldBypassRequestCacheMode(semantics.cache)) {
        return fetchImpl(input, init);
    }

    const callerSignal = normalized.signal;
    if (callerSignal.aborted) throw abortError();

    const key = semanticsKey(semantics);

    const cached = getFreshSuccess(key);
    if (cached) return storedToResponse(cached);

    const existing = inflight.get(key);
    if (existing && existing.generation === cacheGeneration) {
        return joinInflight(key, existing, callerSignal);
    }

    const generationAtStart = cacheGeneration;
    const urlGenerationAtStart = getUrlGeneration(semantics.url);
    const controller = new AbortController();
    const networkRequest = sharedNetworkRequest(normalized, controller.signal);

    const pending = (async (): Promise<StoredDocument> => {
        const response = await fetchImpl(networkRequest);
        const responseMaxAgeMs = parseCacheControlMaxAgeMs(response.headers);

        const effectiveTtlMs =
            responseMaxAgeMs === undefined ? ttlMs : Math.max(0, Math.min(ttlMs, responseMaxAgeMs));

        // Await the body first — clear/invalidate during streaming must still be
        // observed before we decide whether to insert.
        const stored = await readResponse(response, effectiveTtlMs || ttlMs, semantics.url);

        const stillCurrentGeneration =
            generationAtStart === cacheGeneration &&
            urlGenerationAtStart === getUrlGeneration(semantics.url);

        const canStore =
            response.ok && responseMaxAgeMs !== 0 && effectiveTtlMs > 0 && stillCurrentGeneration;

        if (canStore) {
            // Recheck generations immediately before insert (body may have taken a while).
            if (
                generationAtStart === cacheGeneration &&
                urlGenerationAtStart === getUrlGeneration(semantics.url)
            ) {
                touchLru(key, stored);
            }
        }

        return stored;
    })();

    const entry: InflightEntry = {
        generation: generationAtStart,
        controller,
        promise: pending,
        waiters: 0,
        semanticsKey: key,
    };
    inflight.set(key, entry);

    return joinInflight(key, entry, callerSignal);
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

    // Drop every success entry whose semantics URL matches.
    for (const key of [...successCache.keys()]) {
        try {
            const parsed = JSON.parse(key) as unknown[];
            if (parsed[1] === url) successCache.delete(key);
        } catch {
            /* ignore */
        }
    }

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
