import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { closeModalMock, replaceModalMock } = vi.hoisted(() => ({
    closeModalMock: vi.fn(),
    replaceModalMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@ionic/react', () => ({
    IonSpinner: () => null,
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'passport.buildMyLearnCard.intake.title': () => 'Add something you received',
    'passport.buildMyLearnCard.intake.description': () => 'Choose an intake method.',
    'passport.buildMyLearnCard.intake.scanTitle': () => 'Scan QR Code',
    'passport.buildMyLearnCard.intake.scanDescription': () => 'Scan with your camera.',
    'passport.buildMyLearnCard.intake.uploadTitle': () => 'Upload QR Code',
    'passport.buildMyLearnCard.intake.uploadDescription': () => 'Upload a QR code image.',
    'passport.buildMyLearnCard.intake.linkTitle': () => 'Use a Claim Link',
    'passport.buildMyLearnCard.intake.linkDescription': () => 'Paste a claim link.',
}));

vi.mock('learn-card-base', () => ({
    QRCodeScannerStore: { set: { showScanner: vi.fn() } },
    useModal: () => ({
        closeModal: closeModalMock,
        replaceModal: replaceModalMock,
    }),
}));

vi.mock('../../svgs/SlimCaretRight', () => ({
    default: () => null,
}));

import CredentialIntakeOptions from './CredentialIntakeOptions';

describe('CredentialIntakeOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('replaces the checklist modal when opening QR upload', () => {
        render(<CredentialIntakeOptions />);

        fireEvent.click(screen.getByRole('button', { name: /upload qr code/i }));

        expect(replaceModalMock).toHaveBeenCalledOnce();
        expect(replaceModalMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ hideButton: true })
        );
        expect(closeModalMock).not.toHaveBeenCalled();
    });
});
