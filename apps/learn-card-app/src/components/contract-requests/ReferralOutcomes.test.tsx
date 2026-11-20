import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_REFERRAL_OUTCOMES } from '@learncard/types';

const state = vi.hoisted(() => ({
    did: 'did:key:learner',
    review: vi.fn(),
    upload: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn(),
    close: vi.fn(),
    guard: vi.fn(),
    outcomes: [] as string[],
}));
const details = {
    uri: 'contract-selected',
    name: 'Career referral',
    version: 1,
    audienceVersion: 4,
    owner: { did: 'did:key:partner', profileId: 'partner', displayName: 'Partner' },
    recipients: [{ did: 'did:key:referrer', profileId: 'referrer', displayName: 'Referrer' }],
};
const wallet = {
    id: { did: () => state.did },
    invoke: {
        getContract: async () => details,
        getConsentedContracts: async () => ({
            hasMore: false,
            records: [
                {
                    uri: 'terms-selected',
                    contract: details,
                    status: 'live',
                    terms: { outcomes: [...state.outcomes] },
                },
            ],
        }),
        attachReferralOutcome: state.attach,
        detachReferralOutcome: state.detach,
    },
};
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: async () => wallet }),
    useModal: () => ({ closeModal: state.close }),
    walletStore: { use: { wallet: () => wallet }, get: { wallet: () => wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => undefined },
        get: { switchedDid: () => undefined },
    },
}));
vi.mock('learn-card-base/hooks/consentAudience', () => ({
    loadContractAudience: async () => ({
        contract: details,
        audienceVersion: details.audienceVersion,
        recipients: [details.owner.did, ...details.recipients.map(recipient => recipient.did)],
    }),
}));
vi.mock('learn-card-base/hooks/useConsentAudienceReview', () => ({
    useConsentAudienceReview: () => state.review,
}));
vi.mock('../../hooks/useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ uploadReferralOutcome: state.upload }),
}));
vi.mock('../../hooks/useGuardianGate', () => ({
    default: () => ({ guardedAction: state.guard }),
}));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
import { ReferralOutcomes } from './ReferralOutcomes';

const show = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
        <QueryClientProvider client={client}>
            <ReferralOutcomes contractUri={details.uri} />
        </QueryClientProvider>
    );
    await screen.findByLabelText('Outcome file');
    fireEvent.change(screen.getByLabelText('Outcome file'), {
        target: { files: [new File(['{}'], 'outcome.json', { type: 'application/json' })] },
    });
};
beforeEach(() => {
    vi.resetAllMocks();
    state.did = 'did:key:learner';
    state.outcomes = [];
    state.guard.mockImplementation(async (action: () => Promise<void>) => action());
    state.review.mockResolvedValue(undefined);
    state.upload.mockResolvedValue({ success: true, credentialUri: 'encrypted-outcome' });
    state.attach.mockResolvedValue(true);
    state.detach.mockResolvedValue(true);
});
afterEach(cleanup);

describe('referral outcome selection', () => {
    it('reuses the encrypted upload when attachment fails, and targets only the selected consent', async () => {
        state.attach.mockRejectedValueOnce(new Error('connection lost'));
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByText('Outcome shared with this referral.');
        expect(state.upload).toHaveBeenCalledExactlyOnceWith(
            expect.any(File),
            ['did:key:partner', 'did:key:referrer'],
            'did:key:learner'
        );
        expect(state.attach.mock.calls).toEqual([
            ['terms-selected', 'encrypted-outcome', 4],
            ['terms-selected', 'encrypted-outcome', 4],
        ]);
        expect(screen.getByLabelText('Outcome file')).toHaveValue('');
    });

    it('does not upload or attach if the account changes during audience review', async () => {
        state.review.mockImplementation(async () => {
            state.did = 'did:key:other';
        });
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByRole('alert');
        expect(state.upload).not.toHaveBeenCalled();
        expect(state.attach).not.toHaveBeenCalled();
    });

    it('distinguishes an upload outage from an invalid credential file', async () => {
        state.upload.mockResolvedValue({ success: false, error: 'storage unavailable' });
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            "Couldn't update this referral. Check your connection and try again."
        );
        expect(state.attach).not.toHaveBeenCalled();
    });

    it('rechecks the active account inside renewed guardian approval before attaching', async () => {
        state.guard
            .mockImplementationOnce(async (action: () => Promise<void>) => action())
            .mockImplementationOnce(async (action: () => Promise<void>) => {
                state.did = 'did:key:other';
                await action();
            });
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByRole('alert');
        expect(state.upload).toHaveBeenCalledOnce();
        expect(state.attach).not.toHaveBeenCalled();
    });

    it('confirms the persisted outcome after a committed attach loses its response', async () => {
        state.attach.mockImplementationOnce(async () => {
            state.outcomes = ['encrypted-outcome'];
            throw new Error('response lost');
        });
        state.attach.mockResolvedValueOnce(false);
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByText('Outcome shared with this referral.');
        expect(state.upload).toHaveBeenCalledOnce();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByRole('button', { name: 'Remove outcome 1' })).toBeVisible();
    });

    it('does not claim success when a no-op attach has no persisted selection', async () => {
        state.attach.mockResolvedValue(false);
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        await screen.findByRole('alert');
        expect(screen.queryByText('Outcome shared with this referral.')).toBeNull();
    });

    it('explains the outcome cap before uploading another credential', async () => {
        state.outcomes = Array.from(
            { length: MAX_REFERRAL_OUTCOMES },
            (_, index) => `existing-outcome-${index}`
        );
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            `You can attach up to ${MAX_REFERRAL_OUTCOMES} outcomes to this referral.`
        );
        expect(state.upload).not.toHaveBeenCalled();
        expect(state.attach).not.toHaveBeenCalled();
    });

    it('confirms that an outcome was already removed when detach returns no change', async () => {
        state.outcomes = ['first-outcome'];
        state.detach.mockImplementation(async () => {
            state.outcomes = [];
            return false;
        });
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Remove outcome 1' }));
        await screen.findByText('Outcome removed from this referral.');
        expect(screen.queryByRole('alert')).toBeNull();
        await screen.findByText('No outcomes attached yet.');
    });

    it('does not claim removal when a no-op detach leaves the selection present', async () => {
        state.outcomes = ['first-outcome'];
        state.detach.mockResolvedValue(false);
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Remove outcome 1' }));
        await screen.findByRole('alert');
        expect(screen.queryByText('Outcome removed from this referral.')).toBeNull();
        expect(screen.getByRole('button', { name: 'Remove outcome 1' })).toBeVisible();
    });

    it('removes only the selected outcome and refreshes the persisted list', async () => {
        state.outcomes = ['first-outcome', 'second-outcome'];
        state.detach.mockImplementation(async () => {
            state.outcomes = ['second-outcome'];
            return true;
        });
        await show();
        fireEvent.click(screen.getByRole('button', { name: 'Remove outcome 1' }));
        await screen.findByText('Outcome removed from this referral.');
        expect(state.detach).toHaveBeenCalledExactlyOnceWith('terms-selected', 'first-outcome', 4);
        await waitFor(() =>
            expect(screen.queryByRole('button', { name: 'Remove outcome 2' })).toBeNull()
        );
        expect(screen.getByRole('button', { name: 'Remove outcome 1' })).toBeVisible();
        expect(state.attach).not.toHaveBeenCalled();
    });
});
