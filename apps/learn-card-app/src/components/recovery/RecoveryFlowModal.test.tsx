import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecoveryFlowModal } from './RecoveryFlowModal';

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    QrLoginRequester: () => <div>QrLoginRequester</div>,
    getSSSConfig: () => ({}),
}));

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
});
