/**
 * LC-2409: a one-shot request, from outside the login page (the lost-login modal's "Sign in
 * with Email"), to switch the login page to the email form and focus its field, as its
 * ClassLink "sign in with your personal email" hint does. In memory only.
 */
let requested = false;
const listeners = new Set<() => void>();

/** Ask the login page to show the email form (now, or as soon as it mounts). */
export const requestPersonalEmailSignIn = (): void => {
    requested = true;
    listeners.forEach(listener => listener());
};

/** Whether a request is waiting; clears it. */
export const consumePersonalEmailSignIn = (): boolean => {
    const was = requested;
    requested = false;
    return was;
};

/** Called on each new request; returns the unsubscribe. */
export const subscribePersonalEmailSignIn = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
