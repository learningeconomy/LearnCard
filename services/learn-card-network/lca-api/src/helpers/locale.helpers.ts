import axios from 'axios';

import cache from '@cache';

/**
 * Base URL for the LearnCard Network (brain-service) OpenAPI, used to resolve a
 * recipient's saved locale by email before they authenticate. Overridable via
 * `NETWORK_BRAIN_SERVICE_URL`; defaults to production.
 */
const BRAIN_SERVICE_URL =
    process.env.NETWORK_BRAIN_SERVICE_URL || 'https://network.learncard.com/api';

/** Max time we'll wait on the locale lookup before falling back. Login must not block on it. */
const LOOKUP_TIMEOUT_MS = 1500;

/** How long a resolved locale (or "no preference") is cached, so we don't hit brain-service on every login. */
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

const cacheKey = (email: string): string => `email-locale:${email.toLowerCase()}`;

/** Sentinel stored to negatively-cache "no saved preference / no account" (empty string). */
const NO_LOCALE = '';

/**
 * Ask brain-service for the account's saved locale. Returns the locale string,
 * `null` when there's no saved preference / no account, or `undefined` on any
 * failure (so the caller can distinguish "known: none" from "lookup failed").
 */
const fetchLocaleByEmail = async (email: string): Promise<string | null | undefined> => {
    try {
        const { data } = await axios.post<{ locale?: string | null }>(
            `${BRAIN_SERVICE_URL}/utilities/resolve-email-locale`,
            { email },
            { timeout: LOOKUP_TIMEOUT_MS }
        );

        return data?.locale ?? null;
    } catch {
        return undefined;
    }
};

/**
 * Resolve a recipient's saved language preference by email via brain-service,
 * cached in Redis (cache-aside).
 *
 * Login is pre-authentication, so the client can only tell us the UI language —
 * not the account's persisted `locale`. This asks brain-service (which owns the
 * profile) for the account's locale so a Spanish-preference user gets a Spanish
 * login-code email even from a fresh browser in English.
 *
 * The result is cached for an hour so repeated logins for the same email don't
 * re-hit brain-service on every attempt; "no preference" is negatively cached
 * too. Safe to call before auth: brain-service never reveals whether an account
 * exists (missing account and no-preference both resolve to "none").
 *
 * Returns `undefined` when there's no saved preference OR the lookup fails
 * (network error, timeout, non-2xx) so callers can fall back to the client UI
 * locale — this must never block or fail the login flow. Only successful lookups
 * are cached; failures are left uncached so the next attempt retries.
 */
export const resolveLocaleByEmail = async (email: string): Promise<string | undefined> => {
    const key = cacheKey(email);

    const cached = await cache.get(key).catch(() => null);
    if (cached !== null && cached !== undefined) return cached || undefined;

    const resolved = await fetchLocaleByEmail(email);

    // Only cache definitive answers (a locale or "no preference"); leave failures
    // uncached so a transient brain-service error doesn't stick for an hour.
    if (resolved !== undefined) {
        await cache.set(key, resolved ?? NO_LOCALE, CACHE_TTL_SECONDS).catch(() => undefined);
    }

    return resolved || undefined;
};
