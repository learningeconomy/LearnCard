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
