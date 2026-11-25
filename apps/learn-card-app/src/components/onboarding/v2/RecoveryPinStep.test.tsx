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

const { mockOpenPP, markup } = vi.hoisted(() => ({
    mockOpenPP: vi.fn(),
    markup: (type: 'markup-start' | 'markup-end') => ({
        type,
        name: '0',
        options: {},
        attributes: {},
    }),
}));
vi.mock('../../../helpers/externalLinkHelpers', () => ({ openPP: mockOpenPP }));

// Mock i18n messages
vi.mock('../../../paraglide/messages.js', () => ({
    'recovery.pin.escrowNotice': Object.assign(
        vi.fn(
            () =>
                'An encrypted piece of your account key is held by a secure service. Your PIN unlocks it right away, without a 7-day wait. Learn more'
        ),
        {
            parts: () => [
                {
                    type: 'text',
                    value: 'An encrypted piece of your account key is held by a secure service. Your PIN unlocks it right away, without a 7-day wait. ',
                },
                markup('markup-start'),
                { type: 'text', value: 'Learn more' },
                markup('markup-end'),
            ],
        }
    ),
    'onboarding.v2.pin.title': vi.fn(() => 'Create your PIN'),
    'onboarding.v2.pin.body': vi.fn(() => "You'll use it to sign in on new devices."),
    'onboarding.v2.pin.confirmTitle': vi.fn(() => 'Confirm your PIN'),
    'onboarding.v2.pin.confirmBody': vi.fn(() => 'Enter the same 6 digits again.'),
    'onboarding.v2.pin.saving': vi.fn(() => 'Saving your PIN…'),
    'onboarding.v2.pin.success': vi.fn(() => "You're protected"),
    'onboarding.v2.pin.skip': vi.fn(() => 'Skip for now'),
    'onboarding.v2.pin.startOver': vi.fn(() => 'Start over'),
    'onboarding.v2.pin.saveFailedSkip': vi.fn(
        () => "Couldn't save your PIN. Try again, or skip for now and set it up later."
    ),
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

    const renderComponent = (saveTimeoutMs?: number) => {
        return render(
            <RecoveryPinStep
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
                setPin={mockSetPin}
                saveTimeoutMs={saveTimeoutMs}
            />
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

    it('renders the required step without a skip', () => {
        renderComponent();
        expect(screen.getByText('Create your PIN')).toBeInTheDocument();
        expect(screen.getByText("You'll use it to sign in on new devices.")).toBeInTheDocument();
        expect(
            screen.getByText('You can change or remove it anytime in Settings.')
        ).toBeInTheDocument();
        expect(screen.queryByText('Skip for now')).not.toBeInTheDocument();
    });

    it('explains escrow on the enter step and opens the privacy policy', () => {
        renderComponent();
        expect(
            screen.getByText(/An encrypted piece of your account key is held by a secure service/)
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Learn more' }));
        expect(mockOpenPP).toHaveBeenCalledOnce();
    });

    it('drops the escrow notice once the PIN is being confirmed', () => {
        renderComponent();
        enterPin('147258');
        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
        expect(screen.queryByText(/encrypted piece of your account key/)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Learn more' })).not.toBeInTheDocument();
    });

    it('does not offer a skip for typing mistakes', () => {
        renderComponent();
        enterPin('123456');
        expect(screen.getByText('PIN is too easy to guess.')).toBeInTheDocument();
        enterPin('147258');
        enterPin('147259');
        expect(screen.getByText('PINs do not match.')).toBeInTheDocument();
        expect(screen.queryByText('Skip for now')).not.toBeInTheDocument();
    });

    it('lets the user retry after one failed save, then offers a skip after the second', async () => {
        mockSetPin.mockRejectedValue(new Error('enclave unavailable'));
        renderComponent();

        enterPin('147258');
        enterPin('147258');
        expect(await screen.findByText('Failed to save PIN.')).toBeInTheDocument();
        // First error: retry only.
        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
        expect(screen.queryByText('Skip for now')).not.toBeInTheDocument();

        enterPin('147258');
        await waitFor(() => expect(mockSetPin).toHaveBeenCalledTimes(2));
        expect(await screen.findByText('Skip for now')).toBeInTheDocument();
        // The announced error now says the skip exists.
        expect(screen.getByRole('alert')).toHaveTextContent(
            "Couldn't save your PIN. Try again, or skip for now and set it up later."
        );

        // The skip stays available after starting over.
        fireEvent.click(screen.getByText('Start over'));
        fireEvent.click(screen.getByText('Skip for now'));
        expect(mockOnSkip).toHaveBeenCalledOnce();
        expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('announces a failed save and puts focus back on the PIN boxes', async () => {
        mockSetPin.mockRejectedValue(new Error('enclave unavailable'));
        renderComponent();

        enterPin('147258');
        enterPin('147258');
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('Failed to save PIN.')
        );
        expect(screen.getByLabelText('PIN digit 1')).toHaveFocus();
    });

    it('can still succeed on a retry after a failed save', async () => {
        mockSetPin.mockRejectedValueOnce(new Error('flaky')).mockResolvedValueOnce(undefined);
        renderComponent();

        enterPin('147258');
        enterPin('147258');
        expect(await screen.findByText('Failed to save PIN.')).toBeInTheDocument();
        enterPin('147258');

        await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2000 });
        expect(mockOnSkip).not.toHaveBeenCalled();
    });

    it('treats a hung save as a failure so the user is never stuck', async () => {
        mockSetPin.mockImplementation(() => new Promise<void>(() => undefined));
        renderComponent(20);

        enterPin('147258');
        enterPin('147258');
        expect(screen.getByText('Saving your PIN…')).toBeInTheDocument();
        expect(await screen.findByText('Failed to save PIN.')).toBeInTheDocument();
        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

        enterPin('147258');
        expect(await screen.findByText('Skip for now')).toBeInTheDocument();
    });

    it('shows error for trivial PIN and stays on enter step', () => {
        renderComponent();
        enterPin('123456');

        expect(screen.getByText('PIN is too easy to guess.')).toBeInTheDocument();
        expect(screen.getByText('Create your PIN')).toBeInTheDocument();
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
        expect(screen.getByText('Create your PIN')).toBeInTheDocument();
    });

    it('completes successfully with matching PINs', async () => {
        renderComponent();

        // Enter PIN
        enterPin('147258');

        // Confirm PIN
        enterPin('147258');

        // Should show saving state
        expect(screen.getByText('Saving your PIN…')).toBeInTheDocument();
        await waitFor(() => expect(mockSetPin).toHaveBeenCalledWith('147258'));

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
