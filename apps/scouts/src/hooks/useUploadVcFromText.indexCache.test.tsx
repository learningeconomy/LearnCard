// @vitest-environment happy-dom

/**
 * goblincore r4575035411: a raw import writes the index directly and refreshes the
 * index-backed aggregates in the background. The import resolves once the index write lands,
 * even while the skills refetch is still in flight or fails.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    add: vi.fn(),
    upload: vi.fn(),
}));
vi.mock('learn-card-base', async () => {
    const cache = await import('learn-card-base/react-query/queries/credentialIndexCache');
    return {
        useWallet: () => ({
            initWallet: async () => ({
                store: { LearnCloud: { uploadEncrypted: host.upload } },
                index: { LearnCloud: { add: host.add } },
            }),
        }),
        switchedProfileStore: { get: { switchedDid: () => undefined } },
        invalidateCredentialIndexQueries: cache.invalidateCredentialIndexQueries,
    };
});
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Skill',
}));

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

// RTL 11 has no renderHook; capture the hook from a probe component.
const mountHook = () => {
    let hook: ReturnType<typeof useUploadVcFromText> | undefined;
    const Probe = () => {
        hook = useUploadVcFromText();
        return null;
    };
    render(
        <QueryClientProvider client={client}>
            <Probe />
        </QueryClientProvider>
    );
    return hook!;
};

const observeSkills = async (refetch: () => Promise<unknown>) => {
    const queryFn = vi.fn().mockResolvedValueOnce([]).mockImplementation(refetch);
    const observer = new QueryObserver(client, {
        queryKey: ['useGetSkills', ''],
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
    host.upload.mockResolvedValue('lc:cloud:uploaded');
    host.add.mockImplementation(async (record: object) => record);
});

afterEach(() => {
    cleanup();
    client.clear();
});

it.each([
    ['never settles', () => new Promise<never>(() => undefined)],
    ['fails', () => Promise.reject(new Error('skills walk failed'))],
])('resolves a raw import while the skills refetch %s', async (_l, refetch) => {
    const skills = await observeSkills(refetch);
    const hook = mountHook();

    const outcome = await hook.uploadVcFromText(JSON.stringify(credential));

    expect(outcome?.success).toBe(true);
    expect(host.add).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});
