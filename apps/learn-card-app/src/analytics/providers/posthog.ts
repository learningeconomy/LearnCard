import type { AnalyticsProvider, PostHogConfig } from '../types';
import type { AnalyticsEventName, EventPayload } from '../events';

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
            console.warn('[Analytics:PostHog] No API key provided, skipping initialization');
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
            });

            console.debug('[Analytics:PostHog] Initialized');
        } catch (error) {
            console.error('[Analytics:PostHog] Failed to initialize', error);
        }
    }

    async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.identify(userId, traits);
        } catch (error) {
            console.error('[Analytics:PostHog] identify error', error);
        }
    }

    async track<E extends AnalyticsEventName>(event: E, properties: EventPayload<E>): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.capture(event, properties as Record<string, unknown>);
        } catch (error) {
            console.error('[Analytics:PostHog] track error', error);
        }
    }

    async page(name: string, properties?: Record<string, unknown>): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.capture('$pageview', {
                $current_url: window.location.href,
                screen_name: name,
                ...properties,
            });
        } catch (error) {
            console.error('[Analytics:PostHog] page error', error);
        }
    }

    async reset(): Promise<void> {
        if (!this.posthog) return;

        try {
            this.posthog.reset();
        } catch (error) {
            console.error('[Analytics:PostHog] reset error', error);
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
            console.error('[Analytics:PostHog] setEnabled error', error);
        }
    }
}
