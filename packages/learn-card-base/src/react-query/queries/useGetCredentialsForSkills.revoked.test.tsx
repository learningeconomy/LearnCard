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
// The network credential COPIED was read from, recorded as the index record's networkUri.
const COPIED_FROM = 'lc:network:network.learncard.com/trpc:credential:copied-from';
const NO_SKILLS = 'lc:cloud:cloud.learncard.com/trpc:custom:no-skills';

const statusEntry = { type: 'BitstringStatusListEntry', statusPurpose: 'revocation' };
const skillVc = (id: string, withStatusList = true, withSkills = true): VC =>
    ({
        id,
        type: ['VerifiableCredential'],
        issuanceDate: '2026-10-31',
        ...(withStatusList ? { credentialStatus: statusEntry } : {}),
        credentialSubject: {
            id: 'did:example:learner',
            achievement: withSkills
                ? { alignment: [{ targetUrl: `https://skills.example/${id}` }] }
                : {},
        },
    }) as unknown as VC;

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

type WalletOptions = {
    uris?: string[];
    noStatusList?: string[];
    noSkills?: string[];
    // Index record networkUri per URI (LearnCloud copies of network credentials).
    networkUris?: Record<string, string>;
    // Resolve failures: URIs whose read throws.
    unreadable?: () => string[];
    // Backend lifecycle statuses; URIs left out mimic "holder did not receive this on-network".
    lifecycle?: (options: { uris: string[] }) => Promise<Record<string, Status>>;
    // Client status-list check: which URIs have their revocation bit set.
    verify?: (vc: VC) => Promise<unknown>;
};

const makeWallet = ({
    uris = [VALID, REVOKED],
    noStatusList = [],
    noSkills = [],
    networkUris = {},
    unreadable = () => [],
    lifecycle = async () => Object.fromEntries(uris.map(uri => [uri, 'active' as Status])),
    verify = async () => ({ checks: [], warnings: [], errors: [], status: [] }),
}: WalletOptions = {}) => {
    const read = vi.fn(async (uri: string) => {
        if (unreadable().includes(uri)) throw new Error('read failed');
        return skillVc(uri, !noStatusList.includes(uri), !noSkills.includes(uri));
    });
    const get = vi.fn(async ({ category }: { category: string }) =>
        category === CredentialCategoryEnum.achievement
            ? uris.map(uri => ({
                  uri,
                  ...(networkUris[uri] ? { networkUri: networkUris[uri] } : {}),
              }))
            : []
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

// Simulate per-credential caches expiring (resolved VCs, status-list results) without
// tearing down the skills query itself.
const expireCaches = () =>
    client.removeQueries({ predicate: query => query.queryKey[0] !== 'useGetSkills' });

// What the Boost verifier returns when its inner verification throws: fulfilled, but with
// an error it does not classify as revoked or suspended.
const boostVerifierFailure = {
    checks: [],
    warnings: [],
    errors: ['Boost authenticity could not be verified.'],
    status: [],
};

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

    it('keeps a known network revocation with no status list when the backend later fails', async () => {
        let fail = false;
        makeWallet({
            noStatusList: [VALID, REVOKED],
            lifecycle: async () => {
                if (fail) throw new Error('network down');
                return { [VALID]: 'active', [REVOKED]: 'revoked' };
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
            ([options]) => options.uris.length
        );
        expect(batchSizes.sort()).toEqual([100, 50]);
        expect(verifyCredential).not.toHaveBeenCalled();
        expect(result.current.data).toHaveLength(150);
    });
    describe('LearnCloud copies of network credentials (goblincore P1)', () => {
        it('drops a copy whose network credential was revoked on the graph only', async () => {
            const { getMyCredentialLifecycleStatuses, verifyCredential } = makeWallet({
                uris: [VALID, COPIED],
                // No status list: the revocation exists only on the network credential's edge.
                noStatusList: [COPIED],
                networkUris: { [COPIED]: COPIED_FROM },
                lifecycle: async () => ({ [VALID]: 'active', [COPIED_FROM]: 'revoked' }),
            });
            const { result } = renderSkills();

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(resolvedIds(result.current.data)).toEqual([VALID]);
            const asked = getMyCredentialLifecycleStatuses.mock.calls.flatMap(([o]) => o.uris);
            expect(asked).toContain(COPIED_FROM);
            expect(asked).not.toContain(COPIED);
            expect(verifyCredential).not.toHaveBeenCalled();
        });

        it('keeps a copy whose network credential is active', async () => {
            makeWallet({
                uris: [VALID, COPIED],
                noStatusList: [COPIED],
                networkUris: { [COPIED]: COPIED_FROM },
                lifecycle: async () => ({ [VALID]: 'active', [COPIED_FROM]: 'active' }),
            });
            const { result } = renderSkills();

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(resolvedIds(result.current.data)).toEqual([COPIED, VALID].sort());
        });
    });

    describe('indeterminate verification results (goblincore P2)', () => {
        it('keeps a known revocation when the verifier later returns an unrecognized error', async () => {
            let verifierBroken = false;
            makeWallet({
                uris: [VALID, COPIED],
                lifecycle: async () => ({ [VALID]: 'active' }),
                verify: async vc =>
                    verifierBroken ? boostVerifierFailure : revokedBit([COPIED])(vc),
            });
            const { result } = renderSkills();
            await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));

            verifierBroken = true;
            expireCaches();
            const refetched = await result.current.refetch();

            expect(refetched.isSuccess).toBe(true);
            expect(resolvedIds(refetched.data)).toEqual([VALID]);
        });

        it('still counts a credential never seen revoked when its check errors', async () => {
            makeWallet({
                uris: [VALID, COPIED],
                lifecycle: async () => ({ [VALID]: 'active' }),
                verify: async () => boostVerifierFailure,
            });
            const { result } = renderSkills();

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(resolvedIds(result.current.data)).toEqual([COPIED, VALID].sort());
        });
    });

    describe('credentials that fail to resolve (goblincore P2)', () => {
        it('remembers a revocation through a failed resolve and a later recovery', async () => {
            let unreadable: string[] = [];
            let backendDown = false;
            makeWallet({
                unreadable: () => unreadable,
                lifecycle: async () => {
                    if (backendDown) throw new Error('network down');
                    return { [VALID]: 'active', [REVOKED]: 'revoked' };
                },
                verify: async () => {
                    throw new Error('status list unreachable');
                },
            });
            const { result } = renderSkills();
            await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));

            // Cache expires and REVOKED fails to resolve, while status lookups are down.
            unreadable = [REVOKED];
            backendDown = true;
            expireCaches();
            const whileUnreadable = await result.current.refetch();
            expect(resolvedIds(whileUnreadable.data)).toEqual([VALID]);

            // Resolution recovers, status lookups are still down: the skill must not return.
            unreadable = [];
            expireCaches();
            const recovered = await result.current.refetch();

            expect(recovered.isSuccess).toBe(true);
            expect(resolvedIds(recovered.data)).toEqual([VALID]);
        });
    });

    describe('status checks are limited and cached (goblincore P2)', () => {
        it('does not check credentials that carry no skills', async () => {
            const { getMyCredentialLifecycleStatuses, verifyCredential } = makeWallet({
                uris: [VALID, NO_SKILLS],
                noSkills: [NO_SKILLS],
                lifecycle: async () => ({ [VALID]: 'active' }),
            });
            const { result } = renderSkills();

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            const asked = getMyCredentialLifecycleStatuses.mock.calls.flatMap(([o]) => o.uris);
            expect(asked).toEqual([VALID]);
            expect(verifyCredential).not.toHaveBeenCalled();
            // Still returned: it adds nothing to the skills aggregate either way.
            expect(resolvedIds(result.current.data)).toEqual([NO_SKILLS, VALID].sort());
        });

        it('reuses a fresh status-list result on refetch instead of re-verifying', async () => {
            const { verifyCredential } = makeWallet({
                uris: [VALID, COPIED],
                lifecycle: async () => ({ [VALID]: 'active' }),
                verify: revokedBit([COPIED]),
            });
            const { result } = renderSkills();
            await waitFor(() => expect(resolvedIds(result.current.data)).toEqual([VALID]));
            expect(verifyCredential).toHaveBeenCalledTimes(1);

            const refetched = await result.current.refetch();

            expect(resolvedIds(refetched.data)).toEqual([VALID]);
            expect(verifyCredential).toHaveBeenCalledTimes(1);
        });

        it('re-verifies after a lifecycle change invalidates credentialStatus', async () => {
            let revoked: string[] = [];
            const { verifyCredential } = makeWallet({
                uris: [VALID, COPIED],
                lifecycle: async () => ({ [VALID]: 'active' }),
                verify: async vc => revokedBit(revoked)(vc),
            });
            const { result } = renderSkills();
            await waitFor(() => expect(result.current.data).toHaveLength(2));

            revoked = [COPIED];
            await client.invalidateQueries({ queryKey: ['credentialStatus'] });
            const refetched = await result.current.refetch();

            expect(resolvedIds(refetched.data)).toEqual([VALID]);
            expect(verifyCredential).toHaveBeenCalledTimes(2);
        });
    });
});
