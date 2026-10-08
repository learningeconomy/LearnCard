import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import CredentialClaimModal from './CredentialClaimModal';

const mocks = vi.hoisted(() => ({
    acceptCredential: vi.fn(),
    addVCtoWallet: vi.fn(),
    initWallet: vi.fn(),
    presentToast: vi.fn(),
    queryNotifications: vi.fn(),
    updateNotificationMeta: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    IonSpinner: () => <div role="status">Loading</div>,
}));
vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { achievement: 'Achievement' },
    BoostPageViewMode: { Card: 'card' },
    CredentialCategoryEnum: { achievement: 'Achievement' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    connectionPromptKeys: { all: ['connectionPrompts'] },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        addVCtoWallet: mocks.addVCtoWallet,
        initWallet: mocks.initWallet,
    }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    BoostEarnedCard: () => <div>Credential preview</div>,
}));
vi.mock('../../paraglide/messages.js', () => ({
    'claim.claiming': () => 'Claiming',
    'claim.modal.acceptCredential': () => 'Accept Credential',
    'claim.modal.claimedBody': () => 'Saved',
    'claim.modal.claimedTitle': () => 'Claimed',
    'claim.modal.credentialFallback': () => 'Credential',
    'claim.modal.earnedTitle': () => 'You earned a credential',
    'claim.modal.loadingNameAria': () => 'Loading name',
    'claim.modal.loadingCredential': () => 'Loading credential',
    'claim.modal.loadError': () => 'Unable to load credential',
    'claim.modal.loadErrorTitle': () => 'Unable to load',
    'claim.modal.maybeLater': () => 'Maybe Later',
    'claim.modal.notFoundBody': () => 'Credential not found',
    'claim.modal.preparing': () => 'Preparing',
    'common.continue': () => 'Continue',
    'toasts.credentialClaimed': () => 'Credential claimed',
    'toasts.credentialClaimFailed': () => 'Credential claim failed',
}));
vi.mock('../../helpers/sendCredentialFlow.helpers', () => ({
    flushOnDismiss: vi.fn(),
    flushOnError: vi.fn(),
    markClaimCompleted: vi.fn(),
    markClaimStarted: vi.fn(),
    markCredentialResolved: vi.fn(),
    markModalMounted: vi.fn(),
}));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });

    return { promise, resolve };
};

const credential = {
    id: 'urn:uuid:credential',
    issuer: 'did:key:issuer',
    name: 'Safety Training',
    type: ['VerifiableCredential'],
    credentialSubject: { id: 'did:key:viewer' },
} as VC;

describe('CredentialClaimModal connection prompt cache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.queryNotifications.mockResolvedValue(undefined);
        mocks.updateNotificationMeta.mockResolvedValue(undefined);
    });

    it('invalidates prompts only after server acceptance and local storage both succeed', async () => {
        const accept = deferred<boolean>();
        const add = deferred<boolean>();
        const wallet = {
            invoke: {
                acceptCredential: mocks.acceptCredential.mockReturnValue(accept.promise),
                queryNotifications: mocks.queryNotifications,
                updateNotificationMeta: mocks.updateNotificationMeta,
            },
            read: { get: vi.fn().mockResolvedValue(credential) },
        };
        mocks.initWallet.mockResolvedValue(wallet);
        mocks.addVCtoWallet.mockReturnValue(add.promise);

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const promptQueryKey = ['connectionPrompts', 'pending', 'did:key:viewer'];
        queryClient.setQueryData(promptQueryKey, [{ id: 'prompt-1' }]);

        render(
            <QueryClientProvider client={queryClient}>
                <CredentialClaimModal
                    credentialUri="lc:credential:one"
                    credential={credential}
                    onDismiss={vi.fn()}
                />
            </QueryClientProvider>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Accept Credential' }));
        await waitFor(() => {
            expect(mocks.acceptCredential).toHaveBeenCalledWith('lc:credential:one');
            expect(mocks.addVCtoWallet).toHaveBeenCalledWith({ uri: 'lc:credential:one' });
        });

        await act(async () => add.resolve(true));
        expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(false);

        await act(async () => accept.resolve(true));
        await waitFor(() => {
            expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(true);
        });
    });

    it('withholds prompt invalidation when local storage returns false without failing the claim UI', async () => {
        const wallet = {
            invoke: {
                acceptCredential: mocks.acceptCredential.mockResolvedValue(true),
                queryNotifications: mocks.queryNotifications,
                updateNotificationMeta: mocks.updateNotificationMeta,
            },
            read: { get: vi.fn().mockResolvedValue(credential) },
        };
        mocks.initWallet.mockResolvedValue(wallet);
        mocks.addVCtoWallet.mockResolvedValue(false);

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const promptQueryKey = ['connectionPrompts', 'pending', 'did:key:viewer'];
        queryClient.setQueryData(promptQueryKey, [{ id: 'prompt-1' }]);

        render(
            <QueryClientProvider client={queryClient}>
                <CredentialClaimModal
                    credentialUri="lc:credential:one"
                    credential={credential}
                    onDismiss={vi.fn()}
                />
            </QueryClientProvider>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Accept Credential' }));

        await screen.findByText('Claimed');
        expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(false);
        expect(mocks.presentToast).toHaveBeenCalledWith(
            'Credential claimed',
            expect.objectContaining({ type: 'success' })
        );
    });

    it('withholds prompt invalidation when no wallet is available without failing the claim UI', async () => {
        mocks.initWallet.mockResolvedValue(undefined);
        mocks.addVCtoWallet.mockResolvedValue(true);

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const promptQueryKey = ['connectionPrompts', 'pending', 'did:key:viewer'];
        queryClient.setQueryData(promptQueryKey, [{ id: 'prompt-1' }]);

        render(
            <QueryClientProvider client={queryClient}>
                <CredentialClaimModal
                    credentialUri="lc:credential:one"
                    credential={credential}
                    onDismiss={vi.fn()}
                />
            </QueryClientProvider>
        );

        const preparingButton = await screen.findByRole('button', { name: 'Preparing' });
        // Exercise handleClaim's defensive missing-wallet branch directly. The normal UI keeps
        // this button disabled, but the handler must still avoid treating a missing wallet as a
        // fulfilled server acceptance if it is invoked during an external/racy event dispatch.
        const reactPropsKey = Object.keys(preparingButton).find(key =>
            key.startsWith('__reactProps$')
        )!;
        const { onClick } = (preparingButton as unknown as Record<string, { onClick: () => void }>)[
            reactPropsKey
        ];
        await act(async () => onClick());

        await screen.findByText('Claimed');
        expect(queryClient.getQueryState(promptQueryKey)?.isInvalidated).toBe(false);
        expect(mocks.presentToast).toHaveBeenCalledWith(
            'Credential claimed',
            expect.objectContaining({ type: 'success' })
        );
    });
});
