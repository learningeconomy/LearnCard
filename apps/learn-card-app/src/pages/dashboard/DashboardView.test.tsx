import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DashboardView from './DashboardView';
import type { DashboardViewModel } from './DashboardView.types';
import { DASHBOARD_PERSONAS } from './dashboard.personas';
import * as m from '../../paraglide/messages.js';

// Keep the real DashboardView and translations; isolate unrelated dashboard cards.
vi.mock('learn-card-base/svgs/QRCodeScanner', () => ({ default: () => null }));
vi.mock('../../components/generic/GenericErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/DashboardHeaderCard', () => ({ default: () => null }));
vi.mock('./components/CurrentGoalCard', () => ({ default: () => null }));
vi.mock('./components/QuickActionsRow', () => ({ default: () => null }));
vi.mock('./components/GetStartedChecklist', () => ({ default: () => null }));
vi.mock('./components/ActivityCard', () => ({ default: () => null }));
vi.mock('./components/LearningProfileCard', () => ({ default: () => null }));
vi.mock('./components/AppsCard', () => ({ default: () => null }));
vi.mock('./components/DataTrustCard', () => ({ default: () => null }));
// The real RecoveryBanner hides itself when recovery is not applicable; model that here.
vi.mock('../../components/recovery/RecoveryBanner', () => ({
    default: ({ recoveryMethodCount }: { recoveryMethodCount: number | null }) =>
        recoveryMethodCount === 0 ? <div data-testid="recovery-banner" /> : null,
}));
vi.mock('../../components/pending-approval-banner/PendingApprovalBanner', () => ({
    default: () => <div data-testid="pending-guardian-approval-banner" />,
}));

const buildVm = (
    overrides: {
        pendingGuardianApproval?: boolean;
        recoveryApplicable?: boolean;
        keepAccount?: DashboardViewModel['keepAccount'];
        keepAccountPending?: boolean;
    } = {}
): DashboardViewModel =>
    ({
        brandName: 'LearnCard',
        header: {},
        heroSlot: 'getStarted',
        checklistItems: [],
        onDismissGetStarted: vi.fn(),
        goalSummary: null,
        pathwaysEnabled: false,
        reviewsDueToday: 0,
        onContinueGoal: vi.fn(),
        onReviewGoal: vi.fn(),
        slots: [],
        recoveryPrompt: {
            recoverySupported: true,
            recoveryMethodCount: overrides.recoveryApplicable ? 0 : 1,
            totalCredentialCount: 1,
            onSetup: vi.fn(),
        },
        pendingGuardianApproval: overrides.pendingGuardianApproval,
        keepAccount: overrides.keepAccount,
        keepAccountPending: overrides.keepAccountPending,
        dataTrust: {},
        activity: {},
        learningProfile: {},
        apps: {},
    }) as unknown as DashboardViewModel;

afterEach(cleanup);

describe('DashboardView guardian approval and recovery banner slot', () => {
    it('shows only the guardian approval banner when both banners apply', () => {
        render(
            <DashboardView
                vm={buildVm({ pendingGuardianApproval: true, recoveryApplicable: true })}
            />
        );

        expect(screen.getByTestId('pending-guardian-approval-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('recovery-banner')).not.toBeInTheDocument();
    });

    it('shows the recovery banner in the same slot once the guardian approves', () => {
        const { rerender } = render(
            <DashboardView
                vm={buildVm({ pendingGuardianApproval: true, recoveryApplicable: true })}
            />
        );

        rerender(
            <DashboardView
                vm={buildVm({ pendingGuardianApproval: false, recoveryApplicable: true })}
            />
        );

        expect(screen.queryByTestId('pending-guardian-approval-banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('recovery-banner')).toBeInTheDocument();
    });

    it('shows neither banner when neither applies', () => {
        render(
            <DashboardView
                vm={buildVm({ pendingGuardianApproval: false, recoveryApplicable: false })}
            />
        );

        expect(screen.queryByTestId('pending-guardian-approval-banner')).not.toBeInTheDocument();
        expect(screen.queryByTestId('recovery-banner')).not.toBeInTheDocument();
    });
});

describe('DashboardView ClassLink keep-account banner', () => {
    const keepAccount = (step: 'email' | 'method' = 'email') => ({
        step,
        onStart: vi.fn(),
        onSnooze: vi.fn(),
    });

    it('shows even when the account already has recovery methods', () => {
        render(<DashboardView vm={buildVm({ keepAccount: keepAccount() })} />);

        expect(screen.getByTestId('dashboard-keep-account-banner')).toBeInTheDocument();
        expect(screen.getByText(m['classlinkKeepAccount.banner.emailBody']())).toBeInTheDocument();
    });

    it('replaces the recovery banner while it shows', () => {
        const { rerender } = render(
            <DashboardView
                vm={buildVm({ recoveryApplicable: true, keepAccount: keepAccount('method') })}
            />
        );

        expect(screen.getByTestId('dashboard-keep-account-banner')).toBeInTheDocument();
        expect(screen.getByText(m['classlinkKeepAccount.banner.methodBody']())).toBeInTheDocument();
        expect(screen.queryByTestId('recovery-banner')).not.toBeInTheDocument();

        rerender(<DashboardView vm={buildVm({ recoveryApplicable: true })} />);
        expect(screen.queryByTestId('dashboard-keep-account-banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('recovery-banner')).toBeInTheDocument();
    });

    it('shows neither banner while the keep-account check is pending', () => {
        render(
            <DashboardView vm={buildVm({ recoveryApplicable: true, keepAccountPending: true })} />
        );

        expect(screen.queryByTestId('dashboard-keep-account-banner')).not.toBeInTheDocument();
        expect(screen.queryByTestId('recovery-banner')).not.toBeInTheDocument();
    });

    it('stays behind a pending guardian approval', () => {
        render(
            <DashboardView
                vm={buildVm({ pendingGuardianApproval: true, keepAccount: keepAccount() })}
            />
        );

        expect(screen.getByTestId('pending-guardian-approval-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-keep-account-banner')).not.toBeInTheDocument();
    });

    it('starts and snoozes through its own callbacks', () => {
        const vm = keepAccount();
        render(<DashboardView vm={buildVm({ keepAccount: vm })} />);

        fireEvent.click(screen.getByText(m['classlinkKeepAccount.banner.action']()));
        expect(vm.onStart).toHaveBeenCalledTimes(1);
        fireEvent.click(
            screen.getByRole('button', { name: m['classlinkKeepAccount.banner.snoozeAria']() })
        );
        expect(vm.onSnooze).toHaveBeenCalledTimes(1);
    });
});

it('keeps the announcement region mounted through failure, guarded retry, and recovery', () => {
    const retry = vi.fn();
    const base = DASHBOARD_PERSONAS['Brand-new user'];
    const view = (isError: boolean, isFetching: boolean) => (
        <DashboardView vm={{ ...base, collection: { isError, isFetching, retry } }} />
    );
    const { rerender } = render(view(false, true));
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.parentElement?.classList.contains('sr-only')).toBe(true);
    expect(
        screen.queryByRole('region', { name: m['credentialCollection.totalsAria']() })
    ).toBeNull();
    expect(
        screen.queryByRole('button', { name: m['credentialCollection.retryTotals']() })
    ).toBeNull();
    expect(screen.queryByText(/Credentials:.*Skills:/)).toBeNull();
    expect(screen.queryByText('Counting credentials…')).toBeNull();

    rerender(view(true, false));
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe(m['credentialCollection.totalsError']());
    expect(status.parentElement?.classList.contains('sr-only')).toBe(false);
    const button = screen.getByRole('button', { name: m['credentialCollection.retryTotals']() });
    button.focus();
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(view(true, true));
    expect(screen.getByRole('status')).toBe(status);
    expect(screen.getByRole('button', { name: m['credentialCollection.retrying']() })).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(view(false, false));
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('');
    expect(status.parentElement?.classList.contains('sr-only')).toBe(true);
    expect(
        screen.queryByRole('region', { name: m['credentialCollection.totalsAria']() })
    ).toBeNull();
    expect(
        screen.queryByRole('button', { name: m['credentialCollection.retryTotals']() })
    ).toBeNull();
    expect(screen.queryByText(/Credentials:.*Skills:/)).toBeNull();
});
