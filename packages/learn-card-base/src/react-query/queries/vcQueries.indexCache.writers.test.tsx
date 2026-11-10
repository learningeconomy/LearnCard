// @vitest-environment happy-dom
/**
 * LC-2383: writers must invalidate the sticky index keys so mounted readers refetch.
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
    switchedProfileStore: {
        get: { switchedDid: () => host.switchedDid },
        use: { switchedDid: () => host.switchedDid },
    },
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
vi.mock('../mutations/syncAllCredentials', () => ({
    useSyncAllCredentialsToContractsMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../mutations/ai-passport', () => ({ queueAiInsightCredentialRefresh: vi.fn() }));
vi.mock('../mutations/pruneConsentFlowDeletedCredentials', () => ({
    deleteCredentialFromAllContracts: vi.fn().mockResolvedValue({
        contractsUpdated: 0,
        removedSharedUris: 0,
    }),
}));
vi.mock('../../hooks/useToast', () => ({
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: vi.fn() }),
}));
vi.mock('../queries/queries', () => ({ invalidateBoostRecipientQueries: vi.fn() }));
vi.mock('../connectionPrompts', () => ({ connectionPromptKeys: {} }));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

import { useGetCredentials, useGetCredentialsForSkills } from './vcQueries';
import { useDeleteCredentialRecord } from '../mutations/mutations';

const CATEGORY = 'Achievement';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const categoryGets = (get: { mock: { calls: unknown[][] } }) =>
    get.mock.calls.filter(call => {
        const query = call[0] as { category?: string } | undefined;
        return query?.category === CATEGORY;
    }).length;

const makeWallet = (did = 'did:example:reader') => {
    const getPage = vi
        .fn()
        .mockResolvedValue({ records: [{ uri: 'uri-1' }], hasMore: false, cursor: undefined });
    const get = vi.fn().mockResolvedValue([{ uri: 'uri-1', id: 'r1', category: CATEGORY }]);
    const getCount = vi.fn().mockResolvedValue(3);
    const remove = vi.fn().mockResolvedValue(undefined);
    const flushIndex = vi.fn().mockResolvedValue(undefined);
    const read = vi.fn().mockResolvedValue({
        type: ['VerifiableCredential'],
        issuanceDate: '2026-01-01',
        credentialSubject: { id: 'subject' },
    } as VC);
    host.wallet = {
        id: { did: () => did },
        cache: { flushIndex },
        index: { LearnCloud: { getPage, get, getCount, remove } },
        invoke: { countBoosts: vi.fn() },
        read,
    } as unknown as BespokeLearnCard;
    return { getPage, get, getCount, read, remove, flushIndex };
};

beforeEach(() => {
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.wallet = null;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
});

describe('credential index writers (LC-2383)', () => {
    it('refetches primary-profile useGetCredentials after delete (undefined vs empty did)', async () => {
        const { get } = makeWallet();
        const mounted = renderHook(() => useGetCredentials(CATEGORY), { wrapper });
        await waitFor(() => expect(mounted.result.current.isSuccess).toBe(true));
        expect(categoryGets(get)).toBe(1);

        const deleter = renderHook(() => useDeleteCredentialRecord(), { wrapper });
        await act(async () => {
            await deleter.result.current.mutateAsync({
                id: 'r1',
                uri: 'uri-1',
                category: CATEGORY,
            } as never);
        });

        await waitFor(() => expect(categoryGets(get)).toBeGreaterThanOrEqual(2));
    });

    it('refetches useGetCredentialsForSkills after delete', async () => {
        const { get } = makeWallet();
        const mounted = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(mounted.result.current.isSuccess).toBe(true));
        const firstCalls = get.mock.calls.length;
        expect(firstCalls).toBe(9);

        const deleter = renderHook(() => useDeleteCredentialRecord(), { wrapper });
        await act(async () => {
            await deleter.result.current.mutateAsync({
                id: 'r1',
                uri: 'uri-1',
                category: CATEGORY,
            } as never);
        });

        await waitFor(() =>
            expect(get.mock.calls.length).toBeGreaterThanOrEqual(firstCalls * 2 + 1)
        );
    });
});
