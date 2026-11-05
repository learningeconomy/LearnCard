import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuardianApprovalRequestStatus } from '@learncard/types';

import PendingApprovalBanner from './PendingApprovalBanner';
import * as m from '../../paraglide/messages.js';

const mocks = vi.hoisted(() => ({
    status: undefined as GuardianApprovalRequestStatus | undefined,
    newModal: vi.fn(),
    refetchProfile: vi.fn(),
    statusOptions: undefined as { refetchInterval?: number } | undefined,
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'FullScreen' },
    useModal: () => ({ newModal: mocks.newModal, closeModal: vi.fn() }),
    useGetCurrentLCNUser: () => ({ refetch: mocks.refetchProfile }),
}));
vi.mock('../../hooks/useGuardianApprovalStatus', () => ({
    useGuardianApprovalStatus: (_enabled: boolean, options?: { refetchInterval?: number }) => {
        mocks.statusOptions = options;
        return { data: mocks.status };
    },
}));
vi.mock('../onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent', () => ({
    default: () => null,
}));

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = undefined;
});

describe('PendingApprovalBanner (LC-2261)', () => {
    it('does not claim an email was sent when the send failed', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'failed',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
        };

        render(<PendingApprovalBanner />);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(
            /couldn't send the approval request to guardian@example\.com/
        );
        expect(status).not.toHaveTextContent(/We've emailed/);
    });

    it('reports an unknown outcome for accounts without send history', () => {
        mocks.status = { pendingApproval: true, status: 'unknown', attemptsRemaining: 5 };

        render(<PendingApprovalBanner />);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(m['onboarding.consent.eu.status.unknown']());
        expect(status).not.toHaveTextContent(/We've emailed|was sent to| at \./);
    });

    it('flags an expired approval link', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'guardian@example.com',
            linkExpiresAt: new Date(Date.now() - 1000).toISOString(),
            attemptsRemaining: 5,
        };

        render(<PendingApprovalBanner />);

        expect(screen.getByRole('status')).toHaveTextContent(/has expired/);
    });

    it('opens the existing consent modal to resend or correct the email', () => {
        render(<PendingApprovalBanner />);

        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.banner.manage']() })
        );

        expect(mocks.newModal).toHaveBeenCalledOnce();
    });

    it('still offers resend when the previous email was accepted', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
        };

        render(<PendingApprovalBanner />);

        expect(screen.getByRole('status')).toHaveTextContent(/was sent to guardian@example\.com/);
        fireEvent.click(
            screen.getByRole('button', { name: m['onboarding.consent.eu.banner.manage']() })
        );
        expect(mocks.newModal).toHaveBeenCalledOnce();
    });

    it('polls so a guardian approval is noticed without a reload', () => {
        render(<PendingApprovalBanner />);

        expect(mocks.statusOptions?.refetchInterval).toBeGreaterThan(0);
    });

    it('removes itself and its resend controls once the guardian approves', () => {
        mocks.status = {
            pendingApproval: true,
            status: 'accepted',
            guardianEmail: 'guardian@example.com',
            attemptsRemaining: 4,
        };
        const { rerender } = render(<PendingApprovalBanner />);
        expect(screen.getByTestId('pending-guardian-approval-banner')).toBeInTheDocument();
        expect(mocks.refetchProfile).not.toHaveBeenCalled();

        mocks.status = { pendingApproval: false, status: 'not_requested', attemptsRemaining: 5 };
        rerender(<PendingApprovalBanner />);

        expect(screen.queryByTestId('pending-guardian-approval-banner')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: m['onboarding.consent.eu.banner.manage']() })
        ).not.toBeInTheDocument();
        expect(mocks.refetchProfile).toHaveBeenCalledOnce();
    });
});
