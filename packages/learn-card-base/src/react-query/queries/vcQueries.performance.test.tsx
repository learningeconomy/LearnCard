// @vitest-environment happy-dom
import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
    CredentialCategoryEnum: (await import('../../types/boostAndCredentialMetadata'))
        .CredentialCategoryEnum,
    categoryMetadata: {},
    newCredsStore: {},
    credentialWithEditsHelper: (vc: VC) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getIssuanceDate: (vc: VC) => vc.issuanceDate,
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
vi.mock('../mutations/syncConsentFlow', () => ({
    useSyncConsentContractsMutation: vi.fn(),
    useAcceptAndStoreCredentialsMutation: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
vi.mock('learn-card-base/helpers/backfills', () => ({ useBackfillBoostUris: vi.fn() }));
import {
    useGetResolvedCredential,
    useGetResolvedCredentials,
    useResolveManyCredentials,
    useGetCredentials,
    useGetCredentialsForSkills,
    useGetCredentialsPaginated,
} from './vcQueries';

const vc = {
    type: ['VerifiableCredential'],
    issuanceDate: '2026-09-30',
    credentialSubject: { id: 'subject' },
} as VC;
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.wallet = null;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
});
const makeWallet = (did = 'account-a') => {
    const read = vi.fn().mockResolvedValue(vc);
    const get = vi.fn().mockResolvedValue([{ uri: 'uri' }]);
    host.wallet = {
        id: { did: () => did },
        read: { get: read },
        index: { LearnCloud: { get } },
    } as unknown as BespokeLearnCard;
    return { read, get };
};
describe('credential query consumers', () => {
    it('shares one document across single, plural, collection and category hooks', async () => {
        const { read } = makeWallet();
        const { result } = renderHook(
            () => ({
                single: useGetResolvedCredential('uri'),
                plural: useGetResolvedCredentials(['uri']),
                many: useResolveManyCredentials(['uri']),
                list: useGetCredentials(),
            }),
            { wrapper }
        );
        await waitFor(() =>
            expect(
                result.current.list.isSuccess &&
                    result.current.single.isSuccess &&
                    result.current.plural[0].isSuccess &&
                    result.current.many.isSuccess
            ).toBe(true)
        );
        expect(read).toHaveBeenCalledTimes(1);
    });
    it('waits for an account reader, ignores missing URIs, and changes cache on account switch', async () => {
        const { result, rerender } = renderHook(
            () => useGetResolvedCredentials(['uri', undefined]),
            { wrapper }
        );
        expect(host.init).not.toHaveBeenCalled();
        const a = makeWallet();
        rerender();
        await waitFor(() => expect(result.current[0].isSuccess).toBe(true));
        expect(a.read).toHaveBeenCalledExactlyOnceWith('uri');
        const b = makeWallet('account-b');
        host.switchedDid = 'account-b';
        rerender();
        await waitFor(() => expect(b.read).toHaveBeenCalledExactlyOnceWith('uri'));
        expect(a.read).toHaveBeenCalledTimes(1);
        host.switchedDid = 'account-c';
        rerender();
        expect(result.current[0].data).toBeUndefined();
        expect(b.read).toHaveBeenCalledTimes(1);
    });
    it('starts all nine skill categories before any finishes and resolves duplicate URIs once', async () => {
        const { get, read } = makeWallet();
        const pending: Array<(records: { uri: string }[]) => void> = [];
        get.mockImplementation(() => new Promise(resolve => pending.push(resolve)));
        const { result } = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(get).toHaveBeenCalledTimes(9));
        pending.forEach(resolve => resolve([{ uri: 'uri' }]));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(read).toHaveBeenCalledTimes(1);
        expect(result.current.data).toHaveLength(9);
    });
});

it('keeps readable paginated credentials, category metadata and shared document identity', async () => {
    const { read } = makeWallet();
    const wallet = host.wallet!;
    wallet.index.LearnCloud.getPage = vi.fn().mockResolvedValue({
        records: [
            { uri: 'uri', category: 'ID' },
            { uri: 'missing', category: 'ID' },
        ],
        hasMore: false,
    });
    read.mockImplementation(async uri => (uri === 'missing' ? undefined : vc));
    const { result } = renderHook(
        () => ({
            single: useGetResolvedCredential('uri'),
            page: useGetCredentialsPaginated(undefined, undefined, true),
        }),
        { wrapper }
    );
    await waitFor(() => expect(result.current.page.isSuccess).toBe(true));
    expect(result.current.page.data).toEqual([{ vc, uri: 'uri', category: 'ID' }]);
    expect(read.mock.calls.filter(([uri]) => uri === 'uri')).toHaveLength(1);
    expect(vc).not.toHaveProperty('uri');
});

const listConsumers = [
    ['category', () => useGetCredentials(), false],
    ['category with URIs', () => useGetCredentials(undefined, undefined, true), true],
    ['skills', () => useGetCredentialsForSkills(), false],
    ['paginated', () => useGetCredentialsPaginated(), false],
    ['paginated with URIs', () => useGetCredentialsPaginated(undefined, undefined, true), true],
] as const;

describe.each(['missing', 'unreadable'] as const)('%s credential isolation', failure => {
    it.each(listConsumers)('keeps healthy records in %s lists', async (_name, useList, withUri) => {
        const { get, read } = makeWallet();
        const older = { ...vc, issuanceDate: '2026-09-29' } as VC;
        const records = [
            { uri: 'older', category: 'ID' },
            { uri: 'bad', category: 'ID' },
            { uri: 'newer', category: 'ID' },
        ];
        get.mockResolvedValue(records);
        host.wallet!.index.LearnCloud.getPage = vi.fn().mockResolvedValue({
            records,
            hasMore: false,
        });
        read.mockImplementation(async uri => {
            if (uri === 'bad') {
                if (failure === 'unreadable') throw new Error('offline');
                return undefined;
            }
            return uri === 'older' ? older : vc;
        });
        const { result } = renderHook(useList, { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        const entries = result.current.data!;
        const resolved = withUri ? entries.map(entry => (entry as { vc: VC }).vc) : entries;
        const copies = _name === 'skills' ? 9 : 1;
        expect(resolved).toEqual([...Array(copies).fill(vc), ...Array(copies).fill(older)]);
        if (withUri) {
            expect(entries.map(entry => (entry as { uri: string }).uri)).toEqual([
                'newer',
                'older',
            ]);
        }
        expect(vc).not.toHaveProperty('uri');
    });

    it('preserves URI positions in many-credential results', async () => {
        const { read } = makeWallet();
        read.mockImplementation(async uri => {
            if (uri === 'bad') {
                if (failure === 'unreadable') throw new Error('offline');
                return undefined;
            }
            return vc;
        });
        const { result } = renderHook(() => useResolveManyCredentials(['uri', 'bad', 'uri']), {
            wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([vc, undefined, vc]);
        expect(read.mock.calls.filter(([uri]) => uri === 'uri')).toHaveLength(1);
    });
});

it('skips missing-data retries in mounted single and plural hooks with the app retry default', async () => {
    client.setDefaultOptions({ queries: { retry: 3, retryDelay: 0 } });
    const { read } = makeWallet();
    read.mockResolvedValue(undefined);
    const { result } = renderHook(
        () => ({
            single: useGetResolvedCredential('bad'),
            plural: useGetResolvedCredentials(['bad']),
        }),
        { wrapper }
    );
    await waitFor(() =>
        expect(result.current.single.isError && result.current.plural[0].isError).toBe(true)
    );
    expect(read).toHaveBeenCalledTimes(1);
    read.mockResolvedValue(vc);
    await result.current.single.refetch();
    await waitFor(() => expect(result.current.single.data).toEqual(vc));
    expect(result.current.plural[0].data).toEqual(vc);
    expect(read).toHaveBeenCalledTimes(2);
});

it('resumes same-account cached reads after reader re-initialization without re-fetching', async () => {
    const { read } = makeWallet();
    const readyWallet = host.wallet;
    const { result, rerender } = renderHook(
        () => ({
            single: useGetResolvedCredential('uri'),
            many: useResolveManyCredentials(['uri']),
        }),
        { wrapper }
    );
    await waitFor(() =>
        expect(result.current.single.isSuccess && result.current.many.isSuccess).toBe(true)
    );
    host.wallet = null;
    rerender();
    expect(result.current.single.fetchStatus).toBe('idle');
    expect(result.current.single.data).toBeUndefined();
    expect(result.current.many.data).toBeUndefined();
    host.wallet = readyWallet;
    rerender();
    await waitFor(() => expect(result.current.single.data).toEqual(vc));
    expect(result.current.many.data).toEqual([vc]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(host.init).not.toHaveBeenCalled();
});
