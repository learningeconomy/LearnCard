/**
 * Centralized event catalog - single source of truth for all analytics events.
 * Add new events here with their corresponding payload types.
 */

export const AnalyticsEvents = {
    // Boost/Credential Claims
    CLAIM_BOOST: 'claim_boost',
    
    // Boost CMS
    BOOST_CMS_PUBLISH: 'boostCMS_publish',
    BOOST_CMS_ISSUE_TO: 'boostCMS_issue_to',
    BOOST_CMS_CONFIRMATION: 'boostCMS_confirmation',
    
    // Sharing
    GENERATE_SHARE_LINK: 'generate_share_link',
    
    // Navigation/Screens
    SCREEN_VIEW: 'screen_view',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Type-safe payload definitions for each event.
 * Extend this interface as you add new events.
 */
export interface AnalyticsEventPayloads {
    [AnalyticsEvents.CLAIM_BOOST]: {
        category?: string;
        boostType?: string;
        achievementType?: string;
        method: 'VC-API Request' | 'Dashboard' | 'Claim Modal' | 'Notification' | string;
    };

    [AnalyticsEvents.BOOST_CMS_PUBLISH]: {
        timestamp: number;
        action: 'publish' | 'publish_draft' | 'publish_live';
        boostType?: string;
        category?: string;
    };

    [AnalyticsEvents.BOOST_CMS_ISSUE_TO]: {
        timestamp: number;
        action: 'issue_to';
        boostType?: string;
        category?: string;
    };

    [AnalyticsEvents.BOOST_CMS_CONFIRMATION]: {
        timestamp: number;
        action: 'confirmation';
        boostType?: string;
        category?: string;
    };

    [AnalyticsEvents.GENERATE_SHARE_LINK]: {
        category?: string;
        boostType?: string;
        method: 'Share Boost' | string;
    };

    [AnalyticsEvents.SCREEN_VIEW]: {
        screen_name: string;
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
