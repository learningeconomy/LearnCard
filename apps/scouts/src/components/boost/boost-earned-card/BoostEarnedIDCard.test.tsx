// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const host = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    menu: vi.fn(),
}));

vi.mock('@learncard/react', () => ({ BoostGenericCard: () => null }));
vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { id: 'ID', membership: 'Membership' },
    BoostPageViewMode: { Card: 'Card' },
    CredentialListTabEnum: { Earned: 'Earned' },
    ModalTypes: { Center: 'Center', Cancel: 'Cancel' },
    categoryMetadata: {},
    useModal: () => ({ newModal: host.newModal, closeModal: host.closeModal }),
    useWallet: () => ({ initWallet: async () => ({}) }),
    useGetResolvedCredential: () => ({ isLoading: false, isFetching: false }),
    useGetCredentialWithEdits: () => ({}),
    useGetVCInfo: () => ({ issuerName: 'Issuer', issueeName: 'Scout', loading: false }),
    setIonicModalBackground: vi.fn(),
    ProfilePicture: () => null,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    isBoostCredential: (vc: VC) => vc.type.includes('BoostCredential'),
    unwrapBoostCredential: (vc: VC) => vc,
    getCredentialSubject: (vc: VC) => vc.credentialSubject,
    getDefaultCategoryForCredential: () => 'ID',
    getUrlFromImage: () => '',
    getImageUrlFromCredential: () => '',
    getCredentialName: (vc: VC) => vc.name,
}));
vi.mock('learn-card-base/helpers/credentials/ids', () => ({
    ID_CARD_DISPLAY_TYPES: { PermanentResidentCard: 'PermanentResidentCard' },
    getIDCardDisplayInputsFromVC: () => ({}),
}));
vi.mock('../../../pages/ids/IdDisplayContainer', () => ({
    default: ({ handlePreviewBoost }: { handlePreviewBoost: () => void }) => (
        <button onClick={handlePreviewBoost}>Open credential</button>
    ),
}));
vi.mock('../boostCMS/BoostPreview/BoostPreview', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('../../../pages/troop/ShareTroopIdModal', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/id/IDDisplayCard', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialSubjectDisplay/CredentialSubjectDisplay', () => ({
    default: () => null,
}));
vi.mock('../hooks/useBoostMenu', () => ({
    BoostMenuType: { earned: 'earned' },
    default: () => ({ handlePresentBoostMenuModal: host.menu }),
}));
vi.mock('../../../hooks/useGetTroopNetwork', () => ({ default: () => ({}) }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../i18n/formatters', () => ({ formatLocaleDate: () => 'October 19, 2026' }));

import BoostEarnedIDCard from './BoostEarnedIDCard';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boostCMS/BoostPreview/NonBoostPreview';
import ShareTroopIdModal from '../../../pages/troop/ShareTroopIdModal';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('earned ID full view routing', () => {
    it.each([
        { type: ['VerifiableCredential'], preview: NonBoostPreview },
        { type: ['VerifiableCredential', 'BoostCredential'], preview: BoostPreview },
    ])(
        'opens the current viewer for $type with share and options controls',
        async ({ type, preview }) => {
            const credential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type,
                issuer: 'did:example:issuer',
                credentialSubject: { id: 'did:example:scout' },
                name: 'Scout ID',
            } as VC;
            const uri = 'urn:credential:scout-id';
            render(
                <BoostEarnedIDCard
                    credential={credential}
                    uri={uri}
                    categoryType={'ID' as never}
                    defaultImg=""
                />
            );
            // Allow the wallet initialization effect to finish before opening the preview.
            await waitFor(() => expect(screen.getByRole('button')).toBeTruthy());
            fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

            const boundary = host.newModal.mock.calls[0][0];
            const view = boundary.props.children;
            expect(view.type).toBe(preview);
            expect(view.props.credential).toBe(credential);
            expect(view.props).toEqual(
                expect.objectContaining({
                    categoryType: 'ID',
                    issuerOverride: 'Issuer',
                    issueeOverride: 'Scout',
                    titleOverride: 'Scout ID',
                    handleCloseModal: host.closeModal,
                    onDotsClick: host.menu,
                })
            );

            view.props.onDotsClick();
            expect(host.menu).toHaveBeenCalledOnce();
            view.props.handleShareBoost();
            const share = host.newModal.mock.calls[1][0];
            expect(share.type).toBe(ShareTroopIdModal);
            expect(share.props).toEqual({ credential, uri });
            expect(share.props.credential).toBe(credential);
        }
    );
});
