import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InboxClaimProfileGate } from './InboxClaimProfileGate';

const mocks = vi.hoisted(() => ({
    useAuthStatus: vi.fn(),
    refetch: vi.fn(),
    newModal: vi.fn(),
    setLcnRedirect: vi.fn(),
    setIsOnboardingOpen: vi.fn(),
    isOnboardingOpen: vi.fn(() => false),
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'fullscreen' },
    redirectStore: {
        set: {
            lcnRedirect: mocks.setLcnRedirect,
            isOnboardingOpen: mocks.setIsOnboardingOpen,
        },
        get: { isOnboardingOpen: mocks.isOnboardingOpen },
    },
    useAuthStatus: mocks.useAuthStatus,
    useGetProfile: () => ({ refetch: mocks.refetch, isFetching: false }),
    useModal: () => ({ newModal: mocks.newModal }),
}));

vi.mock('../../components/onboarding/v2/OnboardingFlow', () => ({
    default: () => <div>Onboarding flow</div>,
}));

vi.mock('./ExchangeLoading', () => ({
    default: () => <div>Exchange loading</div>,
}));

const exchangeUrl = 'https://network.learncard.com/api/workflows/inbox-claim/exchanges/token';

const ready = (profile: 'loading' | 'error' | 'absent' | 'unconfirmed' | 'present') =>
    ({ tag: 'ready', profile: { tag: profile } }) as const;

const renderGate = () =>
    render(
        <MemoryRouter>
            <InboxClaimProfileGate vc_request_url={exchangeUrl} />
        </MemoryRouter>
    );

describe('InboxClaimProfileGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isOnboardingOpen.mockReturnValue(false);
    });

    it('starts onboarding and preserves the claim link when the profile is confirmed absent', () => {
        mocks.useAuthStatus.mockReturnValue(ready('absent'));

        renderGate();

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(mocks.setIsOnboardingOpen).toHaveBeenCalledWith(true);
        expect(mocks.setLcnRedirect).toHaveBeenCalledWith(
            `/request?vc_request_url=${encodeURIComponent(exchangeUrl)}`
        );
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('does not stack a second onboarding modal on re-render', () => {
        mocks.useAuthStatus.mockReturnValue(ready('absent'));

        const { rerender } = renderGate();
        rerender(
            <MemoryRouter>
                <InboxClaimProfileGate vc_request_url={exchangeUrl} />
            </MemoryRouter>
        );

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('never opens a competing modal when onboarding is already open', () => {
        mocks.useAuthStatus.mockReturnValue(ready('absent'));
        mocks.isOnboardingOpen.mockReturnValue(true);

        renderGate();

        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('does not re-open onboarding after it is dismissed, avoiding a prompt loop', () => {
        mocks.useAuthStatus.mockReturnValue(ready('absent'));
        mocks.isOnboardingOpen.mockReturnValue(true);

        const { rerender } = renderGate();
        expect(mocks.newModal).not.toHaveBeenCalled();

        // The user cancels the onboarding that another surface opened.
        mocks.isOnboardingOpen.mockReturnValue(false);
        rerender(
            <MemoryRouter>
                <InboxClaimProfileGate vc_request_url={exchangeUrl} />
            </MemoryRouter>
        );

        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('waits without concluding "no profile" while the profile query is loading', () => {
        mocks.useAuthStatus.mockReturnValue(ready('loading'));

        renderGate();

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.setLcnRedirect).not.toHaveBeenCalled();
    });

    it('waits without concluding "no profile" while offline/unconfirmed', () => {
        mocks.useAuthStatus.mockReturnValue(ready('unconfirmed'));

        renderGate();

        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('shows a retry instead of onboarding when the profile query errored', () => {
        mocks.useAuthStatus.mockReturnValue(ready('error'));

        renderGate();

        expect(mocks.newModal).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));
        expect(mocks.refetch).toHaveBeenCalled();
    });

    it('lets a user resume onboarding after dismissing it', () => {
        mocks.useAuthStatus.mockReturnValue(ready('absent'));
        renderGate();
        mocks.isOnboardingOpen.mockReturnValue(false);
        fireEvent.click(screen.getByRole('button', { name: /continue account setup/i }));
        expect(mocks.newModal).toHaveBeenCalledTimes(2);
    });

    it('does not prompt onboarding when a profile is present', () => {
        mocks.useAuthStatus.mockReturnValue(ready('present'));

        renderGate();

        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.setLcnRedirect).not.toHaveBeenCalled();
    });

    it('does not prompt onboarding for an unauthenticated visitor', () => {
        mocks.useAuthStatus.mockReturnValue({ tag: 'unauthenticated' });

        renderGate();

        expect(mocks.newModal).not.toHaveBeenCalled();
    });
});
