import type { AnalyticsEventName, EventPayload } from './events';

/**
 * Interface that all analytics providers must implement.
 * This abstraction allows swapping providers without changing application code.
 */
export interface AnalyticsProvider {
    /**
     * Provider name for debugging/logging purposes.
     */
    readonly name: string;

    /**
     * Initialize the analytics provider.
     * Called once when the provider is loaded.
     */
    init(): Promise<void>;

    /**
     * Identify the current user.
     * @param userId - Unique user identifier (e.g., DID)
     * @param traits - Optional user properties/traits
     */
    identify(userId: string, traits?: Record<string, unknown>): Promise<void>;

    /**
     * Track an analytics event with type-safe payloads.
     * @param event - Event name from the event catalog
     * @param properties - Event-specific properties
     */
    track<E extends AnalyticsEventName>(event: E, properties: EventPayload<E>): Promise<void>;

    /**
     * Track a page/screen view.
     * @param name - Screen or page name
     * @param properties - Optional additional properties
     */
    page(name: string, properties?: Record<string, unknown>): Promise<void>;

    /**
     * Reset the current user session (e.g., on logout).
     */
    reset(): Promise<void>;

    /**
     * Enable or disable analytics collection.
     * @param enabled - Whether analytics should be enabled
     */
    setEnabled(enabled: boolean): Promise<void>;
}

/**
 * Configuration for PostHog provider.
 */
export interface PostHogConfig {
    apiKey: string;
    apiHost?: string;
}

/**
 * Supported analytics provider names.
 */
export type AnalyticsProviderName = 'posthog' | 'firebase' | 'noop';
