/**
 * goblincore r4574770689: a raw credential import writes the index directly, so it must
 * refresh the skills aggregate for the active profile.
 * goblincore r4575035411: that refresh runs in the background; the import resolves once the
 * index write lands, even while the skills refetch is still in flight or fails.
 */
import React from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    switchedDid: undefined as string | undefined,
    add: vi.fn(),
    upload: vi.fn(),
}));
vi.mock('learn-card-base', async () => {
    const cache = await import('learn-card-base/react-query/queries/credentialIndexCache');
    const counts = await import('learn-card-base/react-query/visibleCredentialCountKeys');
    return {
        useWallet: () => ({
            initWallet: async () => ({
                id: { did: () => 'did:example:importer' },
                store: { LearnCloud: { uploadEncrypted: host.upload } },
                index: { LearnCloud: { add: host.add } },
            }),
        }),
        switchedProfileStore: { get: { switchedDid: () => host.switchedDid } },
        invalidateCredentialIndexQueries: cache.invalidateCredentialIndexQueries,
        invalidateVisibleCredentialCounts: counts.invalidateVisibleCredentialCounts,
        // Contract-sync handoff (LC-2371) is covered in useUploadVcFromText.test.
        enqueuePendingContractSyncSafely: async () => undefined,
    };
});
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Skill',
}));
vi.mock('@learncard/open-badge-v2-plugin', () => ({ openBadgeV2Plugin: vi.fn() }));

import { useUploadVcFromText } from './useUploadVcFromText';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        proofValue: 'z-test',
    },
};

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const observeSkills = async (
    profileDid: string,
    refetch: () => Promise<unknown> = () => Promise.resolve([])
) => {
    const queryFn = vi.fn().mockResolvedValueOnce([]).mockImplementation(refetch);
    const observer = new QueryObserver(client, {
        queryKey: ['useGetSkills', profileDid],
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    return { queryFn, unsubscribe };
};

beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.upload.mockResolvedValue('lc:cloud:uploaded');
    host.add.mockImplementation(async (record: object) => record);
});

afterEach(() => {
    cleanup();
    client.clear();
});

it.each([
    ['primary', undefined, ''],
    ['switched', 'did:web:child', 'did:web:child'],
])('refetches skills for the %s profile after a JSON import', async (_l, switchedDid, did) => {
    host.switchedDid = switchedDid;
    const skills = await observeSkills(did);
    const { result } = renderHook(() => useUploadVcFromText(), { wrapper });

    const outcome = await result.current.uploadVcFromText(JSON.stringify(credential));

    expect(outcome.errors).toEqual([]);
    expect(outcome.addedCount).toBe(1);
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});

it('refetches skills after uploadVcFromTextAndAddToWallet', async () => {
    const skills = await observeSkills('');
    const { result } = renderHook(() => useUploadVcFromText(), { wrapper });

    const outcome = await result.current.uploadVcFromTextAndAddToWallet(credential);

    expect(outcome?.success).toBe(true);
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});

it('leaves skills alone when nothing was imported', async () => {
    const skills = await observeSkills('');
    const { result } = renderHook(() => useUploadVcFromText(), { wrapper });

    const outcome = await result.current.uploadVcFromText('{"not":"a credential"}');

    expect(outcome.addedCount).toBe(0);
    expect(skills.queryFn).toHaveBeenCalledTimes(1);
    skills.unsubscribe();
});

const pendingForever = () => new Promise<never>(() => undefined);
const failingRefetch = () => Promise.reject(new Error('skills walk failed'));

it.each([
    ['never settles', pendingForever],
    ['fails', failingRefetch],
])('resolves a JSON import while the skills refetch %s', async (_l, refetch) => {
    const skills = await observeSkills('', refetch);
    const { result } = renderHook(() => useUploadVcFromText(), { wrapper });

    const outcome = await result.current.uploadVcFromText(JSON.stringify(credential));

    expect(outcome.errors).toEqual([]);
    expect(outcome.addedCount).toBe(1);
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});

it.each([
    ['never settles', pendingForever],
    ['fails', failingRefetch],
])('resolves uploadVcFromTextAndAddToWallet while the skills refetch %s', async (_l, refetch) => {
    const skills = await observeSkills('', refetch);
    const { result } = renderHook(() => useUploadVcFromText(), { wrapper });

    const outcome = await result.current.uploadVcFromTextAndAddToWallet(credential);

    expect(outcome?.success).toBe(true);
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});
