import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const getQuery = (): MediaQueryList | undefined =>
    typeof window === 'undefined' ? undefined : window.matchMedia?.(QUERY);

const subscribe = (onChange: () => void): (() => void) => {
    const query = getQuery();
    // Test polyfills may return a bare `{ matches }` object without listener methods.
    query?.addEventListener?.('change', onChange);
    return () => query?.removeEventListener?.('change', onChange);
};

const getSnapshot = (): boolean => getQuery()?.matches === true;

const getServerSnapshot = (): boolean => false;

/**
 * Whether `prefers-reduced-motion: reduce` matches. It is read synchronously during render, so the
 * first paint already reflects it, and it updates when the preference changes.
 */
export const usePrefersReducedMotion = (): boolean =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
