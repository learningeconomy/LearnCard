// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', async () => {
    const { Overlay } = await import('learn-card-base/auth-coordinator/components/Overlay');

    return {
        Overlay,
        getLogger: () => ({ error: vi.fn() }),
        QrLoginRequester: () => <div>QrLoginRequester</div>,
        getSSSConfig: () => ({ serverUrl: 'https://example.com' }),
    };
});

import { RecoveryFlowModal } from './RecoveryFlowModal';

describe('RecoveryFlowModal', () => {
    const defaultProps = {
        availableMethods: [],
        onRecoverWithPasskey: vi.fn(),
        onRecoverWithPhrase: vi.fn(),
        onRecoverWithBackup: vi.fn(),
        onCancel: vi.fn(),
    };

    it('renders identity enter_email phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="enter_email" />);
        expect(screen.getByRole('heading', { name: /Restore Your Account/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Recovery Code/i })).toBeInTheDocument();
    });

    it('renders identity verify_email phase', () => {
        render(
            <RecoveryFlowModal
                {...defaultProps}
                identityPhase="verify_email"
                identityEmail="test@example.com"
            />
        );
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Verify Code/i })).toBeInTheDocument();
    });

    it('renders identity new_login phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="new_login" />);
        expect(screen.getByRole('heading', { name: /Account Verified/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    });

    it('renders identity success phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="success" />);
        expect(screen.getByRole('heading', { name: /Access Restored/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
    });

    it('shows a friendly error and enables retry and Back after an invalid lost-login phrase', async () => {
        const recover = vi.fn().mockRejectedValue(new Error('Invalid recovery phrase'));
        render(
            <RecoveryFlowModal
                {...defaultProps}
                identityPhase="choose_method"
                availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
                onRecoverWithPhrase={recover}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));
        const invalidPhrase = Array(25).fill('invalid').join(' ');
        fireEvent.change(screen.getByRole('textbox'), { target: { value: invalidPhrase } });
        fireEvent.click(screen.getByRole('button', { name: 'Recover Account' }));

        expect(await screen.findByText(/Please check for typos/)).toBeInTheDocument();
        expect(recover).toHaveBeenCalledWith(invalidPhrase);
        expect(screen.getByRole('button', { name: 'Recover Account' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByRole('button', { name: /phrase/i })).toBeEnabled();
    });
});

const renderModal = (
    onCancel: () => void,
    onRecoverWithPhrase = vi.fn().mockResolvedValue(undefined)
): void => {
    render(
        <RecoveryFlowModal
            availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
            onRecoverWithPasskey={vi.fn().mockResolvedValue(undefined)}
            onRecoverWithPhrase={onRecoverWithPhrase}
            onRecoverWithBackup={vi.fn().mockResolvedValue(undefined)}
            onCancel={onCancel}
        />
    );
};

describe('RecoveryFlowModal keyboard behavior', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 1)
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps Back and Escape unavailable while recovery is pending', () => {
        const onCancel = vi.fn();
        const recover = vi.fn(() => new Promise<void>(() => {}));
        renderModal(onCancel, recover);
        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: Array(25).fill('word').join(' ') },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Recover Account' }));
        expect(recover).toHaveBeenCalledOnce();
        const back = screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement;
        expect(back.disabled).toBe(true);
        fireEvent.click(back);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('returns to the method picker before cancelling recovery on Escape', () => {
        const onCancel = vi.fn();
        renderModal(onCancel);

        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));

        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(onCancel).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();
    });
});
