// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    history: { push: vi.fn() },
}));
vi.mock('react-router-dom', () => ({ useHistory: () => mocks.history }));
vi.mock('learn-card-base', () => ({
    useCurrentUser: () => ({}),
    useGetProfile: () => ({ data: undefined }),
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    ModalTypes: { FullScreen: 'full', Cancel: 'cancel' },
}));
vi.mock('learn-card-base/components/profilePicture/ProfilePicture', () => ({
    default: () => null,
}));
vi.mock('../scouts/MyScoutsModal', () => ({ default: () => null }));
vi.mock('../qrcode-user-card/QRCodeUserCard', () => ({ default: () => null }));
vi.mock('../../paraglide/messages.js', () => ({ 'scanner.scanQR': () => 'Scan QR' }));

import QRCodeScannerButton from './QRCodeScannerButton';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

afterEach(cleanup);

describe('header QR card', () => {
    it('supplies the dismissal callback used to open the scanner after permission is granted', () => {
        render(<QRCodeScannerButton branding={BrandingEnum.scoutPass} />);
        fireEvent.click(screen.getAllByRole('button', { name: 'Scan QR' })[1]);
        const card = mocks.newModal.mock.calls[0][0];
        expect(card.props.history).toBe(mocks.history);
        expect(card.props.handleQRCodeCardModal).toBeTypeOf('function');
        card.props.handleQRCodeCardModal();
        expect(mocks.closeModal).toHaveBeenCalledOnce();
    });
});
