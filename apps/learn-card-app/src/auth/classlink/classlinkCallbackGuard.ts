/**
 * Module-level single-flight guard for the ClassLink callback routes.
 *
 * A `useRef` guard only covers one component instance. React StrictMode, an Ionic
 * page remount, or the router rendering the callback route twice can create a second
 * instance for the same URL; that instance would find the PKCE attempt already
 * consumed and show "link expired" (and bounce to /login) while the first instance is
 * still exchanging the code. Keyed by the callback's query, so a fresh attempt (new
 * code/state) is never blocked, and a key is released once its processing finishes.
 */
const inFlightCallbacks = new Set<string>();

/** Stable key for a callback URL's OAuth params. */
export const getClassLinkCallbackKey = (params: {
    code: string | null;
    state: string | null;
    error: string | null;
}): string => `${params.code ?? ''}|${params.state ?? ''}|${params.error ?? ''}`;

/**
 * Claims a callback for processing. Returns a `release` function for the first claim of
 * a key, and `null` while that key is still being processed (a duplicate instance must
 * then do nothing; the owning instance navigates away). Call `release` once processing
 * has finished so a later, genuine visit to the same URL is not blocked.
 */
export const claimClassLinkCallback = (key: string): (() => void) | null => {
    if (inFlightCallbacks.has(key)) return null;
    inFlightCallbacks.add(key);
    return () => {
        inFlightCallbacks.delete(key);
    };
};

/** Test-only: forget claimed callbacks. */
export const resetClassLinkCallbackClaims = (): void => {
    inFlightCallbacks.clear();
};
