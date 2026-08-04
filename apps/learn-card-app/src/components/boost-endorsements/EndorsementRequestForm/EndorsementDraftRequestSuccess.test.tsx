import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let credentialInfo:
        | {
              uri: string;
              seed: string;
              pin: string;
          }
        | undefined;

    return {
        endorseCredential: vi.fn(),
        sendCredential: vi.fn(),
        initWallet: vi.fn(),
        presentToast: vi.fn(),
        getCredentialInfo: () => credentialInfo,
        setCredentialInfo: (
            value:
                | {
                      uri: string;
                      seed: string;
                      pin: string;
                  }
                | undefined
        ) => {
            credentialInfo = value;
        },
    };
});

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('./EndorsementRequestFormFooter', () => ({ default: () => null }));
vi.mock('../EndorsementsList/EndorsementFullView', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/EndorsementThumb', () => ({
    EndorsmentThumbWithCircle: () => null,
}));
vi.mock('../EndorsementForm/EndorsementFormBoostPreviewCard', () => ({ default: () => null }));
vi.mock('../../network-prompts/hooks/useJoinLCNetworkModal', () => ({
    default: () => ({ handlePresentJoinNetworkModal: vi.fn() }),
}));
vi.mock('../../../stores/endorsementsRequestStore', () => ({
    endorsementsRequestStore: {
        useTracked: {
            endorsementRequest: () => ({
                description: 'Please endorse this credential',
                qualification: '',
                mediaAttachments: [],
                relationship: { type: 'friend', label: 'Friend' },
            }),
            credentialInfo: mocks.getCredentialInfo,
        },
        set: {
            endorsementRequest: vi.fn(),
            credentialInfo: vi.fn(),
        },
    },
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement' },
    ModalTypes: { Right: 'right' },
    ToastTypeEnum: { Error: 'error' },
    getLogger: () => ({ error: vi.fn() }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: { displayName: 'Endorser', image: 'endorser.png' },
    }),
    useGetVCInfo: () => ({
        issueeName: 'Recipient',
        issueeProfile: { profileId: 'recipient', displayName: 'Recipient' },
    }),
    useIsLoggedIn: () => true,
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'toasts.boost.endorsementRequestFailed': () => 'Unable to send endorsement',
    'endorsement.request.draft.sendingPre': () => 'Sending',
    'endorsement.request.draft.sendingPost': () => 'endorsement',
    'endorsement.request.draft.sentPre': () => 'Sent',
    'endorsement.request.draft.sentPost': () => 'endorsement',
    'endorsement.request.draft.waitingReview': () => 'Waiting for review',
    'endorsement.request.draft.approvedPre': () => 'Approved',
    'endorsement.request.draft.approvedPost': () => 'endorsement',
    'endorsement.request.draft.approvedBy': () => 'Approved by recipient',
    'endorsement.request.draft.sendFailedTitle': () => 'Endorsement Not Sent',
    'endorsement.request.draft.sendFailedDescription': () =>
        'Your endorsement is still saved. Try again.',
    'endorsement.request.draft.tryAgain': () => 'Try Again',
}));

import EndorsementDraftRequestSuccess from './EndorsementDraftRequestSuccess';

describe('EndorsementDraftRequestSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setCredentialInfo(undefined);
        mocks.endorseCredential.mockResolvedValue({ id: 'endorsement:test' });
        mocks.sendCredential.mockResolvedValue({ uri: 'sent:test' });
        mocks.initWallet.mockResolvedValue({
            invoke: {
                endorseCredential: mocks.endorseCredential,
                sendCredential: mocks.sendCredential,
            },
        });
    });

    it('shows an error when auto-send has no request identity', async () => {
        render(
            <EndorsementDraftRequestSuccess
                credential={{ id: 'credential:test' } as never}
                closeModal={vi.fn()}
                autoSend
            />
        );

        await waitFor(() =>
            expect(mocks.presentToast).toHaveBeenCalledWith('Unable to send endorsement', {
                type: 'error',
                hasDismissButton: true,
            })
        );
        expect(mocks.initWallet).not.toHaveBeenCalled();
        expect(await screen.findByText('Endorsement Not Sent')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled();
        expect(screen.queryByText('Waiting for review')).not.toBeInTheDocument();
    });

    it('preserves the draft and retries after a send failure', async () => {
        mocks.setCredentialInfo({
            uri: 'credential:test',
            seed: 'request-seed',
            pin: '1234',
        });
        mocks.sendCredential.mockRejectedValueOnce(new Error('Network unavailable'));

        render(
            <EndorsementDraftRequestSuccess
                credential={{ id: 'credential:test' } as never}
                closeModal={vi.fn()}
                autoSend
            />
        );

        await screen.findByText('Endorsement Not Sent');
        expect(mocks.sendCredential).toHaveBeenCalledOnce();

        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

        await waitFor(() => expect(mocks.sendCredential).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/Sent/)).toBeInTheDocument();
        expect(screen.getByText('Waiting for review')).toBeInTheDocument();
        expect(screen.queryByText('Endorsement Not Sent')).not.toBeInTheDocument();
    });
});
