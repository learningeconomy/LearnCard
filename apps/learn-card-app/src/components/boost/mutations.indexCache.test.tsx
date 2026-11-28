/**
 * goblincore r4574770681 / r4574770689: adding a credential must refresh the
 * primary-profile useGetCredentials key ('' since LC-2383) and the skills aggregate.
 */
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    switchedDid: undefined as string | undefined,
    add: vi.fn(),
}));
vi.mock('learn-card-base', async () => {
    const cache = await import('learn-card-base/react-query/queries/credentialIndexCache');
    return {
        getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
        useWallet: () => ({
            initWallet: async () => ({
                id: { did: () => 'did:example:reader' },
                read: { get: async (uri: string) => ({ id: uri }) },
                index: { LearnCloud: { add: host.add } },
            }),
            syncCredentialToContracts: vi.fn().mockResolvedValue(undefined),
        }),
        insertItem: vi.fn(),
        switchedProfileStore: { get: { switchedDid: () => host.switchedDid } },
        connectionPromptKeys: { all: ['connectionPrompts'] },
        invalidateCredentialIndexQueries: cache.invalidateCredentialIndexQueries,
    };
});
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('@learncard/types', () => ({
    VCValidator: { parseAsync: async (vc: unknown) => vc },
}));
vi.mock('../../pages/pathways/events/walletEventBus', () => ({ publishWalletEvent: vi.fn() }));

import { useAddCredentialToWallet } from './mutations';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const observe = async (queryKey: unknown[]) => {
    const queryFn = vi.fn().mockResolvedValue([]);
    const observer = new QueryObserver(client, {
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    return { queryFn, unsubscribe };
};

beforeEach(() => {
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.add.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    client.clear();
});

it.each([
    ['primary', undefined, ''],
    ['switched', 'did:web:child', 'did:web:child'],
])(
    'refreshes useGetCredentials and skills for the %s profile after an add',
    async (_label, switchedDid, profileDid) => {
        host.switchedDid = switchedDid;
        const credentials = await observe([
            'useGetCredentials',
            profileDid,
            'Achievement',
            undefined,
        ]);
        const skills = await observe(['useGetSkills', profileDid]);
        const ids = await observe(['useGetIDs', profileDid]);
        const { result } = renderHook(() => useAddCredentialToWallet(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ uri: 'lc:cloud:uri-1' });
        });

        expect(host.add).toHaveBeenCalledWith(expect.objectContaining({ uri: 'lc:cloud:uri-1' }));
        await vi.waitFor(() => expect(credentials.queryFn).toHaveBeenCalledTimes(2));
        await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
        await vi.waitFor(() => expect(ids.queryFn).toHaveBeenCalledTimes(2));
        [credentials, skills, ids].forEach(observer => observer.unsubscribe());
    }
);
