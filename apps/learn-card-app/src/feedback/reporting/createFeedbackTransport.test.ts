/**
 * Tests for the provider-independent feedback transport router (LC-2086 Task 6).
 *
 * `createFeedbackTransport` routes a `FeedbackReport` by kind:
 *
 *   - bugs go to the Sentry adapter and NEVER touch analytics,
 *   - ideas go through the typed analytics adapter (`feedback_idea_submitted`)
 *     carrying only source/message/currentRoute/appVersion; when the user
 *     explicitly attaches a screenshot, a privacy-safe Sentry feedback event
 *     carries the attachment alongside the anonymous analytics event,
 *   - ideas reject with the friendly transport error when analytics is not
 *     ready or the active provider is not PostHog (never report success
 *     through the noop provider).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFeedbackTransport } from './createFeedbackTransport';
import { FEEDBACK_TRANSPORT_ERROR_MESSAGE, submitSentryFeedback } from './sentryFeedbackTransport';
import type { FeedbackReport } from './types';

vi.mock('./sentryFeedbackTransport', () => ({
    FEEDBACK_TRANSPORT_ERROR_MESSAGE: 'friendly transport error',
    submitSentryFeedback: vi.fn().mockResolvedValue({ id: 'sentry-event-1' }),
}));

const ideaReport: FeedbackReport = {
    kind: 'idea',
    source: 'settings',
    capturedAt: '2026-08-20T12:02:00.000Z',
    message: 'Add a compact credential view',
    // Even when diagnostic-shaped context exists on the draft, ideas never
    // forward it — the payload assertion below proves the omission.
    screenshot: {
        dataUrl: 'data:image/png;base64,AAAA',
        filename: 'feedback-screenshot.png',
        contentType: 'image/png',
    },
    context: {
        currentRoute: '/wallet',
        recentRoutes: ['/wallet'],
        tenantId: 'learncard',
        app: {
            platform: 'web',
            displayVersion: '1.98.3',
        },
        logs: [
            {
                timestamp: '2026-08-20T12:01:59.000Z',
                level: 'info',
                message: 'irrelevant for ideas',
            },
        ],
    },
};

const bugReport: FeedbackReport = {
    kind: 'bug',
    source: 'shake',
    capturedAt: '2026-08-20T12:03:00.000Z',
    message: 'Crash when opening the scanner',
    context: {
        currentRoute: '/scan',
        recentRoutes: ['/wallet', '/scan'],
    },
};

describe('createFeedbackTransport', () => {
    let track: ReturnType<typeof vi.fn>;
    let submitFeedbackIdea: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        track = vi.fn().mockResolvedValue(undefined);
        submitFeedbackIdea = vi.fn().mockResolvedValue(undefined);
    });

    const createAnalyticsAdapter = (
        overrides: { isReady?: boolean; providerName?: string; bugEligible?: boolean } = {}
    ) => ({
        // Deliberately present as an extra property: the feedback adapter no
        // longer exposes identified tracking, and the spy proves it stays unused.
        track,
        submitFeedbackIdea,
        isReady: true,
        providerName: 'posthog',
        bugEligible: true,
        ...overrides,
    });

    it('sends an idea screenshot through Sentry alongside the anonymous analytics event', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        await transport.submit(ideaReport);

        expect(submitFeedbackIdea).toHaveBeenCalledTimes(1);
        expect(submitFeedbackIdea).toHaveBeenCalledWith({
            source: 'settings',
            message: 'Add a compact credential view',
            currentRoute: '/wallet',
            appVersion: '1.98.3',
        });
        expect(track).not.toHaveBeenCalled();
        expect(submitSentryFeedback).toHaveBeenCalledTimes(1);
        expect(submitSentryFeedback).toHaveBeenCalledWith(ideaReport);
    });

    it('does not create a Sentry event for an idea without a screenshot', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter());
        const { screenshot, ...ideaWithoutScreenshot } = ideaReport;

        await transport.submit(ideaWithoutScreenshot);

        expect(submitFeedbackIdea).toHaveBeenCalledTimes(1);
        expect(submitSentryFeedback).not.toHaveBeenCalled();
    });

    it('does not send an idea screenshot to Sentry without bug-report consent', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter({ bugEligible: false }));

        await expect(transport.submit(ideaReport)).resolves.toEqual({});

        expect(submitFeedbackIdea).toHaveBeenCalledTimes(1);
        expect(submitSentryFeedback).not.toHaveBeenCalled();
    });

    it('does not fail or duplicate the accepted idea when its screenshot sidecar fails', async () => {
        vi.mocked(submitSentryFeedback).mockRejectedValueOnce(new Error('sentry offline'));
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        await expect(transport.submit(ideaReport)).resolves.toEqual({});

        expect(submitFeedbackIdea).toHaveBeenCalledTimes(1);
        expect(submitSentryFeedback).toHaveBeenCalledTimes(1);
    });

    it('omits appVersion when the report has no app context', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        const { app, ...contextWithoutApp } = ideaReport.context;
        await transport.submit({ ...ideaReport, context: contextWithoutApp });

        expect(submitFeedbackIdea).toHaveBeenCalledWith({
            source: 'settings',
            message: 'Add a compact credential view',
            currentRoute: '/wallet',
        });
    });

    it('resolves without an id once the provider accepts the event', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        await expect(transport.submit(ideaReport)).resolves.toEqual({});
    });

    it('routes bugs to the Sentry adapter and never touches analytics', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        await expect(transport.submit(bugReport)).resolves.toEqual({ id: 'sentry-event-1' });

        expect(submitSentryFeedback).toHaveBeenCalledTimes(1);
        expect(submitSentryFeedback).toHaveBeenCalledWith(bugReport);
        expect(track).not.toHaveBeenCalled();
        expect(submitFeedbackIdea).not.toHaveBeenCalled();
    });

    it('routes bugs to Sentry even when analytics is unavailable', async () => {
        const transport = createFeedbackTransport(
            createAnalyticsAdapter({ isReady: false, providerName: 'noop' })
        );

        await expect(transport.submit(bugReport)).resolves.toEqual({ id: 'sentry-event-1' });
        expect(track).not.toHaveBeenCalled();
    });

    it('rejects ideas with the friendly transport error when analytics is not ready', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter({ isReady: false }));

        await expect(transport.submit(ideaReport)).rejects.toThrow('friendly transport error');
        expect(track).not.toHaveBeenCalled();
    });

    it('rejects ideas when the provider is not PostHog and never reports success through noop', async () => {
        const transport = createFeedbackTransport(createAnalyticsAdapter({ providerName: 'noop' }));

        await expect(transport.submit(ideaReport)).rejects.toThrow(
            FEEDBACK_TRANSPORT_ERROR_MESSAGE
        );
        expect(track).not.toHaveBeenCalled();
    });

    it('maps anonymous analytics rejection to the friendly retryable error', async () => {
        submitFeedbackIdea.mockRejectedValue(new Error('posthog offline'));
        const transport = createFeedbackTransport(createAnalyticsAdapter());

        await expect(transport.submit(ideaReport)).rejects.toThrow(
            FEEDBACK_TRANSPORT_ERROR_MESSAGE
        );
        expect(track).not.toHaveBeenCalled();
    });
});
