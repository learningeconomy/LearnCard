import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    closeAllModals: vi.fn(),
    closeModal: vi.fn(),
    endorseCredential: vi.fn(),
    logError: vi.fn(),
    newModal: vi.fn(),
    presentToast: vi.fn(),
    sendCredential: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement' },
    getLogger: () => ({ error: mocks.logError }),
    ModalTypes: { FullScreen: 'fullscreen' },
    ToastTypeEnum: { Error: 'error' },
    useGetVCInfo: () => ({
        issueeProfile: { profileId: 'recipient-profile' },
        loading: false,
    }),
    useIsLoggedIn: () => true,
    useModal: () => ({
        closeAllModals: mocks.closeAllModals,
        closeModal: mocks.closeModal,
        newModal: mocks.newModal,
    }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        initWallet: vi.fn().mockResolvedValue({
            invoke: {
                endorseCredential: mocks.endorseCredential,
                sendCredential: mocks.sendCredential,
            },
        }),
    }),
}));

vi.mock('./endorsement-state.helpers', () => ({
    convertAttachmentsToEvidence: () => [],
    getEndorsementTarget: (credential: { id: string }) => ({
        id: credential.id,
        name: 'Credential',
    }),
    EndorsementFormModeEnum: { create: 'create' },
    initialEndorsementState: {
        relationship: { label: 'Colleague', type: 'colleague' },
        description: 'Strong collaborator',
        qualification: '',
        mediaAttachments: [],
    },
}));

vi.mock('./EndorsementTextForm', () => ({ default: () => null }));
vi.mock('./EndorsementFormHeader', () => ({ default: () => null }));
vi.mock('./EndorsementRelationshipForm', () => ({ default: () => null }));
vi.mock('./EndorsementFormBoostPreviewCard', () => ({ default: () => null }));
vi.mock('./EndorsementQualificationsTextForm', () => ({ default: () => null }));
vi.mock('../EndorsementMediaAttachments/EndorsementMediaForm', () => ({ default: () => null }));
vi.mock('../EndorsementRequestForm/EndorsementDraftRequestSuccess', () => ({
    default: () => null,
}));
vi.mock('./EndorsementFormFooter', () => ({
    default: ({
        handleEndorsementSubmit,
        isDisabled,
        isLoading,
    }: {
        handleEndorsementSubmit: () => void;
        isDisabled: boolean;
        isLoading: boolean;
    }) => (
        <button disabled={isDisabled} onClick={handleEndorsementSubmit}>
            {isLoading ? 'Sending...' : 'Endorse'}
        </button>
    ),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'toasts.boost.endorsementRequestFailed': () => 'Unable to send endorsement',
}));

import EndorsementForm from './EndorsementForm';

describe('EndorsementForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.endorseCredential.mockResolvedValue({ id: 'urn:uuid:endorsement' });
    });

    it('keeps the footer outside the scrolling content', () => {
        render(
            <EndorsementForm
                credential={{ id: 'urn:uuid:credential' } as never}
                categoryType={'Achievement' as never}
            />
        );

        const footer = screen.getByRole('button', { name: 'Endorse' });
        const modalRoot = footer.parentElement;
        const scrollingContent = modalRoot?.firstElementChild;

        expect(modalRoot).toHaveClass('overflow-hidden');
        expect(scrollingContent).toHaveClass('overflow-y-auto');
        expect(scrollingContent?.firstElementChild).toHaveClass('pb-[200px]');
        expect(scrollingContent).not.toContainElement(footer);
    });

    it('leaves the sending state and reports a failed endorsement send', async () => {
        const { promise, reject } = Promise.withResolvers<void>();
        mocks.sendCredential.mockReturnValue(promise);

        render(
            <EndorsementForm
                credential={{ id: 'urn:uuid:credential' } as never}
                categoryType={'Achievement' as never}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Endorse' }));
        expect(await screen.findByRole('button', { name: 'Sending...' })).toBeDisabled();
        expect(mocks.endorseCredential).toHaveBeenCalledWith(
            { id: 'urn:uuid:credential' },
            expect.anything()
        );
        expect(mocks.sendCredential).toHaveBeenCalledWith(
            'recipient-profile',
            { id: 'urn:uuid:endorsement' },
            expect.objectContaining({
                credentialId: 'urn:uuid:credential',
            })
        );

        await act(async () => reject(new Error('Send failed')));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Endorse' })).toBeEnabled());
        expect(mocks.presentToast).toHaveBeenCalledWith('Unable to send endorsement', {
            type: 'error',
            hasDismissButton: true,
        });
        expect(mocks.closeAllModals).not.toHaveBeenCalled();
    });
});
