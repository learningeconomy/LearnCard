// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
    keepAccountAskedThisSession,
    markKeepAccountAskedThisSession,
    resetKeepAccountSessionForTests,
    useKeepAccountAskedThisSession,
} from './keepAccountSession';

afterEach(resetKeepAccountSessionForTests);

describe('keepAccountSession', () => {
    it('remembers for the session that the user was asked', () => {
        expect(keepAccountAskedThisSession()).toBe(false);
        markKeepAccountAskedThisSession();
        expect(keepAccountAskedThisSession()).toBe(true);
        expect(sessionStorage.getItem('classlink_keep_account_asked')).toBe('1');
    });

    it('re-renders a reader as soon as a sheet asks', () => {
        const { result } = renderHook(() => useKeepAccountAskedThisSession());
        expect(result.current).toBe(false);
        act(() => markKeepAccountAskedThisSession());
        expect(result.current).toBe(true);
    });
});
