// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({ switchedDid: undefined as string | undefined, init: vi.fn() }));
vi.mock('../hooks/useWallet', () => ({ useWallet: () => ({ initWallet: host.init }) }));
vi.mock('../stores/walletStore', () => ({
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
}));

import { useHcpChange, useHcpEntries } from './useHcp';

const SUBJECT = 'did:key:z6MkSubject';

const makeHcp = () => ({
    entries: {
        list: {
            query: vi
                .fn()
                .mockResolvedValue({ subject: { id: SUBJECT }, entries: [], truncated: false }),
        },
        create: { mutate: vi.fn().mockResolvedValue({ id: 'urn:uuid:1' }) },
        revise: { mutate: vi.fn() },
        withdraw: { mutate: vi.fn().mockResolvedValue({ status: 'deleted' }) },
    },
    grants: {
        list: { query: vi.fn().mockResolvedValue([]) },
        create: { mutate: vi.fn().mockResolvedValue({ grantId: 'g1' }) },
        revoke: { mutate: vi.fn().mockResolvedValue({ grantId: 'g1', status: 'revoked' }) },
    },
});

const setup = () => {
    const hcp = makeHcp();
    host.init.mockResolvedValue({ invoke: { getHcpClient: vi.fn().mockResolvedValue(hcp) } });
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { hcp, client, wrapper };
};

afterEach(() => {
    cleanup();
    host.init.mockReset();
    host.switchedDid = undefined;
});

describe('HCP hooks', () => {
    it('names the Context Subject the brain reports, not the public profile DID', async () => {
        const { hcp, wrapper } = setup();
        const { result } = renderHook(() => useHcpChange(), { wrapper });
        const input = {
            schema: 'https://hcp.example/spec/entry/2.0' as const,
            content: {
                profile: 'https://hcp.example/spec/profiles/general-context/2.0' as const,
                value: 'x',
            },
            classification: { categories: ['goals_and_constraints'] },
            assertion: { declarationType: 'person-declared' as const },
            record: { provenance: { source: 'learncard-app' } },
        };
        await act(() => result.current.mutateAsync({ kind: 'add', input }));
        expect(hcp.entries.create.mutate).toHaveBeenCalledWith({
            ...input,
            subject: { id: SUBJECT },
        });
    });

    it('revokes and withdraws by id, then refreshes the profile cache', async () => {
        const { hcp, client, wrapper } = setup();
        const entries = renderHook(() => useHcpEntries(), { wrapper });
        await waitFor(() => expect(entries.result.current.isSuccess).toBe(true));
        expect(hcp.entries.list.query).toHaveBeenCalledTimes(1);

        const { result } = renderHook(() => useHcpChange(), { wrapper });
        await act(() => result.current.mutateAsync({ kind: 'revoke', grantId: 'g1' }));
        await act(() => result.current.mutateAsync({ kind: 'remove', entryId: 'e1' }));
        expect(hcp.grants.revoke.mutate).toHaveBeenCalledWith({ grantId: 'g1' });
        expect(hcp.entries.withdraw.mutate).toHaveBeenCalledWith({
            entryId: 'e1',
            reason: 'Removed by the person',
        });
        await waitFor(() => expect(hcp.entries.list.query).toHaveBeenCalledTimes(3));
        expect(client.getQueryState(['hcp', '', 'entries'])?.status).toBe('success');
    });

    it('keeps profiles apart in the cache', async () => {
        const { wrapper, client } = setup();
        host.switchedDid = 'did:web:child';
        const entries = renderHook(() => useHcpEntries(), { wrapper });
        await waitFor(() => expect(entries.result.current.isSuccess).toBe(true));
        expect(client.getQueryData(['hcp', 'did:web:child', 'entries'])).toBeTruthy();
        expect(client.getQueryData(['hcp', '', 'entries'])).toBeUndefined();
    });

    it('refreshes the profile that made a change, even after a switch mid-change', async () => {
        const { hcp, client, wrapper } = setup();
        let finish: (value: unknown) => void = () => undefined;
        hcp.grants.revoke.mutate.mockReturnValue(new Promise(resolve => (finish = resolve)));
        client.setQueryData(['hcp', '', 'grants', 'active'], []);
        client.setQueryData(['hcp', 'did:web:child', 'grants', 'active'], []);

        const { result, rerender } = renderHook(() => useHcpChange(), { wrapper });
        let pending: Promise<unknown> = Promise.resolve();
        act(() => {
            pending = result.current.mutateAsync({ kind: 'revoke', grantId: 'g1' });
        });
        await waitFor(() => expect(hcp.grants.revoke.mutate).toHaveBeenCalled());
        host.switchedDid = 'did:web:child';
        rerender();
        await act(async () => {
            finish({ grantId: 'g1', status: 'revoked' });
            await pending;
        });

        expect(client.getQueryState(['hcp', '', 'grants', 'active'])?.isInvalidated).toBe(true);
        expect(
            client.getQueryState(['hcp', 'did:web:child', 'grants', 'active'])?.isInvalidated
        ).toBe(false);
    });
});
