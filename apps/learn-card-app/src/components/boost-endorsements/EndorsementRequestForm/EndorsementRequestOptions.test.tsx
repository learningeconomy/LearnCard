import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clipboardWriteMock, logWarnMock, mutateMock, presentToastMock } = vi.hoisted(() => ({
    clipboardWriteMock: vi.fn(),
    logWarnMock: vi.fn(),
    mutateMock: vi.fn(),
    presentToastMock: vi.fn(),
}));

vi.mock('@capacitor/clipboard', () => ({
    Clipboard: { write: clipboardWriteMock },
}));

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
    getLogger: () => ({ warn: logWarnMock }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: { displayName: 'Requester' } }),
    useGetVCInfo: () => ({ achievementType: 'Achievement', title: 'Credential' }),
    useModal: () => ({
        newModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    useShareBoostMutation: () => ({ mutate: mutateMock, isPending: false }),
    useToast: () => ({ presentToast: presentToastMock }),
    useWallet: () => ({ initWallet: vi.fn() }),
    useTenantBaseUrl: () => 'http://localhost:3000',
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
                shareCredentialUri="lc:credential:record-a"
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

    it('copies an environment-aware local endorsement request URL', async () => {
        render(
            <EndorsementRequestOptions
                credential={credential}
                shareCredentialUri="lc:credential:record-a"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() => expect(mutateMock).toHaveBeenCalledOnce());
        const callbacks = mutateMock.mock.calls[0][1];
        act(() => {
            callbacks.onSuccess({
                link: 'https://learncard.app/share-boost?uri=credential%3Atest&seed=seed&pin=1234',
            });
            callbacks.onSettled();
        });

        fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

        await waitFor(() =>
            expect(clipboardWriteMock).toHaveBeenCalledWith({
                string: 'http://localhost:3000/?uri=credential%3Atest&seed=seed&pin=1234&credentialId=credential%3Atest&endorsementRequest=true',
            })
        );
    });

    it('reports malformed generated links without enabling request actions', async () => {
        render(
            <EndorsementRequestOptions
                credential={credential}
                shareCredentialUri="lc:credential:record-a"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() => expect(mutateMock).toHaveBeenCalledOnce());

        const callbacks = mutateMock.mock.calls[0][1];
        act(() => {
            callbacks.onSuccess({ link: 'not-a-url' });
            callbacks.onSettled();
        });

        expect(presentToastMock).toHaveBeenCalledWith('Unable to generate request', {
            type: 'error',
            hasDismissButton: true,
        });
        expect(screen.getByRole('button', { name: /copy link/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /get code/i })).toBeDisabled();
    });

    it('logs the share mutation stage without exposing credential values', async () => {
        render(
            <EndorsementRequestOptions
                credential={credential}
                shareCredentialUri="lc:credential:record-a"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() => expect(mutateMock).toHaveBeenCalledOnce());

        const error = new Error('Unable to read the shared credential cache');
        act(() => mutateMock.mock.calls[0][1].onError(error));

        expect(logWarnMock).toHaveBeenCalledWith('endorsement.request.link.failed', error, {
            stage: 'share-mutation',
            hasCredentialId: true,
            hasCredentialUri: true,
            hasShareCredentialUri: true,
            isCertifiedBoostCredential: false,
        });
    });

    it('regenerates requests with each credential record URI', async () => {
        const { rerender } = render(
            <EndorsementRequestOptions
                credential={{ id: 'credential:first' } as never}
                shareCredentialUri="lc:credential:record-first"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() =>
            expect(mutateMock).toHaveBeenCalledWith(
                {
                    credential: { id: 'credential:first' },
                    credentialUri: 'lc:credential:record-first',
                },
                expect.anything()
            )
        );

        rerender(
            <EndorsementRequestOptions
                credential={{ id: 'credential:second' } as never}
                shareCredentialUri="lc:credential:record-second"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() =>
            expect(mutateMock).toHaveBeenLastCalledWith(
                {
                    credential: { id: 'credential:second' },
                    credentialUri: 'lc:credential:record-second',
                },
                expect.anything()
            )
        );
    });
});
