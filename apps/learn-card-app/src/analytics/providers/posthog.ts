import type { AnalyticsProvider, PostHogConfig } from '../types';
import type { AnalyticsEventName, EventPayload } from '../events';
import { getSharedEventContext, shouldDropEvents } from '../sharedContext';
import { getLogger } from 'learn-card-base';
const log = getLogger('posthog');

type CaptureLike = {
    properties?: Record<string, unknown>;
    $set?: Record<string, unknown>;
    $set_once?: Record<string, unknown>;
} | null;

/**
 * Query params that are safe to keep on captured URLs. Everything else
 * is stripped — claim/exchange URLs (`vc_request_url`, OIDC4VCI offers,
 * invite tokens, …) act as bearer capabilities and must never reach the
 * analytics store. Allowlist (not denylist) so new flows are safe by
 * default.
 */
const SAFE_QUERY_PARAM = /^utm_/i;

/**
 * Strip all non-allowlisted query params and the hash fragment from a
 * URL string. Non-URL strings pass through unchanged. Exported for
 * unit testing.
 */
export const scrubUrl = (value: unknown): unknown => {
    if (typeof value !== 'string' || value.length === 0) return value;

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return value;
    }

    for (const key of [...url.searchParams.keys()]) {
        if (!SAFE_QUERY_PARAM.test(key)) url.searchParams.delete(key);
    }

    url.hash = '';

    return url.toString();
};

/** PostHog property keys that carry full URLs. */
const URL_PROPERTY_KEYS = [
    '$current_url',
    '$referrer',
    '$initial_current_url',
    '$initial_referrer',
    '$session_entry_url',
];

const scrubUrlBag = (bag: Record<string, unknown> | undefined): void => {
    if (!bag) return;

    for (const key of URL_PROPERTY_KEYS) {
        if (key in bag) bag[key] = scrubUrl(bag[key]);
    }
};

/**
 * SDK-level hygiene applied to EVERY PostHog event — including
 * SDK-generated ones (`$exception`, `$rageclick`, `$pageleave`) that
 * never pass through our `track()` wrapper. Drops automation traffic,
 * scrubs sensitive query params from URL properties, and stamps the
 * enforced context LAST so it wins property collisions.
 * Exported for unit testing.
 */
export const applyPostHogHygiene = <T extends CaptureLike>(event: T): T | null => {
    if (!event) return null;
    if (shouldDropEvents()) return null;

    event.properties = { ...event.properties, ...getSharedEventContext() };

    scrubUrlBag(event.properties);
    scrubUrlBag(event.properties.$set as Record<string, unknown> | undefined);
    scrubUrlBag(event.properties.$set_once as Record<string, unknown> | undefined);
    scrubUrlBag(event.$set);
    scrubUrlBag(event.$set_once);

    return event;
};

/**
 * PostHog analytics provider implementation.
 * Lazily loads the posthog-js SDK to minimize bundle impact.
 */
export class PostHogProvider implements AnalyticsProvider {
    readonly name = 'posthog';

    private posthog: typeof import('posthog-js').default | null = null;

    private config: PostHogConfig;

    constructor(config: PostHogConfig) {
        this.config = config;
    }

    async init(): Promise<void> {
        if (!this.config.apiKey) {
            log.warn('[Analytics:PostHog] No API key provided, skipping initialization');
            return;
        }

        try {
            const posthogModule = await import('posthog-js');
            this.posthog = posthogModule.default;

            this.posthog.init(this.config.apiKey, {
                api_host: this.config.apiHost || 'https://us.i.posthog.com',
                capture_pageview: false,
                capture_pageleave: true,
                persistence: 'localStorage',
                before_send: applyPostHogHygiene,
            });

            this.posthog.register(getSharedEventContext());

            log.debug('[Analytics:PostHog] Initialized');
        } catch (error) {
            log.error('[Analytics:PostHog] Failed to initialize', error);
        }
    }

    async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.identify(userId, traits);
        } catch (error) {
            log.error('[Analytics:PostHog] identify error', error);
        }
    }

    async track<E extends AnalyticsEventName>(
        event: E,
        properties: EventPayload<E>
    ): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.capture(event, properties as Record<string, unknown>);
        } catch (error) {
            log.error('[Analytics:PostHog] track error', error);
        }
    }

    async page(name: string, properties?: Record<string, unknown>): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.capture('$pageview', {
                $current_url: scrubUrl(window.location.href),
                screen_name: name,
                ...properties,
            });
        } catch (error) {
            log.error('[Analytics:PostHog] page error', error);
        }
    }

    async reset(): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.reset();
        } catch (error) {
            log.error('[Analytics:PostHog] reset error', error);
        }
    }

    async setEnabled(enabled: boolean): Promise<void> {
        if (!this.posthog) return;

        try {
            if (enabled) {
                this.posthog.opt_in_capturing();
            } else {
                this.posthog.opt_out_capturing();
            }
        } catch (error) {
            log.error('[Analytics:PostHog] setEnabled error', error);
        }
    }
}
