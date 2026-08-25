import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
    sendCredential: vi.fn(),
    presentToast: vi.fn(),
}));

const credential = (name: string) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:holder' },
    proof: {},
    name,
});

vi.mock('@ionic/react', () => ({
    IonIcon: () => <span />,
    IonSpinner: () => <span data-testid="spinner" />,
}));

vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    CredentialCategoryEnum: { achievement: 'Achievement' },
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    categoryMetadata: { Achievement: { defaultImageSrc: 'fallback.png' } },
    getDefaultCategoryForCredential: () => 'Achievement',
    getCredentialName: (vc: { name: string }) => vc.name,
    useGetCredentialList: () => ({
        data: {
            pages: [
                {
                    records: [
                        { id: 'one', uri: 'lc:credential:one', category: 'Achievement' },
                        { id: 'two', uri: 'lc:credential:two', category: 'Achievement' },
                    ],
                },
            ],
        },
        isLoading: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
    }),
    useGetResolvedCredentials: () => [
        { data: credential('First Credential'), isLoading: false },
        { data: credential('Second Credential'), isLoading: false },
    ],
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        initWallet: async () => ({ invoke: { sendCredential: mocks.sendCredential } }),
    }),
}));

vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({
        record,
        onCheckMarkClick,
    }: {
        record: { uri: string };
        onCheckMarkClick: () => void;
    }) => (
        <button type="button" onClick={onCheckMarkClick}>
            {record.uri}
        </button>
    ),
}));

import { SendContactCredentialsModal } from './SendContactCredentialsModal';

const contact = {
    profileId: 'janet',
    displayName: 'Janet Yoon',
    shortBio: '',
    bio: '',
    did: 'did:web:example:janet',
} as any;

describe('SendContactCredentialsModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sends all selected credentials to the selected contact', async () => {
        mocks.sendCredential.mockResolvedValue('lc:credential:sent');
        const onComplete = vi.fn();

        render(
            <SendContactCredentialsModal
                contact={contact}
                onCancel={vi.fn()}
                onComplete={onComplete}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'lc:credential:one' }));
        fireEvent.click(screen.getByRole('button', { name: 'lc:credential:two' }));
        fireEvent.click(screen.getByRole('button', { name: 'Send Selected' }));

        await waitFor(() => expect(mocks.sendCredential).toHaveBeenCalledTimes(2));
        expect(mocks.sendCredential.mock.calls[0]?.[0]).toEqual('janet');
        expect(mocks.sendCredential.mock.calls[1]?.[0]).toEqual('janet');
        expect(onComplete).toHaveBeenCalledOnce();
    });

    it('retains only failed selections for retry after a partial send', async () => {
        mocks.sendCredential
            .mockResolvedValueOnce('lc:credential:sent')
            .mockRejectedValueOnce(new Error('network'));
        const onComplete = vi.fn();

        render(
            <SendContactCredentialsModal
                contact={contact}
                onCancel={vi.fn()}
                onComplete={onComplete}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'lc:credential:one' }));
        fireEvent.click(screen.getByRole('button', { name: 'lc:credential:two' }));
        fireEvent.click(screen.getByRole('button', { name: 'Send Selected' }));

        await waitFor(() => expect(screen.getByText('1 selected')).toBeTruthy());
        expect(onComplete).not.toHaveBeenCalled();
        expect(mocks.presentToast).toHaveBeenCalledWith(
            "1 credential(s) couldn't be sent. Try again.",
            expect.objectContaining({ type: 'error' })
        );
    });
});
