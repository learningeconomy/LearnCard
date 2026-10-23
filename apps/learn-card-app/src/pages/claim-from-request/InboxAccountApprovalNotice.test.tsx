import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import InboxAccountApprovalNotice from './InboxAccountApprovalNotice';
import InboxGuardianPending from './InboxGuardianPending';

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModalById: vi.fn(),
    refetch: vi.fn(),
    currentLCNUser: { value: null as Record<string, unknown> | null },
    currentLCNUserLoading: { value: false },
    authStatus: { value: { tag: 'ready', profile: { tag: 'present' } } as Record<string, unknown> },
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { FullScreen: 'full-screen', Center: 'center', Cancel: 'cancel' },
    useModal: () => ({ newModal: mocks.newModal, closeModalById: mocks.closeModalById }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: mocks.currentLCNUser.value,
        currentLCNUserLoading: mocks.currentLCNUserLoading.value,
        refetch: mocks.refetch,
    }),
    useAuthStatus: () => mocks.authStatus.value,
}));

vi.mock('learn-card-base/auth-status/authStatus', () => ({
    hasNetworkProfile: (status: { tag?: string; profile?: { tag?: string } } | null) =>
        status?.tag === 'ready' && status?.profile?.tag === 'present',
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon }: { icon: string }) => <span data-testid={`ion-icon-${icon}`} />,
}));

vi.mock('ionicons/icons', () => ({
    shieldOutline: 'shield',
    alertCircleOutline: 'alert',
    closeCircleOutline: 'close',
    homeOutline: 'home',
    refreshOutline: 'refresh',
    timeOutline: 'time',
}));

vi.mock(
    '../../components/onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent',
    () => ({ default: () => <div data-testid="eu-parental-consent" /> })
);

vi.mock('../../paraglide/messages.js', () => ({
    'claim.accountApproval.title': () => 'Account approval needed',
    'claim.accountApproval.description': () =>
        'Your parent or guardian needs to approve your account.',
    'claim.accountApproval.request': () => 'Request Account Approval',
    'claim.pending.title': () => 'Waiting for guardian approval',
    'claim.pending.subtitle': () => 'Some credentials need a guardian to approve them.',
    'claim.pending.awaiting.one': ({ count }: { count: number }) =>
        `${count} credential is waiting for approval.`,
    'claim.pending.awaiting.other': ({ count }: { count: number }) =>
        `${count} credentials are waiting for approval.`,
    'claim.pending.awaitingHint': () => 'Check again soon.',
    'claim.pending.rejected.one': ({ count }: { count: number }) =>
        `${count} credential was declined by a guardian.`,
    'claim.pending.rejected.other': ({ count }: { count: number }) =>
        `${count} credentials were declined by a guardian.`,
    'claim.pending.checkAgain': () => 'Check again',
    'claim.pending.checking': () => 'Checking',
    'claim.pending.checkAgainError': () => 'Could not check for updates.',
    'claim.pending.goHome': () => 'Go to home',
}));

const unapprovedProfile = {
    displayName: 'Kid Learner',
    dob: '2014-05-01',
    country: 'US',
    approved: false,
};

describe('InboxAccountApprovalNotice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.newModal.mockReturnValue(42);
        mocks.currentLCNUser.value = unapprovedProfile;
        mocks.currentLCNUserLoading.value = false;
        mocks.authStatus.value = { tag: 'ready', profile: { tag: 'present' } };
    });

    it('shows the account approval notice for a resolved, unapproved profile', () => {
        render(<InboxAccountApprovalNotice />);

        expect(screen.getByText('Account approval needed')).toBeInTheDocument();
        expect(
            screen.getByText('Your parent or guardian needs to approve your account.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Request Account Approval' })).toBeEnabled();
    });

    it.each([
        [
            'an approved profile',
            { ...unapprovedProfile, approved: true },
            false,
            { tag: 'ready', profile: { tag: 'present' } },
        ],
        ['a missing profile', null, false, { tag: 'ready', profile: { tag: 'present' } }],
        [
            'a profile that is still loading',
            unapprovedProfile,
            true,
            { tag: 'ready', profile: { tag: 'loading' } },
        ],
        ['an errored profile fetch', null, false, { tag: 'ready', profile: { tag: 'error' } }],
        ['an unresolved auth state', unapprovedProfile, false, { tag: 'resolving' }],
    ])('hides the notice for %s', (_label, user, loading, authStatus) => {
        mocks.currentLCNUser.value = user as Record<string, unknown> | null;
        mocks.currentLCNUserLoading.value = loading as boolean;
        mocks.authStatus.value = authStatus as Record<string, unknown>;

        const { container } = render(<InboxAccountApprovalNotice />);

        expect(container).toBeEmptyDOMElement();
    });

    it('does not treat an unknown approved flag as unapproved', () => {
        mocks.currentLCNUser.value = { displayName: 'Unknown', dob: '', country: '' };

        const { container } = render(<InboxAccountApprovalNotice />);

        expect(container).toBeEmptyDOMElement();
    });

    it('presents the consent form through the modal stack and blocks duplicate requests', () => {
        render(<InboxAccountApprovalNotice />);

        fireEvent.click(screen.getByRole('button', { name: 'Request Account Approval' }));

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        const [element, , types] = mocks.newModal.mock.calls[0];
        expect(element.props).toMatchObject({
            name: 'Kid Learner',
            dob: '2014-05-01',
            country: 'US',
        });
        expect(typeof element.props.onClose).toBe('function');
        expect(typeof element.props.onComplete).toBe('function');
        expect(types).toEqual({ desktop: 'full-screen', mobile: 'full-screen' });

        expect(screen.getByRole('button', { name: 'Request Account Approval' })).toBeDisabled();
    });

    it('closes only its own modal and refetches without approving the account on completion', () => {
        render(<InboxAccountApprovalNotice />);
        fireEvent.click(screen.getByRole('button', { name: 'Request Account Approval' }));

        const element = mocks.newModal.mock.calls[0][0];
        act(() => element.props.onComplete());

        expect(mocks.closeModalById).toHaveBeenCalledTimes(1);
        expect(mocks.closeModalById).toHaveBeenCalledWith(42);
        expect(mocks.refetch).toHaveBeenCalledTimes(1);
        // A sent request is not an approval: the notice must remain until the
        // profile itself reports `approved`.
        expect(screen.getByText('Account approval needed')).toBeInTheDocument();
    });

    it('keeps the claim route/URL stable when opening the consent form', () => {
        window.history.replaceState({}, '', '/request?vc_request_url=inbox-claim-token');
        const pushState = vi.spyOn(window.history, 'pushState');
        const replaceState = vi.spyOn(window.history, 'replaceState');

        render(<InboxAccountApprovalNotice />);
        fireEvent.click(screen.getByRole('button', { name: 'Request Account Approval' }));

        expect(pushState).not.toHaveBeenCalled();
        expect(replaceState).not.toHaveBeenCalled();
        expect(window.location.search).toBe('?vc_request_url=inbox-claim-token');

        pushState.mockRestore();
        replaceState.mockRestore();
    });

    it('does not infer account approval from a pending credential outcome', () => {
        mocks.currentLCNUser.value = { ...unapprovedProfile, approved: true };

        render(
            <InboxGuardianPending
                outcomes={[{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }]}
                onGoHome={vi.fn()}
            />
        );

        expect(screen.getByText('Waiting for guardian approval')).toBeInTheDocument();
        expect(screen.queryByText('Account approval needed')).not.toBeInTheDocument();
    });

    it('keeps the pending credential state after the account modal is dismissed', () => {
        render(
            <InboxGuardianPending
                outcomes={[{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }]}
                onGoHome={vi.fn()}
            />
        );

        expect(screen.getByText('Waiting for guardian approval')).toBeInTheDocument();
        expect(screen.getByText('Account approval needed')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Request Account Approval' }));
        const element = mocks.newModal.mock.calls[0][0];
        act(() => element.props.onClose());

        expect(mocks.closeModalById).toHaveBeenCalledWith(42);
        expect(screen.getByText('Waiting for guardian approval')).toBeInTheDocument();
        expect(screen.getByText('1 credential is waiting for approval.')).toBeInTheDocument();
    });
});
