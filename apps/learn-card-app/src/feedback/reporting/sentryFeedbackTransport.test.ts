/**
 * Tests for the Sentry feedback transport (LC-2086 Task 6).
 *
 * `submitSentryFeedback` is the ONLY module allowed to import `@sentry/react`
 * for feedback submission. These tests lock in, against the installed
 * Sentry 8.34 `captureFeedback(params, hint)` signature:
 *
 *   - the exact payload: message, associatedEventId, and the enumerated tags
 *     (feedbackType, feedbackSource, route, tenant, platform, appVersion,
 *     bundle — and nothing else),
 *   - screenshot/logs delivered as event-hint attachments with the approved
 *     filenames and content types,
 *   - rejection with the friendly transport error when there is no Sentry
 *     client (never claim success),
 *   - omission of the attachments key when neither attachment is present,
 *   - structured app/device/network context passed as scope extras, not tags.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FEEDBACK_TRANSPORT_ERROR_MESSAGE, submitSentryFeedback } from './sentryFeedbackTransport';
import type { FeedbackReport } from './types';

const { scopeMock, withScopeMock, captureFeedbackMock, getClientMock } = vi.hoisted(() => {
    const scopeMock = { setTag: vi.fn(), setExtra: vi.fn() };
    return {
        scopeMock,
        withScopeMock: vi.fn((callback: (scope: typeof scopeMock) => unknown) =>
            callback(scopeMock)
        ),
        captureFeedbackMock: vi.fn(),
        getClientMock: vi.fn(),
    };
});

vi.mock('@sentry/react', () => ({
    getClient: getClientMock,
    captureFeedback: captureFeedbackMock,
    withScope: withScopeMock,
}));

const diagnosticLogs = [
    {
        timestamp: '2026-08-20T11:59:58.000Z',
        level: 'error' as const,
        scope: 'wallet',
        message: 'claim button did not resolve',
    },
];

const bugReport: FeedbackReport = {
    kind: 'bug',
    source: 'error-boundary',
    capturedAt: '2026-08-20T12:00:00.000Z',
    message: 'The claim button froze',
    associatedEventId: 'error-event-1',
    screenshot: {
        dataUrl: `data:image/png;base64,${btoa('fake-png-bytes')}`,
        filename: 'feedback-screenshot.png',
        contentType: 'image/png',
    },
    context: {
        currentRoute: '/claim/:id',
        recentRoutes: ['/wallet', '/claim/:id'],
        tenantId: 'learncard',
        app: {
            platform: 'web',
            displayVersion: '1.98.3',
            bundleVersion: '2026.08.20',
        },
        device: {
            model: 'MacBookPro18,3',
            osLabel: 'macOS 15.6',
        },
        network: {
            connected: true,
            label: 'wifi',
        },
        logs: diagnosticLogs,
    },
};

describe('submitSentryFeedback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getClientMock.mockReturnValue({ options: {} });
        captureFeedbackMock.mockReturnValue('feedback-event-9');
    });

    it('calls captureFeedback with the Sentry 8.34 payload signature', async () => {
        await submitSentryFeedback(bugReport);

        expect(captureFeedbackMock).toHaveBeenCalledTimes(1);
        expect(captureFeedbackMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'The claim button froze',
                associatedEventId: 'error-event-1',
                tags: expect.objectContaining({
                    feedbackType: 'bug',
                    feedbackSource: 'error-boundary',
                    route: '/claim/:id',
                    tenant: 'learncard',
                    bundle: '2026.08.20',
                }),
            }),
            expect.objectContaining({
                attachments: expect.arrayContaining([
                    expect.objectContaining({
                        filename: 'feedback-screenshot.png',
                        contentType: 'image/png',
                    }),
                    expect.objectContaining({
                        filename: 'feedback-logs.json',
                        contentType: 'application/json',
                    }),
                ]),
            })
        );
    });

    it('enumerates exactly the approved tags', async () => {
        await submitSentryFeedback(bugReport);

        const [params] = captureFeedbackMock.mock.calls[0] as [
            { tags: Record<string, string> },
            unknown
        ];

        expect(params.tags).toEqual({
            feedbackType: 'bug',
            feedbackSource: 'error-boundary',
            route: '/claim/:id',
            tenant: 'learncard',
            platform: 'web',
            appVersion: '1.98.3',
            bundle: '2026.08.20',
        });
    });

    it('converts the screenshot data URL and logs JSON into attachment bytes', async () => {
        await submitSentryFeedback(bugReport);

        const [, hint] = captureFeedbackMock.mock.calls[0] as [
            unknown,
            {
                attachments: {
                    filename: string;
                    contentType: string;
                    data: Uint8Array;
                }[];
            }
        ];

        expect(hint.attachments).toHaveLength(2);

        const [screenshotAttachment, logsAttachment] = hint.attachments;

        expect(new TextDecoder().decode(screenshotAttachment.data)).toBe('fake-png-bytes');

        expect(JSON.parse(new TextDecoder().decode(logsAttachment.data))).toEqual(diagnosticLogs);
        // Logs stay structured JSON (pretty-printed), never flattened into tags.
        expect(new TextDecoder().decode(logsAttachment.data)).toBe(
            JSON.stringify(diagnosticLogs, null, 2)
        );
    });

    it('passes structured context as scope extras, not scope tags', async () => {
        await submitSentryFeedback(bugReport);

        expect(scopeMock.setTag).not.toHaveBeenCalled();
        expect(scopeMock.setExtra).toHaveBeenCalledWith('app', bugReport.context.app);
        expect(scopeMock.setExtra).toHaveBeenCalledWith('device', bugReport.context.device);
        expect(scopeMock.setExtra).toHaveBeenCalledWith('network', bugReport.context.network);
        expect(scopeMock.setExtra).toHaveBeenCalledWith(
            'recentRoutes',
            bugReport.context.recentRoutes
        );
    });

    it('resolves with the Sentry event id', async () => {
        await expect(submitSentryFeedback(bugReport)).resolves.toEqual({ id: 'feedback-event-9' });
    });

    it('omits the attachments key when there is nothing to attach', async () => {
        const { screenshot, ...withoutScreenshot } = bugReport;
        const { logs, ...contextWithoutLogs } = withoutScreenshot.context;
        const bareReport: FeedbackReport = {
            ...withoutScreenshot,
            context: contextWithoutLogs,
        };

        await submitSentryFeedback(bareReport);

        expect(captureFeedbackMock).toHaveBeenCalledTimes(1);
        const [, hint] = captureFeedbackMock.mock.calls[0] as [unknown, Record<string, unknown>];
        expect(hint.attachments).toBeUndefined();
    });

    it('rejects with the friendly transport error when the Sentry client is absent', async () => {
        getClientMock.mockReturnValue(undefined);

        await expect(submitSentryFeedback(bugReport)).rejects.toThrow(
            FEEDBACK_TRANSPORT_ERROR_MESSAGE
        );
        expect(captureFeedbackMock).not.toHaveBeenCalled();
    });

    it('omits optional tags that are not present', async () => {
        const minimalReport: FeedbackReport = {
            kind: 'bug',
            source: 'shake',
            capturedAt: '2026-08-20T12:01:00.000Z',
            message: 'Blank screen after resume',
            context: {
                currentRoute: '/wallet',
                recentRoutes: ['/wallet'],
            },
        };

        await submitSentryFeedback(minimalReport);

        const [params] = captureFeedbackMock.mock.calls[0] as [
            { tags: Record<string, string> },
            unknown
        ];
        expect(params.tags).toEqual({
            feedbackType: 'bug',
            feedbackSource: 'shake',
            route: '/wallet',
        });
        // associatedEventId is omitted, not sent as undefined.
        expect('associatedEventId' in params).toBe(false);
    });
});
