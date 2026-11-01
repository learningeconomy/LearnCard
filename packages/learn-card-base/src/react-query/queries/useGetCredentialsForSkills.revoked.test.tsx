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

type Status = 'active' | 'revoked' | 'suspended';

const VALID = 'lc:network:network.learncard.com/trpc:credential:valid';
const REVOKED = 'lc:network:network.learncard.com/trpc:credential:revoked';
// A LearnCloud copy (inbox claim-and-save re-uploads under a new URI): the network has no
// CREDENTIAL_SENT edge for it, so the backend omits it and only the status list knows.
const COPIED = 'lc:cloud:cloud.learncard.com/trpc:custom:copied';
// An imported credential from an outside issuer: no edge either, only its status list.
const IMPORTED = 'lc:cloud:cloud.learncard.com/trpc:custom:imported';
const SELF_ASSIGNED = 'lc:cloud:cloud.learncard.com/trpc:custom:self-assigned';

const statusEntry = { type: 'BitstringStatusListEntry', statusPurpose: 'revocation' };
const skillVc = (id: string, withStatusList = true): VC =>
    ({
        id,
        type: ['VerifiableCredential'],
        issuanceDate: '2026-10-31',
        ...(withStatusList ? { credentialStatus: statusEntry } : {}),
        credentialSubject: {
            id: 'did:example:learner',
            achievement: { alignment: [{ targetUrl: `https://skills.example/${id}` }] },
        },
    }) as unknown as VC;

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

type WalletOptions = {
    uris?: string[];
    noStatusList?: string[];
    // Backend lifecycle statuses; URIs left out mimic "holder did not receive this on-network".
    lifecycle?: () => Promise<Record<string, Status>>;
    // Client status-list check: which URIs have their revocation bit set.
    verify?: (vc: VC) => Promise<unknown>;
};

const makeWallet = ({
    uris = [VALID, REVOKED],
    noStatusList = [],
    lifecycle = async () => Object.fromEntries(uris.map(uri => [uri, 'active' as Status])),
    verify = async () => ({ checks: [], warnings: [], errors: [], status: [] }),
}: WalletOptions = {}) => {
    const read = vi.fn(async (uri: string) => skillVc(uri, !noStatusList.includes(uri)));
    const get = vi.fn(async ({ category }: { category: string }) =>
        category === CredentialCategoryEnum.achievement ? uris.map(uri => ({ uri })) : []
    );
    const getMyCredentialLifecycleStatuses = vi.fn(lifecycle);
    const verifyCredential = vi.fn(verify);
    host.wallet = {
        id: { did: () => 'did:example:learner' },
        read: { get: read },
        index: { LearnCloud: { get } },
        invoke: { getMyCredentialLifecycleStatuses, verifyCredential },
    } as unknown as BespokeLearnCard;
    return { read, get, getMyCredentialLifecycleStatuses, verifyCredential };
};

const revokedBit = (revokedIds: string[]) => async (vc: VC) => ({
    checks: [],
    warnings: [],
    errors: [],
    status: [{ ...statusEntry, isSet: revokedIds.includes(vc.id as string) }],
});

const resolvedIds = (data: unknown) => (data as VC[]).map(vc => vc.id).sort();

const renderSkills = () => renderHook(() => useGetCredentialsForSkills(), { wrapper });

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
    it('drops a credential the network reports revoked and keeps valid ones', async () => {
        const { verifyCredential } = makeWallet({
            lifecycle: async () => ({ [VALID]: 'active', [REVOKED]: 'revoked' }),
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([VALID]);
        // The backend answered every URI, so no client status-list check runs.
        expect(verifyCredential).not.toHaveBeenCalled();
    });

    it('counts every credential when nothing is revoked', async () => {
        makeWallet();
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([REVOKED, VALID].sort());
    });

    it('drops a credential revoked after the map was first built, on refetch', async () => {
        let statuses: Record<string, Status> = { [VALID]: 'active', [REVOKED]: 'active' };
        makeWallet({ lifecycle: async () => statuses });
        const { result } = renderSkills();
        await waitFor(() => expect(result.current.data).toHaveLength(2));

        statuses = { [VALID]: 'active', [REVOKED]: 'revoked' };
        await result.current.refetch();

        await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));
    });

    it('drops a revoked LearnCloud copy the network does not know, via its status list', async () => {
        const { verifyCredential } = makeWallet({
            uris: [VALID, COPIED],
            lifecycle: async () => ({ [VALID]: 'active' }),
            verify: revokedBit([COPIED]),
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([VALID]);
        expect(verifyCredential).toHaveBeenCalledTimes(1);
        expect(verifyCredential.mock.calls[0][0].id).toBe(COPIED);
    });

    it('drops a revoked imported credential with no network edge', async () => {
        makeWallet({
            uris: [VALID, IMPORTED],
            lifecycle: async () => ({ [VALID]: 'active' }),
            // Older WASM builds only report revocation in `errors`.
            verify: async vc => ({
                checks: [],
                warnings: [],
                errors: vc.id === IMPORTED ? ['Credential is revoked'] : [],
            }),
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([VALID]);
    });

    it('skips the status-list check for credentials that have no status list', async () => {
        const { verifyCredential } = makeWallet({
            uris: [VALID, SELF_ASSIGNED],
            noStatusList: [SELF_ASSIGNED],
            lifecycle: async () => ({ [VALID]: 'active' }),
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(resolvedIds(result.current.data)).toEqual([SELF_ASSIGNED, VALID].sort());
        expect(verifyCredential).not.toHaveBeenCalled();
    });

    it('keeps a known revocation when a later lookup fails', async () => {
        let fail = false;
        makeWallet({
            uris: [VALID, REVOKED, COPIED],
            lifecycle: async () => {
                if (fail) throw new Error('network down');
                return { [VALID]: 'active', [REVOKED]: 'revoked' };
            },
            verify: async vc => {
                if (fail) throw new Error('status list unreachable');
                return revokedBit([COPIED])(vc);
            },
        });
        const { result } = renderSkills();
        await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));

        fail = true;
        const refetched = await result.current.refetch();

        expect(refetched.isSuccess).toBe(true);
        expect(resolvedIds(refetched.data)).toEqual([VALID]);
    });

    it('counts a credential it has never seen revoked when its status cannot be loaded', async () => {
        makeWallet({
            lifecycle: async () => {
                throw new Error('network down');
            },
            verify: async () => {
                throw new Error('status list unreachable');
            },
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(2);
    });

    it('asks the backend in batches of at most 100 URIs', async () => {
        const many = Array.from({ length: 150 }, (_, i) => `${VALID}-${i}`);
        const { getMyCredentialLifecycleStatuses, verifyCredential } = makeWallet({
            uris: many,
            lifecycle: async () => Object.fromEntries(many.map(uri => [uri, 'active' as Status])),
        });
        const { result } = renderSkills();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const batchSizes = getMyCredentialLifecycleStatuses.mock.calls.map(
            ([options]) => (options as unknown as { uris: string[] }).uris.length
        );
        expect(batchSizes.sort()).toEqual([100, 50]);
        expect(verifyCredential).not.toHaveBeenCalled();
        expect(result.current.data).toHaveLength(150);
    });
});
