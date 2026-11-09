// @vitest-environment happy-dom
/**
 * LC-2383: credential-index queries must stay fresh across route remounts.
 * Measured via LearnCloud.get / getPage call counts (instrumented unit), not a live HAR.
 */
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
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
    categoryMetadata: (await import('../../types/boostAndCredentialMetadata')).categoryMetadata,
    newCredsStore: {},
    credentialWithEditsHelper: (vc: VC) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: { get: { switchedDid: () => host.switchedDid } },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getIssuanceDate: (vc: VC) => vc.issuanceDate,
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({
    getCategoryForCredential: vi.fn(),
    default: () => ({ initWallet: host.init }),
}));
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
vi.mock('learn-card-base/helpers/backfills', () => ({ useBackfillBoostUris: () => vi.fn() }));
vi.mock('learn-card-base/helpers/credentialLifecycleStatus', () => ({
    getCredentialLifecycleStatuses: vi.fn(async () => new Map()),
}));

import {
    CREDENTIAL_INDEX_STALE_TIME,
    useCountBoosts,
    useGetCredentialCount,
    useGetCredentials,
    useGetCredentialsForSkills,
    useTotalBoostCounts,
} from './vcQueries';

const CATEGORY = 'Achievement';
const LIST_KEY = ['useGetCredentialList', '', CATEGORY, 'did:example:reader'];
const COUNT_KEY = ['useGetCredentialCount', '', CATEGORY, 'did:example:reader'];
const SKILLS_KEY = ['useGetSkills', ''];
const CREDS_KEY = ['useGetCredentials', undefined, CATEGORY, undefined];

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const makeWallet = (did = 'did:example:reader') => {
    const getPage = vi
        .fn()
        .mockResolvedValue({ records: [{ uri: 'uri-1' }], hasMore: false, cursor: undefined });
    const get = vi.fn().mockResolvedValue([{ uri: 'uri-1' }]);
    const getCount = vi.fn().mockResolvedValue(3);
    const read = vi.fn().mockResolvedValue({
        type: ['VerifiableCredential'],
        issuanceDate: '2026-01-01',
        credentialSubject: { id: 'subject' },
    } as VC);
    const countBoosts = vi.fn().mockResolvedValue(4);
    host.wallet = {
        id: { did: () => did },
        index: { LearnCloud: { getPage, get, getCount } },
        invoke: { countBoosts },
        read,
    } as unknown as BespokeLearnCard;
    return { getPage, get, getCount, read, countBoosts };
};

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

describe('CREDENTIAL_INDEX_STALE_TIME (LC-2383)', () => {
    it('is five minutes', () => {
        expect(CREDENTIAL_INDEX_STALE_TIME).toBe(5 * 60 * 1000);
    });

    it('reuses useGetCredentialCount across remounts without a second getCount', async () => {
        const { getCount } = makeWallet();
        const first = renderHook(() => useGetCredentialCount(CATEGORY), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        expect(getCount).toHaveBeenCalledTimes(1);
        first.unmount();

        const second = renderHook(() => useGetCredentialCount(CATEGORY), { wrapper });
        await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
        expect(getCount).toHaveBeenCalledTimes(1);
        expect(second.result.current.data).toBe(3);
    });

    it('reuses useGetCredentialsForSkills across remounts (no second nine-category walk)', async () => {
        const { get } = makeWallet();
        const first = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        const firstCalls = get.mock.calls.length;
        expect(firstCalls).toBe(9); // one LearnCloud.get per skills category
        first.unmount();

        const second = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
        expect(get).toHaveBeenCalledTimes(firstCalls);
    });

    it('reuses useGetCredentials across remounts without a second index.get', async () => {
        const { get } = makeWallet();
        const first = renderHook(() => useGetCredentials(CATEGORY), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        expect(get).toHaveBeenCalledTimes(1);
        first.unmount();

        const second = renderHook(() => useGetCredentials(CATEGORY), { wrapper });
        await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('refetches useGetSkills after invalidateQueries', async () => {
        const { get } = makeWallet();
        const first = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        const firstCalls = get.mock.calls.length;

        await act(async () => {
            await client.invalidateQueries({ queryKey: SKILLS_KEY });
        });
        await waitFor(() => expect(get.mock.calls.length).toBe(firstCalls * 2));
    });

    it('does not apply index staleTime to useCountBoosts (network countBoosts, no invalidation)', async () => {
        const { countBoosts } = makeWallet();
        const first = renderHook(() => useCountBoosts(CATEGORY), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        expect(countBoosts).toHaveBeenCalledTimes(1);
        first.unmount();

        const second = renderHook(() => useCountBoosts(CATEGORY), { wrapper });
        await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
        // Default staleTime 0 → remount refetches. Index staleTime would keep this at 1.
        expect(countBoosts).toHaveBeenCalledTimes(2);
        expect(second.result.current.data).toBe(4);
    });

    it('does not apply index staleTime to useTotalBoostCounts', async () => {
        const { countBoosts } = makeWallet();
        const first = renderHook(() => useTotalBoostCounts(), { wrapper });
        await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
        const firstCalls = countBoosts.mock.calls.length;
        expect(firstCalls).toBe(7); // one per category in the hook
        first.unmount();

        const second = renderHook(() => useTotalBoostCounts(), { wrapper });
        await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
        expect(countBoosts.mock.calls.length).toBe(firstCalls * 2);
    });
});

// Touch keys so a rename would fail the suite loudly.
describe('LC-2383 query keys stay stable', () => {
    it('keeps list/count/skills key roots', () => {
        expect(LIST_KEY[0]).toBe('useGetCredentialList');
        expect(COUNT_KEY[0]).toBe('useGetCredentialCount');
        expect(SKILLS_KEY[0]).toBe('useGetSkills');
        expect(CREDS_KEY[0]).toBe('useGetCredentials');
    });
});
