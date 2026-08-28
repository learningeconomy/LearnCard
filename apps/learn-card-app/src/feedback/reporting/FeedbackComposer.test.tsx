import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * user-event v12 ships top-level async helpers (no v14 `setup()`), so wrap
 * them in the `user.click` / `user.type` shape used below.
 */
const user = {
    click: (element: Element) => userEvent.click(element as HTMLElement),
    type: (element: Element, text: string) => userEvent.type(element as HTMLElement, text),
};

import FeedbackComposer from './FeedbackComposer';
import type { FeedbackContext, FeedbackDraft, FeedbackReport, FeedbackScreenshot } from './types';

vi.mock('../../paraglide/messages.js', () => ({
    'feedback.reporting.reportProblem': () => 'Report a Problem',
    'feedback.reporting.shareIdea': () => 'Share an Idea',
    'feedback.reporting.whatHappened': () => 'What happened?',
    'feedback.reporting.problemPlaceholder': () => 'Tell us what you expected and what happened.',
    'feedback.reporting.ideaQuestion': () => 'What would make LearnCard better?',
    'feedback.reporting.ideaPlaceholder': () => 'Describe your idea.',
    'feedback.reporting.screenshotAttached': () => 'Screenshot attached',
    'feedback.reporting.capturingScreenshot': () => 'Capturing screenshot...',
    'feedback.reporting.removeScreenshot': () => 'Remove Screenshot',
    'feedback.reporting.whatWeSend': () => 'What we’ll send',
    'feedback.reporting.bugDisclosure': () =>
        'Your message, optional screenshot, app and device details, recent screens, and sanitized logs.',
    'feedback.reporting.ideaDisclosure': () =>
        'Your idea, current screen, app version, and tenant.',
    'feedback.reporting.cancel': () => 'Cancel',
    'feedback.reporting.sendReport': () => 'Send Report',
    'feedback.reporting.sendingReport': () => 'Sending Report...',
    'feedback.reporting.shareIdeaAction': () => 'Share Idea',
    'feedback.reporting.sharingIdea': () => 'Sharing Idea...',
    'feedback.reporting.thanks': () => 'Thanks for helping us improve LearnCard.',
    'feedback.reporting.error': () => 'We couldn’t send your feedback. Please try again.',
    'feedback.reporting.tryAgain': () => 'Try Again',
}));

const context: FeedbackContext = {
    currentRoute: '/wallet',
    recentRoutes: ['/home', '/wallet'],
    tenantId: 'learncard',
};

const bugDraft: FeedbackDraft = {
    kind: 'bug',
    source: 'shake',
    capturedAt: '2026-08-21T12:00:00.000Z',
    screenshot: {
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        filename: 'feedback-screenshot.png',
        contentType: 'image/png',
    },
    context,
    associatedEventId: 'sentry-event-1',
};

const ideaDraft: FeedbackDraft = {
    kind: 'idea',
    source: 'settings',
    capturedAt: '2026-08-21T12:05:00.000Z',
    context,
};

const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    const promise = new Promise<T>(resolvePromise => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

const renderComposer = (
    draft: FeedbackDraft = bugDraft,
    overrides: Partial<{
        onCancel: () => void;
        onSubmit: (report: FeedbackReport) => Promise<void>;
        pendingScreenshot: Promise<FeedbackScreenshot | undefined>;
        pendingContext: Promise<FeedbackContext>;
    }> = {}
) => {
    const onCancel = overrides.onCancel ?? vi.fn();
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    render(
        <FeedbackComposer
            draft={draft}
            pendingScreenshot={overrides.pendingScreenshot}
            pendingContext={overrides.pendingContext}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
    return { onCancel, onSubmit };
};

describe('FeedbackComposer', () => {
    it('renders the bug composer with heading, labeled textarea, disclosure, and screenshot', async () => {
        renderComposer();

        expect(screen.getByRole('heading', { name: 'Report a Problem' })).toBeVisible();
        expect(screen.getByRole('img', { name: 'Screenshot attached' })).toBeVisible();

        const textarea = screen.getByLabelText('What happened?');
        expect(textarea).toHaveAttribute(
            'placeholder',
            'Tell us what you expected and what happened.'
        );

        expect(screen.getByText('What we’ll send')).toBeVisible();
        await user.click(screen.getByText('What we’ll send'));
        expect(
            screen.getByText(
                'Your message, optional screenshot, app and device details, recent screens, and sanitized logs.'
            )
        ).toBeVisible();
    });

    it('allows the screenshot to be removed before submitting', async () => {
        const { onSubmit } = renderComposer();

        await user.click(screen.getByRole('button', { name: 'Remove Screenshot' }));
        expect(screen.queryByRole('img', { name: 'Screenshot attached' })).not.toBeInTheDocument();

        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'The claim button froze',
                    screenshot: undefined,
                })
            )
        );
    });

    it('shows a pending shake capture and attaches it when rendering finishes', async () => {
        let resolveScreenshot!: (screenshot: FeedbackScreenshot | undefined) => void;
        const pendingScreenshot = new Promise<FeedbackScreenshot | undefined>(resolve => {
            resolveScreenshot = resolve;
        });
        renderComposer({ ...bugDraft, screenshot: undefined }, { pendingScreenshot });

        expect(screen.getByText('Capturing screenshot...')).toBeVisible();
        expect(screen.queryByRole('img', { name: 'Screenshot attached' })).not.toBeInTheDocument();

        resolveScreenshot(bugDraft.screenshot);

        expect(await screen.findByRole('img', { name: 'Screenshot attached' })).toBeVisible();
        expect(screen.queryByText('Capturing screenshot...')).not.toBeInTheDocument();
    });

    it('uses richer diagnostic context when it arrives after the composer opens', async () => {
        let resolveContext!: (context: FeedbackContext) => void;
        const pendingContext = new Promise<FeedbackContext>(resolve => {
            resolveContext = resolve;
        });
        const { onSubmit } = renderComposer(
            { ...bugDraft, context: { currentRoute: '/wallet', recentRoutes: ['/wallet'] } },
            { pendingContext }
        );

        await act(async () => {
            resolveContext(context);
            await pendingContext;
        });
        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ context }))
        );
    });

    it('waits for richer diagnostic context when Send is tapped before it arrives', async () => {
        const pending = createDeferred<FeedbackContext>();
        const { onSubmit } = renderComposer(
            { ...bugDraft, context: { currentRoute: '/wallet', recentRoutes: ['/wallet'] } },
            { pendingContext: pending.promise }
        );

        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText('Sending Report...')).toBeVisible();

        await act(async () => {
            pending.resolve(context);
            await pending.promise;
        });

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ context }))
        );
    });

    it('submits a complete bug report built from the draft and typed message', async () => {
        const { onSubmit } = renderComposer();

        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'bug',
                source: 'shake',
                capturedAt: '2026-08-21T12:00:00.000Z',
                screenshot: bugDraft.screenshot,
                context,
                associatedEventId: 'sentry-event-1',
                message: 'The claim button froze',
            })
        );
    });

    it('keeps the send button disabled until a non-empty message is entered', async () => {
        const { onSubmit } = renderComposer(bugDraft, {
            onSubmit: vi.fn().mockResolvedValue(undefined),
        });

        const send = screen.getByRole('button', { name: 'Send Report' });
        expect(send).toBeDisabled();

        await user.click(send);
        expect(onSubmit).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText('What happened?'), '   ');
        expect(send).toBeDisabled();

        await user.type(screen.getByLabelText('What happened?'), 'Stuck spinner');
        expect(send).toBeEnabled();
    });

    it('prefills the message from the draft', async () => {
        const { onSubmit } = renderComposer({
            ...bugDraft,
            initialMessage: 'Preset context',
        });

        const textarea = screen.getByLabelText('What happened?') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Preset context');

        await user.click(screen.getByRole('button', { name: 'Send Report' }));
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Preset context' })
            )
        );
    });

    it('renders idea copy and the idea disclosure', async () => {
        const { onSubmit } = renderComposer(ideaDraft);

        expect(screen.getByRole('heading', { name: 'Share an Idea' })).toBeVisible();
        expect(screen.getByLabelText('What would make LearnCard better?')).toHaveAttribute(
            'placeholder',
            'Describe your idea.'
        );
        expect(screen.getByText('What we’ll send')).toBeVisible();
        await user.click(screen.getByText('What we’ll send'));
        expect(
            screen.getByText('Your idea, current screen, app version, and tenant.')
        ).toBeVisible();
        expect(screen.queryByRole('img', { name: 'Screenshot attached' })).not.toBeInTheDocument();

        await user.type(screen.getByLabelText('What would make LearnCard better?'), 'Dark mode');
        await user.click(screen.getByRole('button', { name: 'Share Idea' }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'idea',
                    source: 'settings',
                    message: 'Dark mode',
                    screenshot: undefined,
                })
            )
        );
    });

    it('shows contextual loading text and blocks the form while submitting', async () => {
        let resolveSubmit: (value: void) => void = () => {};
        const onSubmit = vi
            .fn()
            .mockImplementation(() => new Promise<void>(resolve => (resolveSubmit = resolve)));
        renderComposer(bugDraft, { onSubmit });

        await user.type(screen.getByLabelText('What happened?'), 'Upload failed');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        const busy = screen.getByRole('button', { name: /Sending Report\.\.\./ });
        expect(busy).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

        resolveSubmit();
        await waitFor(() =>
            expect(screen.queryByText('Sending Report...')).not.toBeInTheDocument()
        );
    });

    it('shows the thanks message after a successful submit', async () => {
        const { onSubmit } = renderComposer();

        await user.type(screen.getByLabelText('What happened?'), 'All good now');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        expect(await screen.findByText('Thanks for helping us improve LearnCard.')).toBeVisible();
        expect(screen.queryByLabelText('What happened?')).not.toBeInTheDocument();
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows idea loading text while an idea is submitting', async () => {
        let resolveSubmit: (value: void) => void = () => {};
        const onSubmit = vi
            .fn()
            .mockImplementation(() => new Promise<void>(resolve => (resolveSubmit = resolve)));
        renderComposer(ideaDraft, { onSubmit });

        await user.type(screen.getByLabelText('What would make LearnCard better?'), 'Widgets');
        await user.click(screen.getByRole('button', { name: 'Share Idea' }));

        expect(screen.getByRole('button', { name: /Sharing Idea\.\.\./ })).toBeDisabled();

        resolveSubmit();
        await waitFor(() => expect(screen.queryByText('Sharing Idea...')).not.toBeInTheDocument());
    });

    it('shows a friendly retry banner and retains the message after a rejected submit', async () => {
        const onSubmit = vi
            .fn<(report: FeedbackReport) => Promise<void>>()
            .mockRejectedValueOnce(new Error('network blew up'))
            .mockResolvedValue(undefined);
        renderComposer(bugDraft, { onSubmit });

        await user.type(screen.getByLabelText('What happened?'), 'Offline error');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        expect(
            await screen.findByText('We couldn’t send your feedback. Please try again.')
        ).toBeVisible();

        // The raw transport error is never surfaced.
        expect(screen.queryByText(/network blew up/)).not.toBeInTheDocument();

        // The typed message is retained so the user can retry without retyping.
        const textarea = screen.getByLabelText('What happened?') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Offline error');

        await user.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
        expect(await screen.findByText('Thanks for helping us improve LearnCard.')).toBeVisible();
    });

    it('notifies the parent when cancelled without submitting', async () => {
        const { onCancel, onSubmit } = renderComposer();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
