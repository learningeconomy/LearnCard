import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuardianApprovalRequestStatus } from '@learncard/types';

import EUParentalConsentModalContent from './EUParentalConsentModalContent';
import * as m from '../../../../paraglide/messages.js';

const mocks = vi.hoisted(() => ({
    status: undefined as GuardianApprovalRequestStatus | undefined,
    send: vi.fn(),
    refetch: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));
vi.mock('../../../../i18n', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../../i18n')>()),
    useLocale: () => 'en',
}));
vi.mock('../../../../hooks/useGuardianApprovalStatus', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../../hooks/useGuardianApprovalStatus')>()),
    useGuardianApprovalStatus: () => ({ data: mocks.status, refetch: mocks.refetch }),
    useSendGuardianApprovalEmail: () => ({ mutateAsync: mocks.send }),
}));

const trpcError = (code: string) => Object.assign(new Error(code), { data: { code } });

const emailInput = () => screen.getByLabelText(m['onboarding.consent.eu.placeholder']());

const renderModal = () =>
    render(<EUParentalConsentModalContent onClose={vi.fn()} onComplete={vi.fn()} />);

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = undefined;
    mocks.send.mockResolvedValue({ message: 'ok', status: 'accepted' });
});

describe('EUParentalConsentModalContent (LC-2261)', () => {
    it('leaves the email empty and shows a failed send with a resend action', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'failed',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
        };

        renderModal();

        expect(emailInput()).toHaveValue('');
        expect(screen.getByRole('status')).toHaveTextContent(
            /couldn't send the approval request to guardian@example\.com/
        );
        expect(
            screen.getByRole('button', { name: m['onboarding.consent.eu.resendRequest']() })
        ).toBeEnabled();
    });

    it('sends to a corrected address and reports that the request was sent', async () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'wrong@example.com',
            attemptsRemaining: 4,
        };

        renderModal();
        fireEvent.change(emailInput(), { target: { value: 'right@example.com' } });
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.resendRequest']() })
        );

        await waitFor(() => expect(mocks.send).toHaveBeenCalledWith('right@example.com'));
        const confirmation = await screen.findByText(/right@example\.com/);
        expect(confirmation.closest('[role="status"]')).toHaveTextContent(
            /was sent to right@example\.com.*check their spam folder/
        );
    });

    it('keeps the form and shows an error when the send fails', async () => {
        mocks.send.mockRejectedValue(trpcError('INTERNAL_SERVER_ERROR'));

        renderModal();
        fireEvent.change(emailInput(), { target: { value: 'guardian@example.com' } });
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.sendRequest']() })
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            m['onboarding.consent.eu.error.sendFailed']()
        );
        expect(emailInput()).toHaveValue('guardian@example.com');
    });

    it('explains an in-progress send instead of a generic failure', async () => {
        mocks.send.mockRejectedValue(trpcError('CONFLICT'));

        renderModal();
        fireEvent.change(emailInput(), { target: { value: 'guardian@example.com' } });
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.sendRequest']() })
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            m['onboarding.consent.eu.error.inProgress']()
        );
    });

    it('shows when a rate-limited learner can try again', async () => {
        const resendAvailableAt = new Date(Date.now() + 60_000).toISOString();
        mocks.send.mockRejectedValue(trpcError('TOO_MANY_REQUESTS'));
        mocks.refetch.mockResolvedValue({
            data: {
                pendingApproval: true,
                status: 'accepted',
                attemptsRemaining: 0,
                resendAvailableAt,
            },
        });

        renderModal();
        fireEvent.change(emailInput(), { target: { value: 'guardian@example.com' } });
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.sendRequest']() })
        );

        await waitFor(() => expect(mocks.refetch).toHaveBeenCalled());
        expect(await screen.findByRole('alert')).toHaveTextContent(
            /You can send another request at/
        );
    });

    it('disables resending to the same address during the cooldown but allows a correction', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
            resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
        };

        renderModal();
        const resend = screen.getByRole('button', {
            name: m['onboarding.consent.eu.resendRequest'](),
        });

        fireEvent.change(emailInput(), { target: { value: 'Guardian@example.com' } });
        expect(resend).toBeDisabled();
        expect(screen.getByText(/You can send another request at/)).toBeInTheDocument();

        fireEvent.change(emailInput(), { target: { value: 'other@example.com' } });
        expect(resend).toBeEnabled();
    });

    it.each(['guardian', 'guardian@', '@example.com', 'guardian@example', 'guard ian@example.com'])(
        'rejects the malformed address %j without sending',
        async invalidEmail => {
            renderModal();
            fireEvent.change(emailInput(), { target: { value: invalidEmail } });
            fireEvent.click(
                screen.getByRole('button', { name: m['onboarding.consent.eu.sendRequest']() })
            );

            expect(await screen.findByRole('alert')).toHaveTextContent(
                m['onboarding.consent.eu.error.invalidEmail']()
            );
            expect(mocks.send).not.toHaveBeenCalled();
            expect(emailInput()).toHaveValue(invalidEmail);
        }
    );

    it('resends to the same address after a previously accepted request', async () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
        };

        renderModal();
        fireEvent.change(emailInput(), { target: { value: 'guardian@example.com' } });
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.resendRequest']() })
        );

        await waitFor(() => expect(mocks.send).toHaveBeenCalledWith('guardian@example.com'));
    });

    it('closes once the guardian has approved the account', () => {
        mocks.status = { pendingApproval: false, status: 'not_requested', attemptsRemaining: 5 };
        const onClose = vi.fn();

        const { rerender } = render(<EUParentalConsentModalContent onClose={onClose} />);
        rerender(<EUParentalConsentModalContent onClose={onClose} />);

        expect(onClose).toHaveBeenCalledOnce();
    });
});
