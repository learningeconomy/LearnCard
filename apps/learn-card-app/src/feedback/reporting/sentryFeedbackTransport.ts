/**
 * Sentry feedback transport (LC-2086 Task 6).
 *
 * This is the ONLY module in the feedback feature that imports `@sentry/react`
 * for feedback submission. UI and collection layers stay provider-agnostic and
 * talk to this adapter through the `FeedbackTransport` boundary.
 *
 * Submits a `FeedbackReport` via `Sentry.captureFeedback` (installed 8.34
 * signature: `captureFeedback(params, hint?)`):
 *
 *   - `message` and, when supplied by an error boundary, `associatedEventId`
 *     (the event ID returned by the logger's injected transport),
 *   - an exact, enumerated set of tags: feedbackType, feedbackSource, route,
 *     tenant, platform, appVersion, bundle — nothing else,
 *   - screenshot (PNG data URL → `Uint8Array`) and diagnostic logs (pretty
 *     JSON → `Uint8Array`) as event-hint attachments,
 *   - structured privacy-safe app/device/network context as scope extras,
 *     never as tags.
 *
 * Never persists reports, screenshots, or logs. Rejects with the friendly
 * transport error when there is no Sentry client rather than claiming success.
 */

import * as Sentry from '@sentry/react';

import type { FeedbackReport } from './types';

/** Friendly, retry-safe message surfaced when a submission cannot be delivered. */
export const FEEDBACK_TRANSPORT_ERROR_MESSAGE = "We couldn't send your feedback. Please try again.";

/** Approved attachment shape (Sentry `Attachment`). */
interface FeedbackAttachment {
    filename: string;
    contentType: string;
    data: Uint8Array;
}

/**
 * Build the exact, enumerated tag set for a report.
 *
 * `feedbackType`, `feedbackSource`, and `route` are always present; `tenant`,
 * `platform`, `appVersion`, and `bundle` are included only when the report
 * context carries them. No other keys are ever attached.
 */
const buildTags = (report: FeedbackReport): Record<string, string> => {
    const { tenantId, app } = report.context;

    const tags: Record<string, string> = {
        feedbackType: report.kind,
        feedbackSource: report.source,
        route: report.context.currentRoute,
    };

    if (tenantId) tags.tenant = tenantId;
    if (app?.platform) tags.platform = app.platform;
    if (app?.displayVersion) tags.appVersion = app.displayVersion;
    if (app?.bundleVersion) tags.bundle = app.bundleVersion;

    return tags;
};

/** Decode a base64 PNG data URL into attachment bytes. */
const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

/** Build attachments; omitted entries never appear in the event hint. */
const buildAttachments = (report: FeedbackReport): FeedbackAttachment[] => {
    const attachments: FeedbackAttachment[] = [];

    if (report.screenshot) {
        attachments.push({
            filename: report.screenshot.filename,
            contentType: report.screenshot.contentType,
            data: dataUrlToUint8Array(report.screenshot.dataUrl),
        });
    }

    if (report.context.logs && report.context.logs.length > 0) {
        attachments.push({
            filename: 'feedback-logs.json',
            contentType: 'application/json',
            data: new TextEncoder().encode(JSON.stringify(report.context.logs, null, 2)),
        });
    }

    return attachments;
};

/**
 * Submit a bug report to Sentry and resolve with the feedback event ID.
 *
 * Rejects with the friendly transport error when no Sentry client is
 * available — success is never claimed for an undelivered report.
 */
export const submitSentryFeedback = async (report: FeedbackReport): Promise<{ id?: string }> => {
    if (!Sentry.getClient()) {
        throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);
    }

    const { context, associatedEventId } = report;

    const attachments = buildAttachments(report);
    const hint = attachments.length > 0 ? { attachments } : {};

    const eventId = Sentry.withScope(scope => {
        // Structured, privacy-safe context travels as scope extras — never as
        // tags — so it stays searchable per-event without polluting the tag space.
        if (context.app) scope.setExtra('app', context.app);
        if (context.device) scope.setExtra('device', context.device);
        if (context.network) scope.setExtra('network', context.network);
        if (context.recentRoutes.length > 0) scope.setExtra('recentRoutes', context.recentRoutes);

        return Sentry.captureFeedback(
            {
                message: report.message,
                ...(associatedEventId ? { associatedEventId } : {}),
                tags: buildTags(report),
            },
            hint
        );
    });

    return eventId ? { id: eventId } : {};
};
