import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DashboardView from './DashboardView';
import { DASHBOARD_PERSONAS } from './dashboard.personas';
import * as m from '../../paraglide/messages.js';

// Keep the real DashboardView and translations; isolate unrelated dashboard cards.
vi.mock('./components/DashboardHeaderCard', () => ({ default: () => null }));
vi.mock('./components/CurrentGoalCard', () => ({ default: () => null }));
vi.mock('./components/QuickActionsRow', () => ({ default: () => null }));
vi.mock('./components/GetStartedChecklist', () => ({ default: () => null }));
vi.mock('./components/ActivityCard', () => ({ default: () => null }));
vi.mock('./components/LearningProfileCard', () => ({ default: () => null }));
vi.mock('./components/AppsCard', () => ({ default: () => null }));
vi.mock('./components/DataTrustCard', () => ({ default: () => null }));
vi.mock('../../components/recovery/RecoveryBanner', () => ({ default: () => null }));

vi.mock('../../components/generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

afterEach(cleanup);

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
