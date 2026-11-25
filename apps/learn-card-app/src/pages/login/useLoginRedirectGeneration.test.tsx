import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { describe, expect, it, vi } from 'vitest';

import {
    commitLoginRedirectIfCurrent,
    useLoginRedirectGeneration,
} from './useLoginRedirectGeneration';

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(r => {
        resolve = r;
    });
    return { promise, resolve };
};

/** Mirrors LoginPage's commit: consume the pending redirect, navigate, PIN, onboarding. */
const setup = (identity = 'user-a') => {
    const history = createMemoryHistory({ initialEntries: ['/login'] });
    const pending = { lcnRedirect: '/claim/abc' as string | null };
    const pin = vi.fn();
    const onboarding = vi.fn();
    const hook = renderHook(({ id }) => useLoginRedirectGeneration(history, id), {
        initialProps: { id: identity },
    });

    const attempt = (path: string, prime: Promise<void>) => {
        const owner = hook.result.current;
        const generation = owner.begin();
        return commitLoginRedirectIfCurrent(
            owner,
            generation,
            () => prime,
            () => {
                pending.lcnRedirect = null;
                history.push(path);
                pin();
                onboarding();
            }
        );
    };

    return { history, pending, pin, onboarding, hook, attempt };
};

describe('login redirect ownership across a deferred dashboard prime', () => {
    it('commits when nothing supersedes the attempt', async () => {
        const { history, pending, pin, onboarding, attempt } = setup();
        const prime = deferred();
        const result = attempt('/dashboard', prime.promise);

        expect(history.location.pathname).toBe('/login');
        expect(pending.lcnRedirect).toBe('/claim/abc');

        prime.resolve();
        await expect(result).resolves.toBe(true);
        expect(history.location.pathname).toBe('/dashboard');
        expect(pending.lcnRedirect).toBeNull();
        expect(pin).toHaveBeenCalledOnce();
        expect(onboarding).toHaveBeenCalledOnce();
    });

    it('lets a newer redirect win over a stale one still priming', async () => {
        const { history, pin, onboarding, attempt } = setup();
        const stalePrime = deferred();
        const stale = attempt('/dashboard', stalePrime.promise);

        await expect(attempt('/claim/abc', Promise.resolve())).resolves.toBe(true);
        expect(history.location.pathname).toBe('/claim/abc');

        stalePrime.resolve();
        await expect(stale).resolves.toBe(false);
        expect(history.location.pathname).toBe('/claim/abc');
        expect(pin).toHaveBeenCalledOnce();
        expect(onboarding).toHaveBeenCalledOnce();
    });

    it('drops a stale redirect after a newer navigation during the prime', async () => {
        const { history, pending, pin, onboarding, attempt } = setup();
        const prime = deferred();
        const stale = attempt('/dashboard', prime.promise);

        act(() => history.push('/wallet'));
        prime.resolve();

        await expect(stale).resolves.toBe(false);
        expect(history.location.pathname).toBe('/wallet');
        expect(pending.lcnRedirect).toBe('/claim/abc');
        expect(pin).not.toHaveBeenCalled();
        expect(onboarding).not.toHaveBeenCalled();
    });

    it.each([
        ['sign-out', ''],
        ['a different user', 'user-b'],
    ])('runs nothing after %s during the prime', async (_label, nextIdentity) => {
        const { history, pending, pin, onboarding, hook, attempt } = setup();
        const prime = deferred();
        const stale = attempt('/dashboard', prime.promise);

        hook.rerender({ id: nextIdentity });
        prime.resolve();

        await expect(stale).resolves.toBe(false);
        expect(history.location.pathname).toBe('/login');
        expect(pending.lcnRedirect).toBe('/claim/abc');
        expect(pin).not.toHaveBeenCalled();
        expect(onboarding).not.toHaveBeenCalled();
    });

    it('runs nothing after the login screen unmounts during the prime', async () => {
        const { history, pending, pin, onboarding, hook, attempt } = setup();
        const prime = deferred();
        const stale = attempt('/dashboard', prime.promise);

        hook.unmount();
        prime.resolve();

        await expect(stale).resolves.toBe(false);
        expect(history.location.pathname).toBe('/login');
        expect(pending.lcnRedirect).toBe('/claim/abc');
        expect(pin).not.toHaveBeenCalled();
        expect(onboarding).not.toHaveBeenCalled();
    });

    it('does not treat a StrictMode effect replay as an unmount', async () => {
        const history = createMemoryHistory({ initialEntries: ['/login'] });
        const { result } = renderHook(() => useLoginRedirectGeneration(history, 'user-a'), {
            wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
        });
        const owner = result.current;
        const generation = owner.begin();
        const commit = vi.fn();
        const prime = deferred();
        const pending = commitLoginRedirectIfCurrent(
            owner,
            generation,
            () => prime.promise,
            commit
        );

        await Promise.resolve();
        prime.resolve();

        await expect(pending).resolves.toBe(true);
        expect(commit).toHaveBeenCalledOnce();
    });
});
