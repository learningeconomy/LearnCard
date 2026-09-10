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
 *   - screenshot (image data URL → `Uint8Array`) and diagnostic logs (pretty
 *     JSON → `Uint8Array`) as event-hint attachments,
 *   - structured privacy-safe app/device/network context as scope extras,
 *     never as tags.
 *
 * Never persists reports, screenshots, or logs. Rejects with the friendly
 * transport error when there is no Sentry client rather than claiming success.
 */

import * as Sentry from '@sentry/react';
import type { Event } from '@sentry/react';

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

/** Decode a base64 image data URL into attachment bytes. */
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

/** Context fields approved for the feedback event's non-indexed extras. */
const buildExtras = (report: FeedbackReport): Record<string, unknown> => {
    const extras: Record<string, unknown> = {};
    const { app, device, network, recentRoutes } = report.context;

    if (app) extras.app = app;
    if (device) extras.device = device;
    if (network) extras.network = network;
    if (recentRoutes.length > 0) extras.recentRoutes = recentRoutes;

    return extras;
};

/**
 * Reconstruct a feedback event from an explicit allowlist.
 *
 * Sentry 8 merges global and isolation scopes before running a supplied
 * scope's processors. Rebuilding here therefore removes identified user
 * state, breadcrumbs, and every unapproved tag/context/extra. The same
 * reconstruction runs once more in `beforeSendEvent`, after Sentry adds its
 * propagation trace, so the transported envelope cannot regain trace data.
 */
const buildAllowlistedEvent = (event: Event, report: FeedbackReport): Event => {
    const extras = buildExtras(report);
    const feedback = {
        message: report.message,
        ...(report.associatedEventId ? { associated_event_id: report.associatedEventId } : {}),
    };

    return {
        ...(event.event_id ? { event_id: event.event_id } : {}),
        ...(event.timestamp ? { timestamp: event.timestamp } : {}),
        ...(event.environment ? { environment: event.environment } : {}),
        ...(event.release ? { release: event.release } : {}),
        ...(event.dist ? { dist: event.dist } : {}),
        ...(event.platform ? { platform: event.platform } : {}),
        ...(event.sdk ? { sdk: event.sdk } : {}),
        type: 'feedback',
        level: 'info',
        contexts: { feedback },
        tags: buildTags(report),
        ...(Object.keys(extras).length > 0 ? { extra: extras } : {}),
    };
};

/** Mutate the SDK's final event object immediately before envelope creation. */
const applyAllowlistInPlace = (event: Event, report: FeedbackReport): void => {
    const allowlisted = buildAllowlistedEvent(event, report);

    for (const key of Object.keys(event)) delete (event as Record<string, unknown>)[key];
    Object.assign(event, allowlisted);
};

/** Generate the 32-hex event id accepted by the Sentry envelope protocol. */
const createFeedbackEventId = (): string => {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const SENTRY_DELIVERY_TIMEOUT_MS = 5_000;

/**
 * Submit a feedback report to Sentry and resolve with the feedback event ID.
 *
 * Rejects with the friendly transport error when no Sentry client is
 * available — success is never claimed for an undelivered report.
 */
export const submitSentryFeedback = async (report: FeedbackReport): Promise<{ id?: string }> => {
    const client = Sentry.getClient();
    if (!client) {
        throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);
    }

    const attachments = buildAttachments(report);
    const eventId = createFeedbackEventId();
    const hint = {
        event_id: eventId,
        ...(attachments.length > 0 ? { attachments } : {}),
    };

    // A new Scope has no client in Sentry 8.34. Bind the installed client so
    // captureFeedback actually enters the delivery pipeline.
    const feedbackScope = new Sentry.Scope();
    feedbackScope.setClient(client);
    feedbackScope.addEventProcessor(event => buildAllowlistedEvent(event, report));

    const stopFinalAllowlist = client.on('beforeSendEvent', event => {
        if (event.event_id === eventId) applyAllowlistInPlace(event, report);
    });

    let deliveryTimeout: ReturnType<typeof setTimeout> | undefined;
    let resolveDeliveryStatus: (status: number | undefined) => void = () => undefined;
    const deliveryStatusPromise = new Promise<number | undefined>(resolve => {
        resolveDeliveryStatus = resolve;
        deliveryTimeout = setTimeout(() => resolve(undefined), SENTRY_DELIVERY_TIMEOUT_MS);
    });
    const stopDeliveryObserver = client.on('afterSendEvent', (event, response) => {
        if (event.event_id !== eventId) return;

        clearTimeout(deliveryTimeout);
        resolveDeliveryStatus(response?.statusCode);
    });

    try {
        const capturedEventId = Sentry.captureFeedback(
            {
                message: report.message,
                ...(report.associatedEventId
                    ? { associatedEventId: report.associatedEventId }
                    : {}),
                tags: buildTags(report),
            },
            hint,
            feedbackScope
        );

        // Sentry's transport buffer can report itself flushed one microtask
        // before `afterSendEvent` publishes the HTTP acknowledgement. Wait for
        // both signals so a successful 2xx delivery cannot be reported as a
        // failure merely because that observer callback has not run yet.
        const [flushed, deliveryStatus] = await Promise.all([
            client.flush(SENTRY_DELIVERY_TIMEOUT_MS),
            deliveryStatusPromise,
        ]);
        const delivered =
            capturedEventId === eventId &&
            flushed &&
            deliveryStatus !== undefined &&
            deliveryStatus >= 200 &&
            deliveryStatus < 300;

        if (!delivered) throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);

        return { id: eventId };
    } catch {
        throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);
    } finally {
        clearTimeout(deliveryTimeout);
        stopFinalAllowlist();
        stopDeliveryObserver();
    }
};
