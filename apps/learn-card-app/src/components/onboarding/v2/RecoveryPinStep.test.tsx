import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecoveryPinStep } from './RecoveryPinStep';
import * as m from '../../../paraglide/messages.js';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Lock: () => <div data-testid="lock-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
    CheckCircle2: () => <div data-testid="check-icon" />,
}));

// Mock sss-key-manager
vi.mock('@learncard/sss-key-manager', () => ({
    validatePin: vi.fn((pin: string) => {
        // Simple mock: reject '123456' as trivial
        if (pin === '123456') return { ok: false };
        return { ok: true };
    }),
}));

// Mock i18n messages
vi.mock('../../../paraglide/messages.js', () => ({
    'onboarding.v2.pin.title': vi.fn(() => 'Add a recovery PIN'),
    'onboarding.v2.pin.body': vi.fn(
        () => 'If you ever lose this device, a 6-digit PIN gets you back in within seconds.'
    ),
    'onboarding.v2.pin.confirmTitle': vi.fn(() => 'Confirm your PIN'),
    'onboarding.v2.pin.confirmBody': vi.fn(() => 'Enter the same 6 digits again.'),
    'onboarding.v2.pin.saving': vi.fn(() => 'Saving your PIN…'),
    'onboarding.v2.pin.success': vi.fn(() => "You're protected"),
    'onboarding.v2.pin.skip': vi.fn(() => 'Skip for now'),
    'onboarding.v2.pin.startOver': vi.fn(() => 'Start over'),
    'onboarding.v2.pin.hint': vi.fn(() => 'You can change or remove it anytime in Settings.'),
    'recovery.pin.trivial': vi.fn(() => 'PIN is too easy to guess.'),
    'recovery.pin.mismatch': vi.fn(() => 'PINs do not match.'),
    'recovery.pin.saveFailed': vi.fn(() => 'Failed to save PIN.'),
}));

describe('RecoveryPinStep', () => {
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();
    const mockSetPin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetPin.mockResolvedValue(undefined);
    });

    const renderComponent = () => {
        return render(
            <RecoveryPinStep onComplete={mockOnComplete} onSkip={mockOnSkip} setPin={mockSetPin} />
        );
    };

    const enterPin = (pin: string) => {
        const inputs = Array.from({ length: 6 }).map((_, i) =>
            screen.getByLabelText(`PIN digit ${i + 1}`)
        );
        pin.split('').forEach((char, index) => {
            if (inputs[index]) {
                fireEvent.change(inputs[index], { target: { value: char } });
            }
        });
    };

    it('renders initial enter state', () => {
        renderComponent();
        expect(screen.getByText('Add a recovery PIN')).toBeInTheDocument();
        expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });

    it('calls onSkip when skip button is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Skip for now'));
        expect(mockOnSkip).toHaveBeenCalled();
    });

    it('shows error for trivial PIN and stays on enter step', () => {
        renderComponent();
        enterPin('123456');

        expect(screen.getByText('PIN is too easy to guess.')).toBeInTheDocument();
        expect(screen.getByText('Add a recovery PIN')).toBeInTheDocument();
    });

    it('progresses to confirm step with valid PIN', () => {
        renderComponent();
        enterPin('147258');

        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
        expect(screen.getByText('Start over')).toBeInTheDocument();
    });

    it('shows error for mismatched PIN and stays on confirm step', () => {
        renderComponent();
        enterPin('147258');

        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

        enterPin('147259');
        expect(screen.getByText('PINs do not match.')).toBeInTheDocument();
        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
    });

    it('allows starting over from confirm step', () => {
        renderComponent();
        enterPin('147258');

        fireEvent.click(screen.getByText('Start over'));
        expect(screen.getByText('Add a recovery PIN')).toBeInTheDocument();
    });

    it('completes successfully with matching PINs', async () => {
        renderComponent();

        // Enter PIN
        enterPin('147258');

        // Confirm PIN
        enterPin('147258');

        // Should show saving state
        expect(screen.getByText('Saving your PIN…')).toBeInTheDocument();
        expect(mockSetPin).toHaveBeenCalledWith('147258');

        // Wait for setPin to resolve
        await waitFor(() => {
            expect(screen.getByText("You're protected")).toBeInTheDocument();
        });

        // Wait for auto-advance
        await waitFor(
            () => {
                expect(mockOnComplete).toHaveBeenCalled();
            },
            { timeout: 2000 }
        );
    });

    it('shows error and returns to confirm if save fails', async () => {
        mockSetPin.mockRejectedValueOnce(new Error('Save failed'));
        renderComponent();

        enterPin('147258');
        enterPin('147258');

        await waitFor(
            () => {
                expect(screen.getByText('Failed to save PIN.')).toBeInTheDocument();
            },
            { timeout: 2000 }
        );

        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
    });
});
