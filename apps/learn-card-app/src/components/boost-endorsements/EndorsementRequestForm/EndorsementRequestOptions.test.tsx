import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clipboardWriteMock, logWarnMock, mutateMock, presentToastMock, targetIdMock } = vi.hoisted(
    () => ({
        clipboardWriteMock: vi.fn(),
        logWarnMock: vi.fn(),
        mutateMock: vi.fn(),
        presentToastMock: vi.fn(),
        targetIdMock: vi.fn(),
    })
);

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
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getEndorsementTargetId: targetIdMock,
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: { GENERATE_SHARE_LINK: 'generate-share-link' },
    useAnalytics: () => ({ track: vi.fn() }),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'endorsement.request.options.linkGenerationFailed': () => 'Unable to generate request',
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
        targetIdMock.mockImplementation(async (value: { id?: string }) =>
            Promise.resolve(value.id ?? `urn:sha256:${'a'.repeat(64)}`)
        );
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

    it('stops the loading state when credential identity resolution fails', async () => {
        const error = new Error('Unable to derive credential identity');
        targetIdMock.mockRejectedValueOnce(error);

        render(
            <EndorsementRequestOptions
                credential={credential}
                shareCredentialUri="lc:credential:record-a"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        expect(await screen.findByRole('button', { name: /copy link/i })).toBeDisabled();
        expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
        expect(mutateMock).not.toHaveBeenCalled();
        expect(logWarnMock).toHaveBeenCalledWith(
            'endorsement.request.link.failed',
            error,
            expect.objectContaining({ stage: 'identity-resolution' })
        );
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

    it('generates a request for an idless credential using a content identity', async () => {
        const idlessCredential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        } as never;

        render(
            <EndorsementRequestOptions
                credential={idlessCredential}
                shareCredentialUri="lc:credential:idless-record"
                categoryType={'Achievement' as never}
                endorsementRequest={{ email: '', text: '' }}
                setEndorsementRequest={vi.fn()}
            />
        );

        await waitFor(() => expect(mutateMock).toHaveBeenCalledOnce());

        const mutationInput = mutateMock.mock.calls[0][0];
        expect(mutationInput).toEqual({
            credential: idlessCredential,
            credentialUri: 'lc:credential:idless-record',
            credentialId: expect.stringMatching(/^urn:sha256:[0-9a-f]{64}$/),
        });
        expect(logWarnMock).not.toHaveBeenCalled();
        expect(presentToastMock).not.toHaveBeenCalled();
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
                    credentialId: 'credential:first',
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
                    credentialId: 'credential:second',
                },
                expect.anything()
            )
        );
    });
});
