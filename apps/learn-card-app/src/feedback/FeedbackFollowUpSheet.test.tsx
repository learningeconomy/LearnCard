import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * user-event v12 ships top-level async helpers (no v14 `setup()`), so wrap
 * them in the `user.click` / `user.type` shape used below.
 */
const user = {
    click: (element: Element) => userEvent.click(element as HTMLElement),
    type: (element: Element, text: string) => userEvent.type(element as HTMLElement, text),
};

/**
 * Micro-feedback follow-up tests (LC-2086 Task 9).
 *
 * The sheet no longer touches Sentry directly: the "broken or free text"
 * branch submits a prefilled immediate report through the shared controller
 * with the `micro-feedback` source. The button shows contextual loading
 * text until the submission resolves, and the sheet still closes — even on
 * rejection, without surfacing a raw provider error.
 */

const closeModal = vi.hoisted(() => vi.fn());
const track = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const reportProblem = vi.hoisted(() => vi.fn());

vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: vi.fn(), closeModal }),
    useGetPreferencesForDid: () => ({ data: { bugReportsEnabled: true } }),
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track }),
    AnalyticsEvents: {
        FEEDBACK_FOLLOWUP_SUBMITTED: 'feedback_followup_submitted',
        FEEDBACK_FOLLOWUP_DISMISSED: 'feedback_followup_dismissed',
    },
}));

vi.mock('./reporting/FeedbackContext', () => ({
    useFeedback: () => ({ reportProblem, shareIdea: vi.fn() }),
}));

vi.mock('../paraglide/messages.js', () => ({
    'feedback.followup.title': () => 'What went wrong?',
    'feedback.followup.desc': () => 'Your feedback helps us make LearnCard better.',
    'feedback.followup.reason.confusing': () => 'Confusing',
    'feedback.followup.reason.slow': () => 'Slow',
    'feedback.followup.reason.broken': () => 'Something broke',
    'feedback.followup.reason.other': () => 'Other',
    'feedback.followup.placeholder': () => 'Tell us more (optional)',
    'feedback.followup.send': () => 'Send Feedback',
    'feedback.followup.skip': () => 'Skip',
    'feedback.reporting.sendingReport': () => 'Sending Report...',
}));

import FeedbackFollowUpSheet from './FeedbackFollowUpSheet';

const renderSheet = () => render(<FeedbackFollowUpSheet surface="claim" sentiment="bad" />);

describe('FeedbackFollowUpSheet micro-feedback reporting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        reportProblem.mockReset();
    });

    it('submits a prefilled immediate report through the shared controller', async () => {
        let resolveReport: (value: void) => void = () => {};
        reportProblem.mockImplementation(
            () => new Promise<void>(resolve => (resolveReport = resolve))
        );
        renderSheet();

        await user.click(screen.getByTestId('feedback-reason-broken'));
        await user.click(screen.getByTestId('feedback-followup-send'));

        // Exact micro-feedback compatibility options.
        expect(reportProblem).toHaveBeenCalledWith({
            source: 'micro-feedback',
            initialMessage: 'User reported a problem (broken)',
            submitImmediately: true,
        });

        // Contextual loading state until the submission resolves; the sheet
        // stays open (modal not yet closed) and double-submits are blocked.
        expect(screen.getByRole('button', { name: /Sending Report\.\.\./ })).toBeDisabled();
        expect(closeModal).not.toHaveBeenCalled();

        resolveReport();
        await waitFor(() => expect(closeModal).toHaveBeenCalledTimes(1));

        // The existing analytics event is retained.
        expect(track).toHaveBeenCalledWith('feedback_followup_submitted', {
            surface: 'claim',
            sentiment: 'bad',
            reasons: ['broken'],
            hasFreeText: false,
        });
    });

    it('prefers the trimmed free-text note over the generated reason summary', async () => {
        reportProblem.mockResolvedValue(undefined);
        renderSheet();

        await user.type(
            screen.getByPlaceholderText('Tell us more (optional)'),
            '  Screen froze after claiming  '
        );
        await user.click(screen.getByTestId('feedback-followup-send'));

        expect(reportProblem).toHaveBeenCalledWith({
            source: 'micro-feedback',
            initialMessage: 'Screen froze after claiming',
            submitImmediately: true,
        });
        await waitFor(() => expect(closeModal).toHaveBeenCalledTimes(1));
    });

    it('still closes and never surfaces a raw provider error when submission rejects', async () => {
        reportProblem.mockRejectedValue(new Error('sentry transport exploded'));
        renderSheet();

        await user.click(screen.getByTestId('feedback-reason-broken'));
        await user.click(screen.getByTestId('feedback-followup-send'));

        await waitFor(() => expect(closeModal).toHaveBeenCalledTimes(1));

        // Friendly surface only — the raw transport error never renders.
        expect(screen.queryByText(/sentry transport exploded/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('does not submit a report for eligible-only reasons without free text', async () => {
        reportProblem.mockResolvedValue(undefined);
        renderSheet();

        await user.click(screen.getByTestId('feedback-reason-slow'));
        await user.click(screen.getByTestId('feedback-followup-send'));

        expect(reportProblem).not.toHaveBeenCalled();
        await waitFor(() => expect(closeModal).toHaveBeenCalledTimes(1));
        expect(track).toHaveBeenCalledWith('feedback_followup_submitted', {
            surface: 'claim',
            sentiment: 'bad',
            reasons: ['slow'],
            hasFreeText: false,
        });
    });
});
