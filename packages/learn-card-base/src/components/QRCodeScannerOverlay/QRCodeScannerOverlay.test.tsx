// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let feedbackMessage: string | undefined;

    return {
        closeScanner: vi.fn(),
        getFeedbackMessage: () => feedbackMessage,
        setFeedbackMessage: (message?: string) => {
            feedbackMessage = message;
        },
    };
});

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));
vi.mock('ionicons/icons', () => ({
    checkmarkCircleOutline: 'checkmark-circle',
    closeOutline: 'close',
}));
vi.mock('learn-card-base/stores/QRCodeScannerStore', () => ({
    default: {
        useTracked: { feedbackMessage: mocks.getFeedbackMessage },
        set: { closeScanner: mocks.closeScanner },
    },
}));

import QRCodeScannerOverlay from './QRCodeScannerOverlay';

describe('QRCodeScannerOverlay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setFeedbackMessage();
    });

    it('renders the focused recipient scanner UI and accessible close control', () => {
        const { container } = render(
            <QRCodeScannerOverlay
                title="Scan their LearnCard QR"
                description="Point your camera at their profile QR code"
                frameLabel="Place QR inside frame"
                searchingLabel="Looking for QR code…"
                helperLabel="The recipient will be added automatically"
                closeLabel="Close scanner"
            />
        );

        expect(screen.getByRole('heading', { name: 'Scan their LearnCard QR' })).toBeTruthy();
        expect(screen.getByText('Point your camera at their profile QR code')).toBeTruthy();
        expect(screen.getAllByText('Place QR inside frame')).toHaveLength(1);
        expect(screen.getByRole('status').textContent).toContain('Looking for QR code…');
        expect(screen.getByText('The recipient will be added automatically')).toBeTruthy();
        expect(container.querySelector('.qr-code-scanner-line')).toBeTruthy();
        expect(screen.queryByText('Cancel')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Close scanner' }));
        expect(mocks.closeScanner).toHaveBeenCalledOnce();
    });

    it('replaces the searching status with one-shot success feedback', () => {
        const { container, rerender } = render(
            <QRCodeScannerOverlay searchingLabel="Looking for QR code…" />
        );

        mocks.setFeedbackMessage('Found @alex');
        rerender(<QRCodeScannerOverlay searchingLabel="Looking for QR code…" />);

        expect(screen.getByRole('status').textContent).toContain('Found @alex');
        expect(container.querySelector('.qr-code-scanner-line')).toBeNull();
    });
});
