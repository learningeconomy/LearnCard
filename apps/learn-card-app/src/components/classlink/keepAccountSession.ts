import { useSyncExternalStore } from 'react';

const ASKED_KEY = 'classlink_keep_account_asked';

// In memory too, for when sessionStorage is unavailable.
let askedThisSession = false;
const listeners = new Set<() => void>();

/**
 * Record that the user was just asked to keep their account in this app session (the
 * onboarding step, or the transcript sheet's step). The dashboard banner then waits for a
 * later session rather than asking again right away.
 */
export const markKeepAccountAskedThisSession = (): void => {
    askedThisSession = true;
    try {
        sessionStorage.setItem(ASKED_KEY, '1');
    } catch {
        /* The in-memory flag still covers this page load. */
    }
    listeners.forEach(listener => listener());
};

/** Whether the user was asked in this app session (see `markKeepAccountAskedThisSession`). */
export const keepAccountAskedThisSession = (): boolean => {
    if (askedThisSession) return true;
    try {
        return sessionStorage.getItem(ASKED_KEY) === '1';
    } catch {
        return false;
    }
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** `keepAccountAskedThisSession`, re-rendering when it changes (e.g. a sheet just asked). */
export const useKeepAccountAskedThisSession = (): boolean =>
    useSyncExternalStore(subscribe, keepAccountAskedThisSession);

/** Tests only: forget that the user was asked. */
export const resetKeepAccountSessionForTests = (): void => {
    askedThisSession = false;
    try {
        sessionStorage.removeItem(ASKED_KEY);
    } catch {
        /* Nothing stored. */
    }
    listeners.forEach(listener => listener());
};
