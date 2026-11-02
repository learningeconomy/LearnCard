import { Capacitor } from '@capacitor/core';
// Subpath import (not the package barrel): the bare `'learn-card-base'` specifier
// re-exports the whole package, including React components with module-level
// `localStorage` reads that break outside a full app boot. `bootstrapTenantConfig.ts`
// uses the same subpath-import pattern for this exact reason.
import { getTenantBaseUrl } from 'learn-card-base/config/tenantConfig';
import { getResolvedTenantConfig } from '../../config/tenantConfigState';

/**
 * ClassLink sign-in PKCE + state store.
 *
 * Generates and persists a single pending ClassLink authorization attempt
 * (`state`, `nonce`, PKCE `codeVerifier`/`codeChallenge`, `redirectUri`) so the
 * callback route can verify the OIDC response before exchanging the code.
 *
 * Storage backend:
 *  - web: `sessionStorage` (cleared when the tab closes; survives the
 *    same-tab navigation to ClassLink and back).
 *  - native: `localStorage`. `@capacitor/preferences` is NOT a dependency of
 *    this app (verified against package.json), so we reuse the same
 *    web-storage primitive the app already relies on for durable
 *    native state (see `recordEmailLoginMethod.ts`). Unlike `sessionStorage`,
 *    Capacitor's WKWebView/Android WebView persists `localStorage` to disk,
 *    so the pending attempt survives the app being backgrounded (and even an
 *    OS-initiated process kill) while the system browser/ASWebAuthenticationSession
 *    is in the foreground.
 *
 * Never store or log the exchanged `code`, `id_token`, or any custom token here.
 */

/** Path the callback route listens on, for both the web origin and the native universal link. */
export const CLASSLINK_CALLBACK_PATH = '/auth/classlink/callback';

const STORAGE_KEY = 'learncard:classlink:attempt';
/** Mirrors the Keycloak reauth intent TTL (`keycloakReauth.ts`). */
const MAX_AGE_MS = 10 * 60 * 1000;
/** 48 random bytes -> exactly 64 base64url chars (no padding), within the RFC 7636 43-128 range. */
const CODE_VERIFIER_BYTES = 48;
/** 16 random bytes -> 22 base64url chars, matching the CSPRNG id convention used elsewhere (e.g. `generateShareLinkId`). */
const ID_BYTES = 16;

export interface ClassLinkAttempt {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectUri: string;
    createdAt: number;
    redirectTo?: string;
}

export interface CreateClassLinkAttemptOptions {
    /** Where to send the user after the callback completes (UI navigation only, never credentials). */
    redirectTo?: string;
}

export interface CreateClassLinkAttemptResult {
    state: string;
    nonce: string;
    codeVerifier: string;
    codeChallenge: string;
    redirectUri: string;
}

const base64UrlEncode = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const randomBase64Url = (byteLength: number): string =>
    base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));

/** RFC 7636 S256: BASE64URL(SHA-256(ASCII(code_verifier))). */
const deriveCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return base64UrlEncode(new Uint8Array(digest));
};

const getStorage = (): Storage => (Capacitor.isNativePlatform() ? localStorage : sessionStorage);

/**
 * `https://<tenant domain>/auth/classlink/callback`. Web reads the live
 * origin; native resolves the tenant's base URL from the already-bootstrapped
 * TenantConfig (same helper `getAppBaseUrl()` uses), so the universal-link
 * callback always matches the tenant that's actually running. Never hardcode a domain.
 */
export const getClassLinkRedirectUri = (): string => {
    if (Capacitor.isNativePlatform()) {
        const bundleId = getResolvedTenantConfig().native?.bundleId;
        if (!bundleId) {
            throw new Error(
                'Native ClassLink sign-in requires the tenant config native.bundleId to be set'
            );
        }
        return `${bundleId}:/${CLASSLINK_CALLBACK_PATH}`;
    }
    return `${window.location.origin}${CLASSLINK_CALLBACK_PATH}`;
};

const isClassLinkAttempt = (value: unknown): value is ClassLinkAttempt =>
    typeof value === 'object' &&
    value !== null &&
    'state' in value &&
    typeof value.state === 'string' &&
    !!value.state &&
    'nonce' in value &&
    typeof value.nonce === 'string' &&
    !!value.nonce &&
    'codeVerifier' in value &&
    typeof value.codeVerifier === 'string' &&
    !!value.codeVerifier &&
    'redirectUri' in value &&
    typeof value.redirectUri === 'string' &&
    !!value.redirectUri &&
    'createdAt' in value &&
    typeof value.createdAt === 'number' &&
    (!('redirectTo' in value) ||
        value.redirectTo === undefined ||
        typeof value.redirectTo === 'string');

/** Start a new ClassLink sign-in attempt: generates + persists state, overwriting any prior pending attempt. */
export const createClassLinkAttempt = async (
    options: CreateClassLinkAttemptOptions = {}
): Promise<CreateClassLinkAttemptResult> => {
    const state = randomBase64Url(ID_BYTES);
    const nonce = randomBase64Url(ID_BYTES);
    const codeVerifier = randomBase64Url(CODE_VERIFIER_BYTES);
    const codeChallenge = await deriveCodeChallenge(codeVerifier);
    const redirectUri = getClassLinkRedirectUri();

    const attempt: ClassLinkAttempt = {
        state,
        nonce,
        codeVerifier,
        redirectUri,
        createdAt: Date.now(),
        ...(options.redirectTo ? { redirectTo: options.redirectTo } : {}),
    };

    getStorage().setItem(STORAGE_KEY, JSON.stringify(attempt));

    return { state, nonce, codeVerifier, codeChallenge, redirectUri };
};

/**
 * Single-use: always deletes the pending attempt on read (even on mismatch),
 * so a given stored attempt can only ever be consumed once. Returns `null` if
 * nothing is pending, the record is malformed, the `state` doesn't match, or
 * the attempt is older than 10 minutes (or has a clock-skewed future timestamp).
 */
export const consumeClassLinkAttempt = async (state: string): Promise<ClassLinkAttempt | null> => {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    storage.removeItem(STORAGE_KEY);

    if (!raw) return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!isClassLinkAttempt(parsed)) return null;
    if (parsed.state !== state) return null;

    const age = Date.now() - parsed.createdAt;
    if (age < 0 || age > MAX_AGE_MS) return null;

    return parsed;
};
