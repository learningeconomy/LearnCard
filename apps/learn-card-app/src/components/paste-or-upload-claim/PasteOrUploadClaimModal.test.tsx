import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { closeModalMock, routeMock } = vi.hoisted(() => ({
    closeModalMock: vi.fn(),
    routeMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@ionic/react', () => ({
    IonFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
    IonHeader: ({ children }: React.PropsWithChildren) => <header>{children}</header>,
    IonToolbar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('qr-scanner', () => ({
    default: { scanImage: vi.fn() },
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'full-screen' },
    ToastTypeEnum: { Error: 'error' },
    useModal: () => ({
        closeModal: closeModalMock,
        replaceModal: vi.fn(),
    }),
    useToast: () => ({ presentToast: vi.fn() }),
}));

vi.mock('learn-card-base/hooks/useSafeArea', () => ({
    useSafeArea: () => ({ bottom: 0 }),
}));

vi.mock('learn-card-base/svgs/LinkChain', () => ({
    default: () => null,
}));

vi.mock('../../hooks/useClaimInputRouter', () => ({
    useClaimInputRouter: () => routeMock,
}));

vi.mock('../../pages/claimBoost/ClaimBoost', () => ({
    default: () => null,
}));

vi.mock('../../pages/addressBook/addContactView/AddContactView', () => ({
    AddContactViewMode: { requestConnection: 'requestConnection' },
    default: () => null,
}));

vi.mock('../../paraglide/messages.js', () => ({
    'claim.paste.title': () => 'Use a Claim Link',
    'claim.paste.titleQr': () => 'Upload a QR Code',
    'claim.paste.subtitle': () => 'Paste a link or upload a QR',
    'claim.paste.subtitleLink': () => 'Paste a claim link',
    'claim.paste.subtitleQr': () => 'Upload a QR code',
    'claim.paste.linkHeading': () => 'Got a credential link?',
    'claim.paste.linkDesc': () => 'Paste it below to continue.',
    'claim.paste.checking': () => 'Checking…',
    'claim.redirect.heading': () => 'Redirect required',
    'claim.redirect.description': () => 'Complete a step on an external website.',
    'common.continue': () => 'Continue',
    'common.back': () => 'Back',
}));

import PasteOrUploadClaimModal from './PasteOrUploadClaimModal';

describe('PasteOrUploadClaimModal website continuation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        routeMock.mockResolvedValue({
            kind: 'open_website',
            url: 'https://issuer.example/continue',
        });
    });

    it('keeps the modal open until the user clicks the external website link', async () => {
        render(<PasteOrUploadClaimModal mode="claim-link" />);

        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'https://issuer.example/interaction' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        const websiteLink = await screen.findByRole('link', { name: 'Continue' });

        expect(routeMock).toHaveBeenCalledWith('https://issuer.example/interaction', 'paste');
        expect(closeModalMock).not.toHaveBeenCalled();
        expect(websiteLink).toHaveAttribute('href', 'https://issuer.example/continue');
        expect(websiteLink).toHaveAttribute('target', '_blank');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        fireEvent.click(websiteLink);

        expect(closeModalMock).toHaveBeenCalledOnce();
    });
});
