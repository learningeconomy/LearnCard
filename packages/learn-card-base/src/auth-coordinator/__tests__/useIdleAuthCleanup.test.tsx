// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleAuthCleanup } from '../useIdleAuthCleanup';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('idle auth cleanup provenance', () => {
    it('keeps an anonymous public listing request alive after startup settles idle', async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        let resolveListing: (name: string) => void = () => undefined;
        const load = vi.fn(
            () =>
                new Promise<string>(resolve => {
                    resolveListing = resolve;
                })
        );
        const clearAccount = vi.fn();
        const hasLiveAuthUser = () => false;
        const clearQueries = () => client.clear();
        const Page = () => {
            useIdleAuthCleanup({
                status: 'idle',
                hasEndedAuthSession: false,
                hasStoredAuthUser: false,
                hasLiveAuthUser,
                clearCachedAccount: clearAccount,
                clearAccountQueries: clearQueries,
            });
            const query = useQuery({ queryKey: ['public-listing'], queryFn: load });
            return <div>{query.data ?? 'Loading app...'}</div>;
        };
        render(
            <QueryClientProvider client={client}>
                <Page />
            </QueryClientProvider>
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(client.getQueryCache().findAll()).toHaveLength(1);
        await act(async () => {
            resolveListing('Public Test App');
            await vi.advanceTimersByTimeAsync(20);
        });
        expect(screen.getByText('Public Test App')).toBeTruthy();
        expect(load).toHaveBeenCalledOnce();
        expect(clearAccount).not.toHaveBeenCalled();
        client.clear();
    });

    it('does not clear seeded account state during startup without a provider session', async () => {
        const clearAccount = vi.fn();
        const clearQueries = vi.fn();
        const Probe = () => {
            useIdleAuthCleanup({
                status: 'idle',
                hasEndedAuthSession: false,
                hasStoredAuthUser: false,
                hasLiveAuthUser: () => false,
                clearCachedAccount: clearAccount,
                clearAccountQueries: clearQueries,
            });
            return null;
        };
        render(<Probe />);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(clearAccount).not.toHaveBeenCalled();
        expect(clearQueries).not.toHaveBeenCalled();
    });

    it('clears a propagated sign-out even when the generic auth-user store is already empty', async () => {
        const clearAccount = vi.fn();
        const clearQueries = vi.fn();
        const Probe = () => {
            useIdleAuthCleanup({
                status: 'idle',
                hasEndedAuthSession: true,
                hasStoredAuthUser: false,
                hasLiveAuthUser: () => false,
                clearCachedAccount: clearAccount,
                clearAccountQueries: clearQueries,
            });
            return null;
        };
        render(<Probe />);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });
        expect(clearAccount).toHaveBeenCalledOnce();
        expect(clearQueries).toHaveBeenCalledOnce();
    });

    it('retains legacy stale-account cleanup without clearing public queries on cold startup', async () => {
        const clearAccount = vi.fn();
        const clearQueries = vi.fn();
        const Probe = () => {
            useIdleAuthCleanup({
                status: 'idle',
                hasEndedAuthSession: false,
                hasStoredAuthUser: true,
                hasLiveAuthUser: () => false,
                clearCachedAccount: clearAccount,
                clearAccountQueries: clearQueries,
            });
            return null;
        };
        render(<Probe />);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });
        expect(clearAccount).toHaveBeenCalledOnce();
        expect(clearQueries).not.toHaveBeenCalled();
    });

    it('does not erase a new login that completes before delayed cleanup', async () => {
        let signedIn = false;
        const clearAccount = vi.fn();
        const clearQueries = vi.fn();
        const Probe = () => {
            useIdleAuthCleanup({
                status: 'idle',
                hasEndedAuthSession: true,
                hasStoredAuthUser: false,
                hasLiveAuthUser: () => signedIn,
                clearCachedAccount: clearAccount,
                clearAccountQueries: clearQueries,
            });
            return null;
        };
        render(<Probe />);
        signedIn = true;
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });
        expect(clearAccount).not.toHaveBeenCalled();
        expect(clearQueries).not.toHaveBeenCalled();
    });
});
