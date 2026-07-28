import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));

vi.mock('../../boost/boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('./EndorsementRequestSuccess', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/QRCodeScanner', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/CopyStack', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/Mail', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({
    IonInput: () => null,
    IonTextarea: () => null,
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement' },
    ModalTypes: { FullScreen: 'fullscreen' },
    ToastTypeEnum: { Error: 'error' },
    useGetCurrentLCNUser: () => ({ currentLCNUser: { displayName: 'Requester' } }),
    useGetVCInfo: () => ({ achievementType: 'Achievement', title: 'Credential' }),
    useModal: () => ({
        newModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    useShareBoostMutation: () => ({ mutate: mutateMock, isPending: false }),
    useToast: () => ({ presentToast: vi.fn() }),
    useWallet: () => ({ initWallet: vi.fn() }),
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: { GENERATE_SHARE_LINK: 'generate-share-link' },
    useAnalytics: () => ({ track: vi.fn() }),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'toasts.boost.endorsementRequestFailed': () => 'Unable to generate request',
    'toasts.boost.endorsementLinkCopied': () => 'Copied',
    'endorsement.request.options.howToSend': () => 'How to send',
    'endorsement.request.options.generating': () => 'Generating',
    'endorsement.request.options.copyLink': () => 'Copy Link',
    'endorsement.request.options.getCode': () => 'Get Code',
    'endorsement.request.options.whatToSay': () => 'What to say',
    'endorsement.request.options.messagePlaceholder': () => 'Message',
    'endorsement.request.options.emailPlaceholder': () => 'Email',
    'endorsement.request.options.sending': () => 'Sending',
    'endorsement.request.options.sendEmail': () => 'Send Email',
}));

import EndorsementRequestOptions from './EndorsementRequestOptions';

const credential = { id: 'credential:test' } as never;

describe('EndorsementRequestOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps request actions disabled until link generation settles', async () => {
        render(
            <EndorsementRequestOptions
                credential={credential}
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() => expect(mutateMock).toHaveBeenCalledOnce());

        const copyButton = screen.getByRole('button', { name: /generating/i });
        const qrButton = screen.getByRole('button', { name: /get code/i });
        expect(copyButton).toBeDisabled();
        expect(qrButton).toBeDisabled();

        const callbacks = mutateMock.mock.calls[0][1];
        act(() => {
            callbacks.onSuccess({
                link: 'https://learncard.app/share-boost?uri=credential%3Atest&seed=seed&pin=1234',
            });
        });

        expect(copyButton).toBeDisabled();
        expect(qrButton).toBeDisabled();

        act(() => callbacks.onSettled());

        expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
        expect(qrButton).toBeEnabled();
    });
});
