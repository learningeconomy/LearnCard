import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import type { FeedbackContext, FeedbackDraft, FeedbackReport } from './types';

const cameraHost = vi.hoisted(() => ({
    chooseFromGallery: vi.fn(),
}));

vi.mock('@capacitor/camera', () => ({
    Camera: { chooseFromGallery: cameraHost.chooseFromGallery },
    CameraErrorCode: { ChooseMediaCancelled: 'OS-PLUG-CAMR-0020' },
    MediaTypeSelection: { Photo: 0 },
}));

vi.mock('../../paraglide/messages.js', () => ({
    'feedback.reporting.reportProblem': () => 'Report a Problem',
    'feedback.reporting.shareIdea': () => 'Share an Idea',
    'feedback.reporting.whatHappened': () => 'What happened?',
    'feedback.reporting.problemPlaceholder': () => 'Tell us what you expected and what happened.',
    'feedback.reporting.ideaQuestion': () => 'What would make LearnCard better?',
    'feedback.reporting.ideaPlaceholder': () => 'Describe your idea.',
    'feedback.reporting.screenshotAttached': () => 'Screenshot attached',
    'feedback.reporting.addScreenshot': () => 'Add Screenshot',
    'feedback.reporting.addingScreenshot': () => 'Adding Screenshot...',
    'feedback.reporting.screenshotError': () =>
        'We couldn’t add that screenshot. Please try another.',
    'feedback.reporting.removeScreenshot': () => 'Remove Screenshot',
    'feedback.reporting.whatWeSend': () => 'What we’ll send',
    'feedback.reporting.bugDisclosure': () =>
        'Your message, optional screenshot, app and device details, recent screens, and sanitized logs.',
    'feedback.reporting.ideaDisclosure': () =>
        'Your idea, optional screenshot, current screen, app version, and tenant.',
    'feedback.reporting.ideaDisclosureWithoutScreenshot': () =>
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
        pendingContext: Promise<FeedbackContext>;
        allowScreenshot: boolean;
    }> = {}
) => {
    const onCancel = overrides.onCancel ?? vi.fn();
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    render(
        <FeedbackComposer
            draft={draft}
            pendingContext={overrides.pendingContext}
            allowScreenshot={overrides.allowScreenshot}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
    return { onCancel, onSubmit };
};

describe('FeedbackComposer', () => {
    beforeEach(() => {
        cameraHost.chooseFromGallery.mockReset();
    });

    it('adds a user-selected screenshot to a bug report', async () => {
        cameraHost.chooseFromGallery.mockResolvedValueOnce({
            results: [
                {
                    type: 0,
                    thumbnail: 'c2VsZWN0ZWQ=',
                    metadata: { format: 'jpeg' },
                    saved: false,
                },
            ],
        });
        const { onSubmit } = renderComposer({ ...bugDraft, screenshot: undefined });

        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        expect(await screen.findByRole('img', { name: 'Screenshot attached' })).toHaveAttribute(
            'src',
            'data:image/jpeg;base64,c2VsZWN0ZWQ='
        );
        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    screenshot: expect.objectContaining({
                        filename: 'feedback-screenshot.jpg',
                        contentType: 'image/jpeg',
                    }),
                })
            )
        );
    });

    it('offers an optional screenshot on idea reports when bug consent is explicit', () => {
        renderComposer(ideaDraft, { allowScreenshot: true });

        expect(screen.getByRole('button', { name: 'Add Screenshot' })).toBeVisible();
    });

    it('fails closed for idea screenshots when consent is not supplied', () => {
        renderComposer(ideaDraft);

        expect(screen.queryByRole('button', { name: 'Add Screenshot' })).not.toBeInTheDocument();
    });

    it('hides screenshot controls and screenshot disclosure for ideas without bug consent', async () => {
        renderComposer(ideaDraft, { allowScreenshot: false });

        expect(screen.queryByRole('button', { name: 'Add Screenshot' })).not.toBeInTheDocument();
        await user.click(screen.getByText('What we’ll send'));
        expect(
            screen.getByText('Your idea, current screen, app version, and tenant.')
        ).toBeVisible();
        expect(screen.queryByText(/optional screenshot/i)).not.toBeInTheDocument();
    });

    it('labels native gallery thumbnails as JPEG even when the source asset was PNG', async () => {
        cameraHost.chooseFromGallery.mockResolvedValueOnce({
            results: [
                {
                    type: 0,
                    uri: 'file:///selected.png',
                    thumbnail: 'bmF0aXZl',
                    metadata: { format: 'png' },
                    saved: false,
                },
            ],
        });
        renderComposer({ ...bugDraft, screenshot: undefined });

        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        expect(await screen.findByRole('img', { name: 'Screenshot attached' })).toHaveAttribute(
            'src',
            'data:image/jpeg;base64,bmF0aXZl'
        );
    });

    it('shows screenshot picker progress and blocks sending until selection finishes', async () => {
        const pending = createDeferred<{ results: [] }>();
        cameraHost.chooseFromGallery.mockReturnValueOnce(pending.promise);
        renderComposer({ ...bugDraft, screenshot: undefined });

        await user.type(screen.getByLabelText('What happened?'), 'The claim button froze');
        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        expect(screen.getByRole('button', { name: 'Adding Screenshot...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Send Report' })).toBeDisabled();

        await act(async () => {
            pending.resolve({ results: [] });
            await pending.promise;
        });

        expect(screen.getByRole('button', { name: 'Add Screenshot' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Send Report' })).toBeEnabled();
    });

    it('silently returns to the form when image selection is cancelled', async () => {
        cameraHost.chooseFromGallery.mockRejectedValueOnce({ code: 'OS-PLUG-CAMR-0020' });
        renderComposer({ ...bugDraft, screenshot: undefined });

        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Add Screenshot' })).toBeEnabled()
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('silently returns to the form when the web image picker is cancelled', async () => {
        cameraHost.chooseFromGallery.mockRejectedValueOnce({
            message: 'User cancelled photos app',
        });
        renderComposer({ ...bugDraft, screenshot: undefined });

        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Add Screenshot' })).toBeEnabled()
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows a friendly error when the image cannot be added', async () => {
        cameraHost.chooseFromGallery.mockRejectedValueOnce({ code: 'OS-PLUG-CAMR-0018' });
        renderComposer({ ...bugDraft, screenshot: undefined });

        await user.click(screen.getByRole('button', { name: 'Add Screenshot' }));

        expect(
            await screen.findByText('We couldn’t add that screenshot. Please try another.')
        ).toBeVisible();
    });

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
        const { onSubmit } = renderComposer(ideaDraft, { allowScreenshot: true });

        expect(screen.getByRole('heading', { name: 'Share an Idea' })).toBeVisible();
        expect(screen.getByLabelText('What would make LearnCard better?')).toHaveAttribute(
            'placeholder',
            'Describe your idea.'
        );
        expect(screen.getByText('What we’ll send')).toBeVisible();
        await user.click(screen.getByText('What we’ll send'));
        expect(
            screen.getByText(
                'Your idea, optional screenshot, current screen, app version, and tenant.'
            )
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

    it('leaves successful dismissal and confirmation to the parent', async () => {
        const { onSubmit } = renderComposer();

        await user.type(screen.getByLabelText('What happened?'), 'All good now');
        await user.click(screen.getByRole('button', { name: 'Send Report' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(
            screen.queryByText('Thanks for helping us improve LearnCard.')
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText('What happened?')).toHaveValue('All good now');
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
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByLabelText('What happened?')).toHaveValue('Offline error');
    });

    it('notifies the parent when cancelled without submitting', async () => {
        const { onCancel, onSubmit } = renderComposer();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
