import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Capacitor } from '@capacitor/core';
import { getLogger } from 'learn-card-base/logging/logger';
const log = getLogger('firebase');

import type { AnalyticsProvider } from '../types';
import type { AnalyticsEventName, EventPayload, FeedbackIdeaPayload } from '../events';

/**
 * Firebase Analytics provider implementation.
 * Wraps @capacitor-firebase/analytics for use with the analytics abstraction.
 */
export class FirebaseProvider implements AnalyticsProvider {
    readonly name = 'firebase';

    private static started = false;

    /** Stop an active SDK without initializing web analytics just to disable it. */
    static async disableCollectionIfStarted(): Promise<void> {
        if (!Capacitor.isNativePlatform() && !FirebaseProvider.started) return;
        await FirebaseAnalytics.setEnabled({ enabled: false });
    }

    async init(): Promise<void> {
        try {
            FirebaseProvider.started = true;
            await FirebaseAnalytics.setEnabled({ enabled: true });
            log.debug('[Analytics:Firebase] Initialized');
        } catch (error) {
            log.error('[Analytics:Firebase] Failed to initialize', error);
        }
    }

    async identify(userId: string, _traits?: Record<string, unknown>): Promise<void> {
        try {
            await FirebaseAnalytics.setUserId({ userId });
        } catch (error) {
            log.error('[Analytics:Firebase] identify error', error);
        }
    }

    async track<E extends AnalyticsEventName>(
        event: E,
        properties: EventPayload<E>
    ): Promise<void> {
        try {
            await FirebaseAnalytics.logEvent({
                name: event,
                params: properties as Record<string, unknown>,
            });
        } catch (error) {
            log.error('[Analytics:Firebase] track error', error);
        }
    }

    async submitFeedbackIdea(_properties: FeedbackIdeaPayload): Promise<void> {
        throw new Error('Anonymous analytics is unavailable');
    }

    async page(name: string, _properties?: Record<string, unknown>): Promise<void> {
        try {
            await FirebaseAnalytics.setCurrentScreen({
                screenName: name,
                screenClassOverride: name,
            });
        } catch (error) {
            log.error('[Analytics:Firebase] page error', error);
        }
    }

    async reset(): Promise<void> {
        try {
            await FirebaseAnalytics.setUserId({ userId: null as unknown as string });
        } catch (error) {
            log.error('[Analytics:Firebase] reset error', error);
        }
    }

    async setEnabled(enabled: boolean): Promise<void> {
        try {
            if (enabled) {
                FirebaseProvider.started = true;
                await FirebaseAnalytics.setEnabled({ enabled: true });
            } else {
                await FirebaseProvider.disableCollectionIfStarted();
            }
        } catch (error) {
            log.error('[Analytics:Firebase] setEnabled error', error);
        }
    }
}
