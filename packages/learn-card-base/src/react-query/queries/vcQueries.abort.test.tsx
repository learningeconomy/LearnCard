// @vitest-environment happy-dom
import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

const logs = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ error: logs.error, warn: logs.warn, info: vi.fn(), debug: vi.fn() }),
}));
const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
    },
    CredentialCategoryEnum: (await import('../../types/boostAndCredentialMetadata'))
        .CredentialCategoryEnum,
    categoryMetadata: (await import('../../types/boostAndCredentialMetadata')).categoryMetadata,
    newCredsStore: {},
    credentialWithEditsHelper: (vc: VC) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
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

import { useGetCredentialCount, useGetCredentialList } from './vcQueries';

const CATEGORY = 'Merit Badge';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

/** A wallet whose index read stays pending until the test settles it. */
const pendingWallet = () => {
    let settle!: { resolve: (value: unknown) => void; reject: (error: unknown) => void };
    const pending = () =>
        new Promise((resolve, reject) => {
            settle = { resolve, reject };
        });
    const getPage = vi.fn(pending);
    const getCount = vi.fn(pending);
    host.wallet = {
        id: { did: () => 'did:example:reader' },
        index: { LearnCloud: { getPage, getCount } },
    } as unknown as BespokeLearnCard;
    return { getPage, getCount, settle: () => settle };
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

// React Query aborts a query's signal when its key changes or its last observer leaves.
// LEARN-CARD-APP-M6W/M6T/M70: those cancellations reached Sentry as errors.
const readers: Array<[string, () => { isError: boolean }, 'getPage' | 'getCount']> = [
    ['useGetCredentialList', () => useGetCredentialList(CATEGORY), 'getPage'],
    ['useGetCredentialCount', () => useGetCredentialCount(CATEGORY), 'getCount'],
];
describe.each(readers)('%s', (_, useHook, read) => {
    it('does not report a cancelled read as an error', async () => {
        const wallet = pendingWallet();
        const { unmount } = renderHook(useHook, { wrapper });
        await waitFor(() => expect(wallet[read]).toHaveBeenCalledOnce());
        unmount();
        wallet.settle().resolve(read === 'getPage' ? { records: [], hasMore: false } : 3);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(logs.error).not.toHaveBeenCalled();
    });

    it('still reports a read that fails while the query is active', async () => {
        const wallet = pendingWallet();
        const { result } = renderHook(useHook, { wrapper });
        await waitFor(() => expect(wallet[read]).toHaveBeenCalledOnce());
        const failure = new Error('LearnCloud unavailable');
        wallet.settle().reject(failure);
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(logs.error).toHaveBeenCalledWith(failure);
    });
});
