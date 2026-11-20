import { isKeepAccountEnabled } from '../../components/classlink/keepAccountFlags';

/**
 * LC-2409: whether the login page shows "Left your school? Sign in with your personal
 * email." Only where ClassLink students can add that email (the keep-account tenant flags,
 * which are off by default), next to the ClassLink button (signed out, social buttons
 * shown, not while a form asks for its code) and when this tenant signs in by email.
 */
export const shouldShowPersonalEmailHint = (params: {
    features: Parameters<typeof isKeepAccountEnabled>[0];
    coordinatorStatus: string;
    showSocialLogins: boolean;
    canUseEmailForm: boolean;
}): boolean =>
    isKeepAccountEnabled(params.features) &&
    params.coordinatorStatus === 'idle' &&
    params.showSocialLogins &&
    params.canUseEmailForm;

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
