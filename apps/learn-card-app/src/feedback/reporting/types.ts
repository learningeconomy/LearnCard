import type { DiagnosticLogEntry } from 'learn-card-base';

/** Destination a feedback submission is routed to. */
export type FeedbackKind = 'bug' | 'idea';

/**
 * Entry point that produced a report.
 *
 * - `shake` and `screenshot` are automatic triggers (subject to cooldown,
 *   busy-state deferral, and pending-draft expiry).
 * - `settings` and `error-boundary` are explicit user actions.
 * - `micro-feedback` is an internal compatibility source for the existing
 *   sentiment follow-up sheet, which keeps its current flow while losing its
 *   direct Sentry dependency.
 */
export type FeedbackSource =
    | 'shake'
    | 'screenshot'
    | 'settings'
    | 'error-boundary'
    | 'micro-feedback';

/** Screenshot captured before any feedback UI opens. */
export interface FeedbackScreenshot {
    dataUrl: string;
    filename: 'feedback-screenshot.png';
    contentType: 'image/png';
}

/**
 * Privacy-safe context attached to a report.
 *
 * Never includes DID, profile ID, UID, name, email, credential contents or
 * URIs, claim URLs, seeds, private keys, passwords, tokens, authorization
 * headers, the Capgo device ID, or raw URL query strings/fragments.
 */
export interface FeedbackContext {
    currentRoute: string;
    /** Last ≤10 normalized routes; consecutive duplicates collapsed. */
    recentRoutes: string[];
    /** Identifies the deployed product configuration, not the user. */
    tenantId?: string;
    app?: {
        platform: 'web' | 'ios' | 'android';
        displayVersion: string;
        nativeVersion?: string;
        nativeBuild?: string;
        bundleVersion?: string;
        channel?: string;
    };
    device?: {
        model?: string;
        manufacturer?: string;
        osLabel?: string;
        webViewVersion?: string;
        isVirtual?: boolean;
    };
    network?: {
        connected: boolean;
        label: string;
    };
    /** Sanitized diagnostic log snapshot (≤200 entries), bug reports only. */
    logs?: DiagnosticLogEntry[];
}

/** Captured-but-not-yet-submitted report state. */
export interface FeedbackDraft {
    kind: FeedbackKind;
    source: FeedbackSource;
    /** ISO-8601 capture timestamp; automatic drafts expire after the TTL. */
    capturedAt: string;
    screenshot?: FeedbackScreenshot;
    context: FeedbackContext;
    /** Sentry event ID supplied by an error boundary, when applicable. */
    associatedEventId?: string;
    /** Pre-filled composer text, when a trigger supplies one. */
    initialMessage?: string;
}

export interface FeedbackReport extends FeedbackDraft {
    message: string;
}

/** Provider-independent submission boundary; only transports import SDKs. */
export interface FeedbackTransport {
    submit(report: FeedbackReport): Promise<{ id?: string }>;
}

/** Options for the controller's bug-report entry point. */
export interface ReportProblemOptions {
    source?: FeedbackSource;
    associatedEventId?: string;
    initialMessage?: string;
    submitImmediately?: boolean;
}

/** Options for the controller's idea entry point. */
export interface ShareIdeaOptions {
    source?: FeedbackSource;
    initialMessage?: string;
}
