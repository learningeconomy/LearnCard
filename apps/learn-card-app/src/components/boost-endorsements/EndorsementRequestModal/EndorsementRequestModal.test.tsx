import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const getSentCredentials = vi.fn();
    const readCredential = vi.fn();

    return {
        getSentCredentials,
        readCredential,
        initWallet: vi.fn(async () => ({
            invoke: { getSentCredentials },
            read: { get: readCredential },
        })),
    };
});

vi.mock('../EndorsementForm/EndorsementForm', () => ({ default: () => null }));
vi.mock('./EndorsementRequestModalFooter', () => ({ default: () => null }));
vi.mock('./EndorsementSuccessfullRequestModal', () => ({ default: () => null }));
vi.mock('./EndorsementRequestModalSkeletonLoader', () => ({ default: () => null }));
vi.mock('../EndorsementForm/EndorsementFormBoostPreviewCard', () => ({ default: () => null }));
vi.mock('../EndorsementRequestForm/EndorsementDraftRequestSuccess', () => ({
    default: () => <div>Existing endorsement</div>,
}));
vi.mock('../../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ desktopLoginBgAlt: '' }),
}));
vi.mock('learn-card-base/svgs/EndorsementThumb', () => ({
    EndorsmentThumbWithCircle: () => null,
}));
vi.mock('../../../i18n/TransP', () => ({ TransP: () => null }));
vi.mock('../../../paraglide/messages.js', () => ({
    'endorsement.modal.footer.endorse': () => 'Endorse',
    'endorsement.modal.requestedEndorsement': () => 'Request',
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('../../../stores/endorsementsRequestStore', () => ({
    endorsementsRequestStore: {
        set: { setEndorsementRequest: vi.fn() },
    },
}));
vi.mock('learn-card-base', () => ({
    ModalTypes: { Right: 'right' },
    UserProfilePicture: () => null,
    getLogger: () => ({ warn: vi.fn() }),
    useDeviceTypeByWidth: () => ({ isDesktop: false }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: { displayName: 'Endorser', image: 'endorser.png' },
    }),
    useGetVCInfo: () => ({
        issuerProfile: undefined,
        issueeProfile: { profileId: 'recipient', displayName: 'Recipient' },
        issueeName: 'Recipient',
        subjectProfileImageElement: null,
        title: 'Credential',
        loading: false,
    }),
    useIsLoggedIn: () => true,
    useModal: () => ({
        newModal: vi.fn(),
        closeModal: vi.fn(),
        closeAllModals: vi.fn(),
    }),
    // Deliberately returns a new function identity on every render.
    useWallet: () => ({ initWallet: (...args: []) => mocks.initWallet(...args) }),
}));

import EndorsementRequestModal from './EndorsementRequestModal';

const credential = { id: 'credential:test' } as never;
const shareLinkInfo = 'uri=credential%3Atest&seed=request-seed&pin=1234';

describe('EndorsementRequestModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getSentCredentials
            .mockResolvedValueOnce([
                {
                    uri: 'endorsement:pending',
                    from: 'did:example:endorser',
                    sent: new Date(),
                    metadata: {
                        type: 'endorsement',
                        sharedUri: shareLinkInfo,
                        relationship: { type: 'friend', label: 'Friend' },
                    },
                },
            ])
            .mockResolvedValue([]);
        mocks.readCredential.mockResolvedValue({
            description: 'Please endorse this credential',
            credentialSubject: {},
        });
    });

    it('fetches once when wallet hooks change function identity after rerender', async () => {
        const { rerender } = render(
            <EndorsementRequestModal credential={credential} shareLinkInfo={shareLinkInfo} />
        );

        await screen.findByText('Existing endorsement');
        expect(mocks.getSentCredentials).toHaveBeenCalledOnce();

        await act(async () => {
            rerender(
                <EndorsementRequestModal credential={credential} shareLinkInfo={shareLinkInfo} />
            );
        });

        expect(mocks.getSentCredentials).toHaveBeenCalledOnce();
    });
});
