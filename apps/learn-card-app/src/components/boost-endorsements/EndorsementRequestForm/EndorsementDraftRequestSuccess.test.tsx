import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    presentToast: vi.fn(),
}));

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
            credentialInfo: () => undefined,
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
}));

import EndorsementDraftRequestSuccess from './EndorsementDraftRequestSuccess';

describe('EndorsementDraftRequestSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
    });
});
