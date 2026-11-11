import { afterEach, describe, expect, it, vi } from 'vitest';

import { LAST_LOGIN_METHOD_KEY } from '../analytics/storageKeys';
import { recordEmailLoginMethod } from './recordEmailLoginMethod';

describe('recordEmailLoginMethod', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('persists only the fixed email-method marker', () => {
        const setItem = vi.fn();
        vi.stubGlobal('localStorage', { setItem });

        recordEmailLoginMethod();

        expect(setItem).toHaveBeenCalledExactlyOnceWith(LAST_LOGIN_METHOD_KEY, 'email');
    });

    it('lets the sign-in form handle unavailable storage without retrying sign-in', () => {
        vi.stubGlobal('localStorage', {
            setItem: () => {
                throw new Error('Storage unavailable');
            },
        });

        expect(recordEmailLoginMethod).toThrow('Storage unavailable');
    });
});
