// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let feedbackMessage: string | undefined;
    let feedbackTone: 'success' | 'error' = 'success';

    return {
        closeScanner: vi.fn(),
        getFeedbackMessage: () => feedbackMessage,
        getFeedbackTone: () => feedbackTone,
        setFeedback: (message?: string, tone: 'success' | 'error' = 'success') => {
            feedbackMessage = message;
            feedbackTone = tone;
        },
    };
});

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className, icon }: { className?: string; icon?: string }) => (
        <span className={className} data-icon={icon} />
    ),
}));
vi.mock('ionicons/icons', () => ({
    alertCircleOutline: 'alert-circle',
    checkmarkCircleOutline: 'checkmark-circle',
    closeOutline: 'close',
}));
vi.mock('learn-card-base/stores/QRCodeScannerStore', () => ({
    default: {
        useTracked: {
            feedbackMessage: mocks.getFeedbackMessage,
            feedbackTone: mocks.getFeedbackTone,
        },
        set: { closeScanner: mocks.closeScanner },
    },
}));

import QRCodeScannerOverlay from './QRCodeScannerOverlay';

describe('QRCodeScannerOverlay', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setFeedback();
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

        mocks.setFeedback('Found @alex');
        rerender(<QRCodeScannerOverlay searchingLabel="Looking for QR code…" />);

        expect(screen.getByRole('status').textContent).toContain('Found @alex');
        expect(
            screen.getByRole('status').querySelector('[data-icon]')?.getAttribute('data-icon')
        ).toBe('checkmark-circle');
        expect(container.querySelector('.qr-code-scanner-line')).toBeNull();
    });

    it('shows self-scan feedback as an error and hides the automatic-add helper', () => {
        const { rerender } = render(
            <QRCodeScannerOverlay
                searchingLabel="Looking for QR code…"
                helperLabel="The recipient will be added automatically"
            />
        );

        mocks.setFeedback("You can't add yourself as a recipient.", 'error');
        rerender(
            <QRCodeScannerOverlay
                searchingLabel="Looking for QR code…"
                helperLabel="The recipient will be added automatically"
            />
        );

        const status = screen.getByRole('status');
        expect(status.textContent).toContain("You can't add yourself as a recipient.");
        expect(status.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe('alert-circle');
        expect(screen.queryByText('The recipient will be added automatically')).toBeNull();
    });
});
