import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

import type { AnalyticsProvider } from '../types';
import type { AnalyticsEventName, EventPayload } from '../events';

/**
 * Firebase Analytics provider implementation.
 * Wraps @capacitor-firebase/analytics for use with the analytics abstraction.
 */
export class FirebaseProvider implements AnalyticsProvider {
    readonly name = 'firebase';

    async init(): Promise<void> {
        try {
            await FirebaseAnalytics.setEnabled({ enabled: true });
            console.debug('[Analytics:Firebase] Initialized');
        } catch (error) {
            console.error('[Analytics:Firebase] Failed to initialize', error);
        }
    }

    async identify(userId: string, _traits?: Record<string, unknown>): Promise<void> {
        try {
            await FirebaseAnalytics.setUserId({ userId });
        } catch (error) {
            console.error('[Analytics:Firebase] identify error', error);
        }
    }

    async track<E extends AnalyticsEventName>(event: E, properties: EventPayload<E>): Promise<void> {
        try {
            await FirebaseAnalytics.logEvent({
                name: event,
                params: properties as Record<string, unknown>,
            });
        } catch (error) {
            console.error('[Analytics:Firebase] track error', error);
        }
    }

    async page(name: string, _properties?: Record<string, unknown>): Promise<void> {
        try {
            await FirebaseAnalytics.setCurrentScreen({
                screenName: name,
                screenClassOverride: name,
            });
        } catch (error) {
            console.error('[Analytics:Firebase] page error', error);
        }
    }

    async reset(): Promise<void> {
        try {
            await FirebaseAnalytics.setUserId({ userId: null as unknown as string });
        } catch (error) {
            console.error('[Analytics:Firebase] reset error', error);
        }
    }

    async setEnabled(enabled: boolean): Promise<void> {
        try {
            await FirebaseAnalytics.setEnabled({ enabled });
        } catch (error) {
            console.error('[Analytics:Firebase] setEnabled error', error);
        }
    }
}
