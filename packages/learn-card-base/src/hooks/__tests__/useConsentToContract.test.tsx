// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getContract: vi.fn(),
    consent: vi.fn(),
    review: vi.fn(),
    materialize: vi.fn(),
    did: 'did:example:holder',
}));
vi.mock('learn-card-base', () => ({
    switchedProfileStore: { get: { switchedDid: () => 'learner' } },
    useWallet: () => ({
        initWallet: async () => ({
            id: { did: () => mocks.did },
            invoke: {
                getContract: mocks.getContract,
                consentToContract: mocks.consent,
            },
        }),
    }),
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({}),
    useMutation: (options: { mutationFn: (input: unknown) => Promise<unknown> }) => ({
        ...options,
        mutateAsync: options.mutationFn,
    }),
}));
vi.mock('../useConsentAudienceReview', () => ({ useConsentAudienceReview: () => mocks.review }));
vi.mock('../useSharedUrisInTerms', () => ({ getTermsWithSharedUrisForWallet: mocks.materialize }));
import { useConsentToContract } from '../useConsentToContract';

type ConsentSubmission = Parameters<ReturnType<typeof useConsentToContract>['mutate']>[0];
type MutationHarness = { mutationFn: (submission: ConsentSubmission) => Promise<unknown> };

const contract = {
    owner: { did: 'did:key:current-owner' },
    recipients: [{ did: 'did:key:current-partner' }],
    audienceVersion: 3,
};
const selection: ConsentSubmission = {
    terms: {
        write: { personal: {}, credentials: { categories: {} } },
        read: {
            personal: {},
            credentials: {
                categories: {
                    Achievement: { sharing: true, shared: ['urn:original'] },
                },
            },
        },
    },
};

describe('interactive consent audience boundary', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.did = 'did:example:holder';
        mocks.getContract.mockResolvedValue(contract);
        mocks.materialize.mockResolvedValue(selection);
        mocks.consent.mockResolvedValue({ termsUri: 'urn:terms' });
    });
    afterEach(cleanup);

    it('reviews fresh metadata before encryption and acknowledges that exact version', async () => {
        let confirm!: () => void;
        mocks.review.mockImplementation(
            () =>
                new Promise<void>(resolve => {
                    confirm = resolve;
                })
        );
        const hook = renderHook(() => useConsentToContract('urn:contract', 'did:key:old-owner'));
        const pending = (hook.result.current as unknown as MutationHarness).mutationFn(selection);
        await vi.waitFor(() => expect(mocks.review).toHaveBeenCalledWith(contract));
        expect(mocks.materialize).not.toHaveBeenCalled();
        expect(mocks.consent).not.toHaveBeenCalled();
        confirm();
        await pending;
        expect(mocks.getContract).toHaveBeenCalledWith('urn:contract');
        expect(mocks.materialize.mock.calls[0]![1]).toEqual([
            'did:key:current-owner',
            'did:key:current-partner',
        ]);
        expect(mocks.consent).toHaveBeenCalledWith(
            'urn:contract',
            { ...selection, audienceVersion: 3 },
            undefined
        );
    });

    it('cannot skip encryption of selected URIs with the background materialization option', async () => {
        const hook = renderHook(() => useConsentToContract('urn:contract', 'did:key:old-owner'));
        await (hook.result.current as unknown as MutationHarness).mutationFn({
            ...selection,
            skipSharedUriMaterialization: true,
        });
        expect(mocks.materialize).toHaveBeenCalledOnce();
    });

    it('runs guardian approval after encryption immediately before consent', async () => {
        const order: string[] = [];
        mocks.materialize.mockImplementation(async () => {
            order.push('encrypt');
            return selection;
        });
        mocks.consent.mockImplementation(async () => {
            order.push('consent');
            return {};
        });
        const beforeSubmit = vi.fn(async () => {
            order.push('approve');
        });
        const hook = renderHook(() => useConsentToContract('urn:contract', 'did:key:old-owner'));
        await (hook.result.current as unknown as MutationHarness).mutationFn({
            ...selection,
            beforeSubmit,
        });
        expect(order).toEqual(['encrypt', 'approve', 'consent']);
        expect(mocks.materialize.mock.calls[0]![3]).toEqual(selection);
        expect(mocks.consent.mock.calls[0]![1]).not.toHaveProperty('beforeSubmit');
    });

    it('does not submit consent when guardian approval fails', async () => {
        const beforeSubmit = vi.fn().mockRejectedValue(new Error('Approval declined'));
        const hook = renderHook(() => useConsentToContract('urn:contract', 'did:key:old-owner'));
        await expect(
            (hook.result.current as unknown as MutationHarness).mutationFn({
                ...selection,
                beforeSubmit,
            })
        ).rejects.toThrow('Approval declined');
        expect(mocks.consent).not.toHaveBeenCalled();
    });

    it('does not retry consent automatically when the audience changes during encryption', async () => {
        mocks.consent.mockRejectedValue(new Error('Audience conflict'));
        const hook = renderHook(() => useConsentToContract('urn:contract', 'did:key:old-owner'));
        await expect(
            (hook.result.current as unknown as MutationHarness).mutationFn(selection)
        ).rejects.toThrow('Audience conflict');
        expect(mocks.consent).toHaveBeenCalledOnce();
        expect(mocks.getContract).toHaveBeenCalledOnce();
    });
    it('retries the same prepared publication without another audience review or encryption', async () => {
        const prepared = {
            ...selection,
            expiresAt: '2027-01-01T00:00:00Z',
            oneTime: true,
            terms: {
                ...selection.terms,
                read: {
                    ...selection.terms.read,
                    personal: { name: 'Alex' },
                    credentials: {
                        categories: { Achievement: { shared: ['urn:encrypted'], sharing: true } },
                    },
                },
            },
        };
        mocks.materialize.mockResolvedValue(prepared);
        mocks.consent.mockRejectedValueOnce(
            Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } })
        );
        const hook = renderHook(() =>
            useConsentToContract('urn:contract', 'did:key:owner', 'recipient-token')
        );
        await expect(
            (hook.result.current as unknown as MutationHarness).mutationFn(selection)
        ).rejects.toThrow('Upload failed');
        await vi.waitFor(() => expect(hook.result.current.publicationRetryAvailable).toBe(true));
        const guard = vi.fn().mockResolvedValue(undefined);
        await hook.result.current.retrySmartResumePublication(guard);
        expect(mocks.consent.mock.calls[1]).toEqual(mocks.consent.mock.calls[0]);
        expect(mocks.consent.mock.calls[1]![1]).toEqual({ ...prepared, audienceVersion: 3 });
        expect(mocks.materialize).toHaveBeenCalledOnce();
        expect(mocks.review).toHaveBeenCalledOnce();
        expect(guard).toHaveBeenCalled();
        await vi.waitFor(() => expect(hook.result.current.publicationRetryAvailable).toBe(false));
    });
    it('does not replay a publication under a different holder', async () => {
        mocks.consent.mockRejectedValueOnce(
            Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } })
        );
        const hook = renderHook(() =>
            useConsentToContract('urn:contract', 'did:key:owner', 'token')
        );
        await expect(
            (hook.result.current as unknown as MutationHarness).mutationFn(selection)
        ).rejects.toThrow();
        mocks.did = 'did:example:other-holder';
        await expect(hook.result.current.retrySmartResumePublication()).rejects.toThrow(
            'unavailable'
        );
        expect(mocks.consent).toHaveBeenCalledOnce();
    });
    it('retains server fingerprint and audience validation on a retry conflict', async () => {
        mocks.consent.mockRejectedValueOnce(
            Object.assign(new Error('Upload failed'), { data: { code: 'BAD_GATEWAY' } })
        );
        const hook = renderHook(() =>
            useConsentToContract('urn:contract', 'did:key:owner', 'token')
        );
        await expect(
            (hook.result.current as unknown as MutationHarness).mutationFn(selection)
        ).rejects.toThrow();
        mocks.consent.mockRejectedValueOnce(
            Object.assign(new Error('Audience changed'), { data: { code: 'CONFLICT' } })
        );
        await expect(hook.result.current.retrySmartResumePublication()).rejects.toThrow(
            'Audience changed'
        );
        expect(mocks.consent.mock.calls[1]).toEqual(mocks.consent.mock.calls[0]);
        await vi.waitFor(() => expect(hook.result.current.publicationRetryAvailable).toBe(false));
    });
});
