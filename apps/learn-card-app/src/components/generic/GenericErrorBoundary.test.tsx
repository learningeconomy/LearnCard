import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * user-event v12 ships top-level async helpers (no v14 `setup()`), so wrap
 * them in the `user.click` shape used below.
 */
const user = {
    click: (element: Element) => userEvent.click(element as HTMLElement),
};

/**
 * Error-boundary entry-point tests (LC-2086 Task 9).
 *
 * The fallback offers a secondary "Send Report" pill for non-chunk errors
 * only, gated on bug-report eligibility, forwarding the Sentry event ID
 * returned by the central logger's `log.error` as `associatedEventId`.
 */

const eligibility = vi.hoisted(() => ({
    value: { bug: false, idea: false, isLoading: false },
}));

const reportProblem = vi.hoisted(() => vi.fn());
const guardedChunkReload = vi.hoisted(() => vi.fn());

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {},
    isLocalhost: false,
    isStaleChunkError: (error: Error) =>
        /Loading chunk \d+ failed|Failed to fetch dynamically imported module/i.test(error.message),
    guardedChunkReload,
    getLogger: () => ({ error: vi.fn().mockReturnValue('event-123') }),
}));

vi.mock('learn-card-base/svgs/SpilledCup', () => ({
    default: () => <svg data-testid="spilled-cup" />,
}));

vi.mock('learn-card-base/svgs/ArrowCircle', () => ({
    default: () => <svg data-testid="arrow-circle" />,
}));

vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getColorSet: () => ({ defaults: {} }),
        colors: { defaults: { primaryColor: 'grayscale-900' } },
    }),
}));

vi.mock('../../paraglide/messages.js', () => {
    const messages = {
        'error.generic': () => 'Something went wrong',
        'error.retry': () => 'Try Again',
        'error.goHome': () => 'Go Home',
        'feedback.reporting.sendReport': () => 'Send Report',
    };

    return { ...messages, m: messages };
});

vi.mock('../../feedback/reporting/eligibility', () => ({
    useFeedbackReportingEligibility: () => eligibility.value,
}));

vi.mock('../../feedback/reporting/FeedbackContext', () => ({
    useFeedback: () => ({ reportProblem, shareIdea: vi.fn() }),
}));

import GenericErrorBoundary from './GenericErrorBoundary';

const Thrower: React.FC<{ message?: string }> = ({ message = 'boom' }) => {
    throw new Error(message);
};

const renderCrashed = (element: React.ReactNode) =>
    render(<GenericErrorBoundary>{element}</GenericErrorBoundary>);

describe('GenericErrorBoundary feedback entry point', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        eligibility.value = { bug: false, idea: false, isLoading: false };
    });

    it('shows Send Report only when bug reports are eligible', () => {
        eligibility.value = { bug: true, idea: false, isLoading: false };
        renderCrashed(<Thrower />);

        expect(screen.getByRole('button', { name: 'Send Report' })).toBeVisible();
    });

    it('hides Send Report when bug reports are ineligible', () => {
        eligibility.value = { bug: false, idea: true, isLoading: false };
        renderCrashed(<Thrower />);

        expect(screen.queryByRole('button', { name: 'Send Report' })).not.toBeInTheDocument();
    });

    it('reports with the logger event id and error-boundary source', async () => {
        eligibility.value = { bug: true, idea: false, isLoading: false };
        renderCrashed(<Thrower />);

        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        expect(reportProblem).toHaveBeenCalledTimes(1);
        expect(reportProblem).toHaveBeenCalledWith({
            source: 'error-boundary',
            associatedEventId: 'event-123',
        });
    });

    it('keeps the stale-chunk fallback refresh-only', () => {
        eligibility.value = { bug: true, idea: false, isLoading: false };
        renderCrashed(<Thrower message="Loading chunk 5 failed" />);

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Send Report' })).not.toBeInTheDocument();
        expect(guardedChunkReload).toHaveBeenCalledTimes(1);
    });
});
