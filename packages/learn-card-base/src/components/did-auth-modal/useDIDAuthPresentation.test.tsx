// @vitest-environment happy-dom
import React, { StrictMode } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDIDAuthPresentation } from './useDIDAuthPresentation';

afterEach(cleanup);

it('signs once through StrictMode and rerenders with new function identities', async () => {
    let finish!: (value: string) => void;
    const sign = vi.fn(
        (_challenge: string, _domain?: string) =>
            new Promise<string>(resolve => {
                finish = resolve;
            })
    );
    const { result, rerender } = renderHook(
        () => useDIDAuthPresentation('challenge', 'example.com', (...args) => sign(...args)),
        { wrapper: ({ children }) => <StrictMode>{children}</StrictMode> }
    );
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
    rerender();
    rerender();
    await act(async () => finish('signed'));
    expect(result.current).toBe('signed');
    rerender();
    expect(sign).toHaveBeenCalledTimes(1);
});

it('ignores stale results when challenge or domain changes', async () => {
    const pending: ((value: string) => void)[] = [];
    const sign = vi.fn(
        (_challenge: string, _domain?: string) =>
            new Promise<string>(resolve => pending.push(resolve))
    );
    const { result, rerender } = renderHook(
        ({ challenge, domain }) => useDIDAuthPresentation(challenge, domain, sign),
        { initialProps: { challenge: 'a', domain: 'one' } }
    );
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
    rerender({ challenge: 'b', domain: 'one' });
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(2));
    await act(async () => pending[0]('stale'));
    expect(result.current).toBeUndefined();
    await act(async () => pending[1]('current'));
    expect(result.current).toBe('current');
    rerender({ challenge: 'b', domain: 'two' });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(sign).toHaveBeenCalledTimes(3));
    await act(async () => pending[2]('new domain'));
    expect(result.current).toBe('new domain');
});
