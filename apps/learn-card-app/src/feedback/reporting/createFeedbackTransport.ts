/**
 * Provider-independent feedback transport router (LC-2086 Task 6).
 *
 * Routes a `FeedbackReport` by kind:
 *
 *   - `bug` → the Sentry adapter (`submitSentryFeedback`); analytics is never
 *     touched, so bug diagnostics cannot leak into PostHog.
 *   - `idea` → the dedicated typed `AnalyticsProvider.submitFeedbackIdea`
 *     operation. Only source, message, currentRoute, and appVersion travel to
 *     analytics. If the user explicitly attaches a screenshot, a separate
 *     privacy-safe Sentry feedback event carries that attachment.
 *
 * An unready provider or a non-PostHog provider is treated as a retryable
 * submission failure: the idea rejects with the friendly transport error and is
 * never reported as success through the noop provider.
 */

import type { FeedbackIdeaPayload } from '../../analytics/events';
import { FEEDBACK_TRANSPORT_ERROR_MESSAGE, submitSentryFeedback } from './sentryFeedbackTransport';
import type { FeedbackTransport } from './types';

/**
 * Analytics surface consumed by the transport. Mirrors the relevant subset of
 * `useAnalytics()` so the host can wire it without pulling in React context.
 */
export interface FeedbackAnalyticsAdapter {
    /** Idea-specific operation that rejects when stateless delivery is unavailable. */
    submitFeedbackIdea(properties: FeedbackIdeaPayload): Promise<unknown>;
    /** Whether the lazily-loaded provider finished initializing. */
    isReady: boolean;
    /** Active provider name (`'posthog'` is the only idea-capable provider). */
    providerName: string;
}

/**
 * Create a `FeedbackTransport` bound to the app's analytics provider.
 *
 * Bugs are submitted to Sentry immediately; ideas are tracked as
 * `feedback_idea_submitted` once the PostHog provider is ready. Idea
 * screenshots are additionally delivered through Sentry because analytics
 * events do not provide an attachment channel.
 */
export const createFeedbackTransport = (
    analytics: FeedbackAnalyticsAdapter
): FeedbackTransport => ({
    submit: async report => {
        if (report.kind === 'bug') {
            return submitSentryFeedback(report);
        }

        if (!analytics.isReady || analytics.providerName !== 'posthog') {
            // Retryable failure: eligibility already ensures analytics-enabled
            // users reach this path only via a momentarily unready or swapped
            // provider — never report success through the noop provider.
            throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);
        }

        try {
            await analytics.submitFeedbackIdea({
                source: report.source,
                message: report.message,
                currentRoute: report.context.currentRoute,
                appVersion: report.context.app?.displayVersion,
            });
            if (report.screenshot) await submitSentryFeedback(report);
        } catch {
            throw new Error(FEEDBACK_TRANSPORT_ERROR_MESSAGE);
        }

        // Ideas have no provider-side event ID; acceptance is success.
        return {};
    },
});
