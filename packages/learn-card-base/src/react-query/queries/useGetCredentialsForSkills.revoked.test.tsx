// @vitest-environment happy-dom
// LC-2325 MapCountsOnlyValid: a credential that counts toward the skills map must not be revoked.
import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    CredentialCategoryEnum: (await import('../../types/boostAndCredentialMetadata'))
        .CredentialCategoryEnum,
    categoryMetadata: (await import('../../types/boostAndCredentialMetadata')).categoryMetadata,
    newCredsStore: {},
    credentialWithEditsHelper: (vc: VC) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: { get: { switchedDid: () => undefined } },
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
vi.mock('learn-card-base/helpers/backfills', () => ({ useBackfillBoostUris: vi.fn() }));

import { useGetCredentialsForSkills } from './vcQueries';
import { CredentialCategoryEnum } from '../../types/boostAndCredentialMetadata';

const VALID = 'lc:network:network.learncard.com/trpc:credential:valid';
const REVOKED = 'lc:network:network.learncard.com/trpc:credential:revoked';

const skillVc = (id: string): VC =>
    ({
        id,
        type: ['VerifiableCredential'],
        issuanceDate: '2026-10-31',
        credentialSubject: {
            id: 'did:example:learner',
            achievement: { alignment: [{ targetUrl: `https://skills.example/${id}` }] },
        },
    }) as unknown as VC;

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const makeWallet = (getRevokedCredentials?: () => Promise<string[]>) => {
    const read = vi.fn(async (uri: string) => skillVc(uri));
    const get = vi.fn(async ({ category }: { category: string }) =>
        category === CredentialCategoryEnum.achievement ? [{ uri: VALID }, { uri: REVOKED }] : []
    );
    host.wallet = {
        id: { did: () => 'did:example:learner' },
        read: { get: read },
        index: { LearnCloud: { get } },
        invoke: getRevokedCredentials ? { getRevokedCredentials } : {},
    } as unknown as BespokeLearnCard;
    return { read, get };
};

const resolvedIds = (data: unknown) => (data as VC[]).map(vc => vc.id);

beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
});

describe('useGetCredentialsForSkills (LC-2325 MapCountsOnlyValid)', () => {
    it('drops revoked credentials and still counts valid ones', async () => {
        const { read } = makeWallet(async () => [REVOKED]);
        const { result } = renderHook(() => useGetCredentialsForSkills(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([VALID]);
        // Revoked records are skipped before resolution, so they cost no fetch either.
        expect(read).not.toHaveBeenCalledWith(REVOKED);
    });

    it('counts every credential when nothing is revoked', async () => {
        makeWallet(async () => []);
        const { result } = renderHook(() => useGetCredentialsForSkills(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data).sort()).toEqual([REVOKED, VALID].sort());
    });

    it('drops a credential revoked after the map was first built, on refetch', async () => {
        let revoked: string[] = [];
        makeWallet(async () => revoked);
        const { result } = renderHook(() => useGetCredentialsForSkills(), { wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(2));

        revoked = [REVOKED];
        await result.current.refetch();

        await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));
    });

    it('fails open when revocation status cannot be loaded', async () => {
        makeWallet(async () => {
            throw new Error('network down');
        });
        const { result } = renderHook(() => useGetCredentialsForSkills(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
    });
});
