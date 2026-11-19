import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    consumePersonalEmailSignIn,
    requestPersonalEmailSignIn,
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
