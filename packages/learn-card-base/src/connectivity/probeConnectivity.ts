/**
 * Verified reachability probe.
 *
 * Performs a single tiny GET against a static same-origin asset
 * (`/connectivity.txt`) containing the exact marker below. The probe proves
 * "the internet (and our static host) is reachable right now" — nothing more:
 *
 *  - It does NOT prove brain-service/API health (a successful probe says
 *    nothing about backend endpoints).
 *  - HTTP errors, redirects or unexpected bodies are NOT proof of internet
 *    loss — they are `inconclusive` (endpoint misconfig, captive portal,
 *    service outage) and callers must stay permissive.
 *  - Only a transport-level failure (network error or the deadline elapsing,
 *    including during the body read) may be treated as `unreachable`.
 *
 * Captive-portal caveat: because the request uses `redirect: 'error'`, a
 * captive portal redirect surfaces as a fetch TypeError — indistinguishable
 * from DNS/connectivity failure — and is classified conservatively as
 * `unreachable` rather than `inconclusive`.
 *
 * Pure module: `fetch`, timers and randomness are injectable; no browser or
 * native globals are touched at import time.
 */

export const CONNECTIVITY_PROBE_PATH = '/connectivity.txt';
export const CONNECTIVITY_PROBE_MARKER = 'learncard-connectivity-v1';
export const CONNECTIVITY_PROBE_TIMEOUT_MS = 4000;
/** Hard cap on how much of the response body we will read. */
export const CONNECTIVITY_PROBE_MAX_BYTES = 1024;

export type ProbeOutcome =
    | { kind: 'reachable'; durationMs: number; httpStatus: number }
    | {
          kind: 'unreachable';
          reason: 'timeout' | 'network-error';
          durationMs: number;
      }
    | {
          kind: 'inconclusive';
          reason: 'invalid-url' | 'unsafe-origin' | 'http-error' | 'unexpected-body';
          durationMs: number;
          httpStatus?: number;
          detail?: string;
      };

export interface ProbeTargetConfig {
    /** Fully resolved absolute URL of the probe asset (already includes the path). */
    url: string;
    /** Allow plain `http://` — dev/web localhost only; never on native. */
    allowPlainHttp?: boolean;
    /**
     * Origins the probe must never hit — e.g. the app's own bundled native
     * origin (`https://localhost`, `capacitor://localhost`, `http://localhost`
     * on Android), where a 200 proves nothing about internet reachability.
     */
    disallowOrigins?: string[];
}

export interface ProbeDependencies {
    fetchFn?: typeof fetch;
    now?: () => number;
    setTimeoutFn?: (handler: () => void, ms: number) => unknown;
    clearTimeoutFn?: (handle: unknown) => void;
    /** Unique cache-busting token per probe. */
    randomId?: () => string;
    timeoutMs?: number;
    maxBytes?: number;
}

const defaultNow = (): number => Date.now();
const defaultSetTimeout: (handler: () => void, ms: number) => unknown = (handler, ms) =>
    setTimeout(handler, ms);
const defaultClearTimeout = (handle: unknown): void => clearTimeout(handle as ReturnType<typeof setTimeout>);
const defaultRandomId = (): string =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export type ProbeTargetValidation =
    | { ok: true; url: URL }
    | { ok: false; reason: 'invalid-url' | 'unsafe-origin'; detail: string };

/**
 * Validate a probe target before any network I/O. The native bundled origin
 * must never be probed (a hit proves nothing and would falsely "verify" a
 * device with no internet), and plain HTTP is restricted to explicit local
 * development use.
 */
export const validateProbeTarget = (
    target: ProbeTargetConfig | string,
    defaults: { allowPlainHttp?: boolean; disallowOrigins?: string[] } = {}
): ProbeTargetValidation => {
    const config = typeof target === 'string' ? { url: target } : target;

    let parsed: URL;
    try {
        parsed = new URL(config.url);
    } catch {
        return { ok: false, reason: 'invalid-url', detail: `probe URL is not parseable: ${config.url}` };
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return {
            ok: false,
            reason: 'invalid-url',
            detail: `probe URL must be http(s), got ${parsed.protocol}`,
        };
    }

    if (
        parsed.protocol === 'http:' &&
        !(config.allowPlainHttp ?? defaults.allowPlainHttp)
    ) {
        // Plain http is only acceptable when explicitly allowed (web dev on
        // localhost). Native builds must use the HTTPS tenant domain.
        return {
            ok: false,
            reason: 'unsafe-origin',
            detail: 'plain http requires allowPlainHttp (dev/web localhost only)',
        };
    }

    const disallowed = [...(config.disallowOrigins ?? []), ...(defaults.disallowOrigins ?? [])];
    if (disallowed.includes(parsed.origin)) {
        return {
            ok: false,
            reason: 'unsafe-origin',
            detail: `refusing to probe bundled/app origin ${parsed.origin}`,
        };
    }

    return { ok: true, url: parsed };
};

const createAbortError = (): Error => {
    const error = new Error('The connectivity probe was aborted by its deadline.');
    error.name = 'AbortError';
    return error;
};

/**
 * Read at most `maxBytes` of the response body, racing against the deadline
 * signal so a stalled body read is classified as a timeout rather than
 * hanging forever.
 */
const readBoundedBody = async (
    response: Response,
    signal: AbortSignal,
    maxBytes: number
): Promise<string> => {
    const abortPromise = new Promise<never>((_, reject) => {
        const onAbort = () => reject(createAbortError());
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
    });

    const body = response.body;
    if (body && typeof body.getReader === 'function') {
            const reader = body.getReader();
            const decoder = new TextDecoder();
            let received = 0;
            const chunks: Uint8Array[] = [];
            while (received < maxBytes) {
                const { done, value } = await Promise.race([reader.read(), abortPromise]);
                if (done) break;
                chunks.push(value);
                received += value.byteLength;
                if (received >= maxBytes) {
                    void reader.cancel().catch(() => undefined);
                    break;
                }
            }
        return decoder.decode(concatChunks(chunks));
    }

    // Fallback for environments without a byte stream — still deadline-bound.
    const text: string = await Promise.race([response.text(), abortPromise]);
    return text.slice(0, maxBytes);
};

const concatChunks = (chunks: Uint8Array[]): Uint8Array => {
    if (chunks.length === 0) return new Uint8Array(0);
    if (chunks.length === 1) return chunks[0];
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return merged;
};

const withCacheBust = (url: string, token: string): string =>
    `${url}${url.includes('?') ? '&' : '?'}lc=${encodeURIComponent(token)}`;

/**
 * Run one reachability probe. Never throws — all failures are encoded in the
 * returned {@link ProbeOutcome}.
 */
export const probeConnectivity = async (
    target: ProbeTargetConfig | string,
    deps: ProbeDependencies = {}
): Promise<ProbeOutcome> => {
    const fetchFn = deps.fetchFn ?? fetch;
    const now = deps.now ?? defaultNow;
    const setTimeoutFn = deps.setTimeoutFn ?? defaultSetTimeout;
    const clearTimeoutFn = deps.clearTimeoutFn ?? defaultClearTimeout;
    const randomId = deps.randomId ?? defaultRandomId;
    const timeoutMs = deps.timeoutMs ?? CONNECTIVITY_PROBE_TIMEOUT_MS;
    const maxBytes = deps.maxBytes ?? CONNECTIVITY_PROBE_MAX_BYTES;

    const startedAt = now();
    const duration = (): number => Math.max(0, now() - startedAt);

    const validation = validateProbeTarget(target);
    if (!validation.ok) {
        return {
            kind: 'inconclusive',
            reason: validation.reason,
            durationMs: duration(),
            detail: validation.detail,
        };
    }

    const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
    const signal = controller?.signal;
    const handle = setTimeoutFn(() => controller?.abort(), timeoutMs);

    const requestUrl = withCacheBust(validation.url.toString(), randomId());

    try {
        const response = await fetchFn(requestUrl, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'omit',
            redirect: 'error',
            ...(signal ? { signal } : {}),
        });

        if (!response.ok) {
            // The internet works (something answered), but the endpoint is
            // wrong/misconfigured — never treat as offline.
            return {
                kind: 'inconclusive',
                reason: 'http-error',
                durationMs: duration(),
                httpStatus: response.status,
            };
        }

        const text = await readBoundedBody(response, signal as AbortSignal, maxBytes);

        if (signal?.aborted) {
            return { kind: 'unreachable', reason: 'timeout', durationMs: duration() };
        }

        if (text.trimEnd() !== CONNECTIVITY_PROBE_MARKER) {
            return {
                kind: 'inconclusive',
                reason: 'unexpected-body',
                durationMs: duration(),
                httpStatus: response.status,
                detail: `expected marker ${CONNECTIVITY_PROBE_MARKER}`,
            };
        }

        return { kind: 'reachable', durationMs: duration(), httpStatus: response.status };
    } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
            return { kind: 'unreachable', reason: 'timeout', durationMs: duration() };
        }
        return { kind: 'unreachable', reason: 'network-error', durationMs: duration() };
    } finally {
        clearTimeoutFn(handle);
    }
};
