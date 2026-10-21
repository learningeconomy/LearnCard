// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getContract: vi.fn(),
    getConsentedContracts: vi.fn(),
    update: vi.fn(),
    review: vi.fn(),
    materialize: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    switchedProfileStore: { get: { switchedDid: () => 'learner' } },
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                getContract: mocks.getContract,
                getConsentedContracts: mocks.getConsentedContracts,
                updateContractTerms: mocks.update,
            },
        }),
    }),
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({}),
    useMutation: (options: unknown) => options,
}));
vi.mock('../useConsentAudienceReview', () => ({ useConsentAudienceReview: () => mocks.review }));
vi.mock('../useSharedUrisInTerms', () => ({ getTermsWithSharedUrisForWallet: mocks.materialize }));
import { useUpdateTerms } from '../useUpdateTerms';

type Submission = Parameters<ReturnType<typeof useUpdateTerms>['mutate']>[0];
type MutationHarness = { mutationFn: (submission: Submission) => Promise<unknown> };
const contract = {
    uri: 'urn:contract',
    owner: { did: 'did:key:current-owner' },
    recipients: [{ did: 'did:key:current-partner' }],
    audienceVersion: 3,
};
const selection: Submission = {
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
const update = (knownContractUri?: string) => {
    const hook = renderHook(() =>
        useUpdateTerms('urn:terms', 'did:key:old-owner', knownContractUri)
    );
    return (hook.result.current as unknown as MutationHarness).mutationFn;
};

describe('term update audience boundary', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.getContract.mockResolvedValue(contract);
        mocks.materialize.mockResolvedValue(selection);
        mocks.update.mockResolvedValue(true);
    });
    afterEach(cleanup);

    it('uses the known contract URI, reviews fresh metadata, then encrypts and acknowledges it', async () => {
        let confirm!: () => void;
        mocks.review.mockImplementation(
            () =>
                new Promise<void>(resolve => {
                    confirm = resolve;
                })
        );
        const pending = update(contract.uri)(selection);
        await vi.waitFor(() => expect(mocks.review).toHaveBeenCalledWith(contract));
        expect(mocks.getConsentedContracts).not.toHaveBeenCalled();
        expect(mocks.materialize).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
        confirm();
        await pending;
        expect(mocks.getContract).toHaveBeenCalledWith(contract.uri);
        expect(mocks.materialize.mock.calls[0]![1]).toEqual([
            'did:key:current-owner',
            'did:key:current-partner',
        ]);
        expect(mocks.update).toHaveBeenCalledWith('urn:terms', {
            ...selection,
            audienceVersion: 3,
        });
    });

    it('preserves paginated discovery for older callers without a contract URI', async () => {
        mocks.getConsentedContracts
            .mockResolvedValueOnce({ records: [], hasMore: true, cursor: 'next' })
            .mockResolvedValueOnce({ records: [{ uri: 'urn:terms', contract }], hasMore: false });
        await update()(selection);
        expect(mocks.getConsentedContracts).toHaveBeenNthCalledWith(2, { cursor: 'next' });
        expect(mocks.getContract).toHaveBeenCalledWith(contract.uri);
        expect(mocks.update).toHaveBeenCalledOnce();
    });

    it('runs guardian approval after encryption and immediately before submitting', async () => {
        const order: string[] = [];
        mocks.materialize.mockImplementation(async () => {
            order.push('encrypt');
            return selection;
        });
        mocks.update.mockImplementation(async () => {
            order.push('update');
            return true;
        });
        await update(contract.uri)({
            ...selection,
            beforeSubmit: async () => {
                order.push('approve');
            },
        });
        expect(order).toEqual(['encrypt', 'approve', 'update']);
        expect(mocks.materialize.mock.calls[0]![3]).toEqual(selection);
        expect(mocks.update.mock.calls[0]![1]).not.toHaveProperty('beforeSubmit');
    });

    it('does not encrypt or submit after the fresh audience review is canceled', async () => {
        mocks.review.mockRejectedValue(new Error('Sharing canceled.'));
        await expect(update(contract.uri)(selection)).rejects.toThrow('Sharing canceled.');
        expect(mocks.materialize).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('does not retry an audience conflict with a silently refreshed audience', async () => {
        mocks.update.mockRejectedValue(new Error('Audience conflict'));
        await expect(update(contract.uri)(selection)).rejects.toThrow('Audience conflict');
        expect(mocks.update).toHaveBeenCalledOnce();
        expect(mocks.getContract).toHaveBeenCalledOnce();
    });
});
