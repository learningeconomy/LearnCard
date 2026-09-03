import type { AnalyticsProvider } from '../types';
import type { AnalyticsEventName, EventPayload, FeedbackIdeaPayload } from '../events';
import { getLogger } from 'learn-card-base';
import { environment } from '../../config/environment';
const log = getLogger('noop');

/**
 * No-op analytics provider.
 * Used as fallback when no provider is configured, or for development/testing.
 * All methods are no-ops that resolve immediately.
 */
export class NoopProvider implements AnalyticsProvider {
    readonly name = 'noop';

    async init(): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] Initialized (no-op mode)');
        }
    }

    async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] identify', { userId, traits });
        }
    }

    async track<E extends AnalyticsEventName>(
        event: E,
        properties: EventPayload<E>
    ): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] track', { event, properties });
        }
    }

    async submitFeedbackIdea(_properties: FeedbackIdeaPayload): Promise<void> {
        throw new Error('Anonymous analytics is unavailable');
    }

    async page(name: string, properties?: Record<string, unknown>): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] page', { name, properties });
        }
    }

    async reset(): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] reset');
        }
    }

    async setEnabled(_enabled: boolean): Promise<void> {
        if (environment.DEV) {
            log.debug('[Analytics:Noop] setEnabled', { enabled: _enabled });
        }
    }
}
