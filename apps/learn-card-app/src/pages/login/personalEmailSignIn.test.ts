import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    consumePersonalEmailSignIn,
    requestPersonalEmailSignIn,
    shouldShowPersonalEmailHint,
    subscribePersonalEmailSignIn,
} from './personalEmailSignIn';

afterEach(() => {
    consumePersonalEmailSignIn();
});

describe('personalEmailSignIn', () => {
    it('tells a mounted login page, once', () => {
        const listener = vi.fn(() => expect(consumePersonalEmailSignIn()).toBe(true));
        const unsubscribe = subscribePersonalEmailSignIn(listener);
        requestPersonalEmailSignIn();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(consumePersonalEmailSignIn()).toBe(false);
        unsubscribe();
        requestPersonalEmailSignIn();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('waits for a login page that mounts later', () => {
        requestPersonalEmailSignIn();
        expect(consumePersonalEmailSignIn()).toBe(true);
        expect(consumePersonalEmailSignIn()).toBe(false);
    });
});

describe('shouldShowPersonalEmailHint', () => {
    const KEEP_ACCOUNT = {
        classlinkSso: true,
        classlinkPersonalEmail: true,
        classlinkKeepAccount: true,
    };
    const base = {
        features: KEEP_ACCOUNT,
        coordinatorStatus: 'idle',
        showSocialLogins: true,
        canUseEmailForm: true,
    };

    it('shows next to the ClassLink button where students can add a personal email', () => {
        expect(shouldShowPersonalEmailHint(base)).toBe(true);
    });

    it('hides on a ClassLink tenant with the keep-account flags off (the default)', () => {
        expect(shouldShowPersonalEmailHint({ ...base, features: { classlinkSso: true } })).toBe(
            false
        );
        expect(
            shouldShowPersonalEmailHint({
                ...base,
                features: { ...KEEP_ACCOUNT, classlinkKeepAccount: false },
            })
        ).toBe(false);
        expect(
            shouldShowPersonalEmailHint({
                ...base,
                features: { ...KEEP_ACCOUNT, classlinkPersonalEmail: false },
            })
        ).toBe(false);
    });

    it('hides without ClassLink, while signing in, behind a code step, or without email sign-in', () => {
        expect(
            shouldShowPersonalEmailHint({
                ...base,
                features: { ...KEEP_ACCOUNT, classlinkSso: false },
            })
        ).toBe(false);
        expect(shouldShowPersonalEmailHint({ ...base, coordinatorStatus: 'ready' })).toBe(false);
        expect(shouldShowPersonalEmailHint({ ...base, showSocialLogins: false })).toBe(false);
        expect(shouldShowPersonalEmailHint({ ...base, canUseEmailForm: false })).toBe(false);
    });
});
