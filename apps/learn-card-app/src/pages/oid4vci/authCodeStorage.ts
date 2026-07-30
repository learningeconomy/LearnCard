/**
 * Persistence layer for the OID4VCI authorization-code round-trip.
 *
 * The auth-code flow inherently spans a top-level redirect: the wallet
 * sends the user to the issuer's authorization endpoint, which later
 * redirects back to `/oid4vci?code=...&state=...`. Between those two
 * page loads we need to remember the opaque `flowHandle` returned by
 * `beginCredentialOfferAuthCode` so we can hand it to
 * `completeCredentialOfferAuthCode`.
 *
 * `localStorage` is the simplest persistence boundary that survives a
 * full-page navigation. We keep this module tiny so it can be unit-tested
 * with a `jsdom` `window.localStorage`.
 */

import type { AuthCodeFlowHandle } from '@learncard/openid4vc-plugin';

/** Storage key. Single in-flight flow at a time \u2014 the wallet can\u2019t do
 * concurrent auth-code redirects, so a single slot is fine. */
const FLOW_HANDLE_KEY = 'oid4vci.flowHandle.v1';

/** Storage shape. Wraps the plugin's flow handle with a timestamp so we
 * can age out stale handles (e.g. user opened the redirect, abandoned
 * it, came back days later). */
export interface PersistedAuthCodeState {
    flowHandle: AuthCodeFlowHandle;
    /** When the wallet kicked off the redirect. Epoch ms. */
    startedAt: number;
    /** The original offer URI the user scanned. Lets us recover from a
     *  failed callback and offer the user "try again" without asking
     *  them to re-scan. */
    offerUri: string;
}

/** Sane upper bound for how long a half-finished auth-code flow may live. */
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Persist a flow handle alongside the original offer URI.
 *
 * Returns `false` and silently no-ops if `localStorage` is unavailable
 * (Safari private mode / iframe with sandboxing) \u2014 the caller can decide
 * whether to abort the redirect or proceed anyway with a degraded UX.
 */
export const saveAuthCodeState = (
    flowHandle: AuthCodeFlowHandle,
    offerUri: string,
    nowMs: number = Date.now(),
    storage: Pick<Storage, 'setItem'> | null = safeLocalStorage()
): boolean => {
    if (!storage) return false;

    const payload: PersistedAuthCodeState = {
        flowHandle,
        offerUri,
        startedAt: nowMs,
    };

    try {
        storage.setItem(FLOW_HANDLE_KEY, JSON.stringify(payload));
        return true;
    } catch {
        return false;
    }
};

/**
 * Read back a previously-persisted auth-code state. Returns `null` if:
 *  - storage is unavailable
 *  - nothing was persisted
 *  - the persisted JSON can\u2019t be parsed
 *  - the persisted state is older than `ttlMs`
 *  - the `state` parameter from the redirect doesn\u2019t match
 *    `flowHandle.state` (CSRF / mismatched-flow protection)
 */
export const loadAuthCodeState = (
    expectedState: string | undefined,
    nowMs: number = Date.now(),
    ttlMs: number = DEFAULT_TTL_MS,
    storage: Pick<Storage, 'getItem'> | null = safeLocalStorage()
): PersistedAuthCodeState | null => {
    if (!storage) return null;

    let raw: string | null;
    try {
        raw = storage.getItem(FLOW_HANDLE_KEY);
    } catch {
        return null;
    }
    if (!raw) return null;

    let parsed: PersistedAuthCodeState;
    try {
        parsed = JSON.parse(raw) as PersistedAuthCodeState;
    } catch {
        return null;
    }

    if (
        !parsed
        || typeof parsed !== 'object'
        || !parsed.flowHandle
        || typeof parsed.startedAt !== 'number'
    ) {
        return null;
    }

    if (nowMs - parsed.startedAt > ttlMs) return null;

    if (expectedState && parsed.flowHandle.state !== expectedState) {
        // CSRF check: the redirect handed us a different `state` than
        // the one we persisted. Refuse to consume \u2014 the caller will
        // surface this as an error.
        return null;
    }

    return parsed;
};

/**
 * Clear any persisted state. Idempotent.
 */
export const clearAuthCodeState = (
    storage: Pick<Storage, 'removeItem'> | null = safeLocalStorage()
): void => {
    if (!storage) return;
    try {
        storage.removeItem(FLOW_HANDLE_KEY);
    } catch {
        /* no-op */
    }
};

/**
 * Resolve `window.localStorage` in a way that doesn\u2019t throw in
 * environments where it\u2019s either undefined (SSR) or access-restricted
 * (Safari private mode throws on touch).
 */
const safeLocalStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};
