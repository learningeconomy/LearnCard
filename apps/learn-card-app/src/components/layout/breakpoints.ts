import { useSyncExternalStore } from 'react';

/** Ionic's grid breakpoints (`SIZE_TO_MEDIA` in @ionic/core). `''` always matches. */
export const BREAKPOINTS = ['', 'Xs', 'Sm', 'Md', 'Lg', 'Xl'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

const MEDIA: Record<Exclude<Breakpoint, ''>, string> = {
    Xs: '(min-width: 0px)',
    Sm: '(min-width: 576px)',
    Md: '(min-width: 768px)',
    Lg: '(min-width: 992px)',
    Xl: '(min-width: 1200px)',
};

/** Bit i is set when BREAKPOINTS[i] matches. Without matchMedia only `''` matches, as in Ionic. */
const getMatches = (): number => {
    if (typeof window === 'undefined' || !window.matchMedia) return 1;
    return BREAKPOINTS.reduce(
        (mask, bp, i) =>
            bp === '' || window.matchMedia(MEDIA[bp]).matches ? mask | (1 << i) : mask,
        0
    );
};

// ion-col re-renders on every window resize; resize also covers media-query changes.
const subscribe = (onChange: () => void): (() => void) => {
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
};

/** Which grid breakpoints match the viewport, as a bit mask over BREAKPOINTS. */
export const useBreakpointMatches = (): number =>
    useSyncExternalStore(subscribe, getMatches, () => 1);
