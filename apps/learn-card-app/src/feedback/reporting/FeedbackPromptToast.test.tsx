import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackPromptToast } from './FeedbackPromptToast';

vi.mock('../../paraglide/messages.js', () => ({
    'feedback.reporting.promptTitle': () => 'Report a problem?',
    'feedback.reporting.promptScreenshotBody': () =>
        'We captured the current screen to help explain what happened.',
    'feedback.reporting.promptShakeBody': () => 'Open the feedback form to tell us what happened.',
    'feedback.reporting.promptAction': () => 'Report',
    'feedback.reporting.dismiss': () => 'Dismiss',
}));

describe('FeedbackPromptToast', () => {
    it('does not claim a screenshot was captured for a deferred shake', () => {
        render(<FeedbackPromptToast source="shake" onReport={vi.fn()} onDismiss={vi.fn()} />);

        expect(screen.getByText('Open the feedback form to tell us what happened.')).toBeVisible();
        expect(
            screen.queryByText('We captured the current screen to help explain what happened.')
        ).not.toBeInTheDocument();
    });

    it('describes the captured screen for a screenshot-triggered prompt', () => {
        render(<FeedbackPromptToast source="screenshot" onReport={vi.fn()} onDismiss={vi.fn()} />);

        expect(
            screen.getByText('We captured the current screen to help explain what happened.')
        ).toBeVisible();
    });
});
