import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * user-event v12 ships top-level async helpers (no v14 `setup()`), so wrap
 * them in the `user.click` shape used below.
 */
const user = {
    click: (element: Element) => userEvent.click(element as HTMLElement),
};

/**
 * Settings entry-point tests (LC-2086 Task 9).
 *
 * `FeedbackSettingsRows` must gate each action on its own destination
 * eligibility — bug reports and ideas are independent — and forward the
 * `settings` source to the shared controller.
 */

const eligibility = vi.hoisted(() => ({
    value: { bug: false, idea: false, isLoading: false },
}));

const reportProblem = vi.hoisted(() => vi.fn());
const shareIdea = vi.hoisted(() => vi.fn());

vi.mock('./eligibility', () => ({
    useFeedbackReportingEligibility: () => eligibility.value,
}));

vi.mock('./FeedbackContext', () => ({
    useFeedback: () => ({ reportProblem, shareIdea }),
}));

vi.mock('../../paraglide/messages.js', () => ({
    'feedback.reporting.reportProblem': () => 'Report a Problem',
    'feedback.reporting.shareIdea': () => 'Share an Idea',
}));

import FeedbackSettingsRows from './FeedbackSettingsRows';

const renderEligible = ({ bug, idea }: { bug: boolean; idea: boolean }) => {
    eligibility.value = { bug, idea, isLoading: false };
    return (ui: React.ReactNode) => render(ui);
};

describe('FeedbackSettingsRows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        eligibility.value = { bug: false, idea: false, isLoading: false };
    });

    it('shows only the report action when just bug reports are eligible', async () => {
        const renderWith = renderEligible({ bug: true, idea: false });
        renderWith(<FeedbackSettingsRows />);

        expect(screen.getByRole('button', { name: 'Report a Problem' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Share an Idea' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Report a Problem' }));
        expect(reportProblem).toHaveBeenCalledTimes(1);
        expect(reportProblem).toHaveBeenCalledWith({ source: 'settings' });
        expect(shareIdea).not.toHaveBeenCalled();
    });

    it('shows only the idea action when just ideas are eligible', async () => {
        const renderWith = renderEligible({ bug: false, idea: true });
        renderWith(<FeedbackSettingsRows />);

        expect(screen.getByRole('button', { name: 'Share an Idea' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Report a Problem' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Share an Idea' }));
        expect(shareIdea).toHaveBeenCalledTimes(1);
        expect(shareIdea).toHaveBeenCalledWith({ source: 'settings' });
        expect(reportProblem).not.toHaveBeenCalled();
    });

    it('shows both actions when both destinations are eligible', () => {
        const renderWith = renderEligible({ bug: true, idea: true });
        renderWith(<FeedbackSettingsRows />);

        expect(screen.getByRole('button', { name: 'Report a Problem' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Share an Idea' })).toBeVisible();
    });

    it('marks both actions busy while the selected feedback flow is preparing', async () => {
        let resolveReport!: () => void;
        reportProblem.mockReturnValueOnce(
            new Promise<void>(resolve => {
                resolveReport = resolve;
            })
        );
        const renderWith = renderEligible({ bug: true, idea: true });
        renderWith(<FeedbackSettingsRows />);

        await user.click(screen.getByRole('button', { name: 'Report a Problem' }));

        expect(screen.getByRole('button', { name: 'Report a Problem' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Report a Problem' })).toHaveAttribute(
            'aria-busy',
            'true'
        );
        expect(screen.getByRole('button', { name: 'Share an Idea' })).toBeDisabled();

        resolveReport();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Report a Problem' })).toBeEnabled();
        });
    });

    it('renders nothing when both destinations are ineligible', () => {
        const renderWith = renderEligible({ bug: false, idea: false });
        const { container } = renderWith(<FeedbackSettingsRows />);

        expect(screen.queryByRole('button', { name: 'Report a Problem' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Share an Idea' })).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
    });
});
