import axios from 'axios';

/**
 * Base URL for the LearnCard Network (brain-service) OpenAPI, used to resolve a
 * recipient's saved locale by email before they authenticate. Overridable via
 * `NETWORK_BRAIN_SERVICE_URL`; defaults to production.
 */
const BRAIN_SERVICE_URL =
    process.env.NETWORK_BRAIN_SERVICE_URL || 'https://network.learncard.com/api';

/** Max time we'll wait on the locale lookup before falling back. Login must not block on it. */
const LOOKUP_TIMEOUT_MS = 1500;

/**
 * Resolve a recipient's saved language preference by email via brain-service.
 *
 * Login is pre-authentication, so the client can only tell us the UI language —
 * not the account's persisted `locale`. This asks brain-service (which owns the
 * profile) for the account's locale so a Spanish-preference user gets a Spanish
 * login-code email even from a fresh browser in English.
 *
 * Safe to call before auth: brain-service returns `'en'` for unknown emails and
 * never reveals whether an account exists. Returns `undefined` on any failure
 * (network error, timeout, non-2xx) so callers can fall back to the client UI
 * locale — this must never block or fail the login flow.
 */
export const resolveLocaleByEmail = async (email: string): Promise<string | undefined> => {
    try {
        const { data } = await axios.post<{ locale?: string }>(
            `${BRAIN_SERVICE_URL}/utilities/resolve-email-locale`,
            { email },
            { timeout: LOOKUP_TIMEOUT_MS }
        );

        return data?.locale || undefined;
    } catch {
        return undefined;
    }
};
