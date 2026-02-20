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
    BOOST_CMS_DATA_ENTRY: 'boostCMS_data_entry',
    
    // Sharing & Link Generation
    GENERATE_SHARE_LINK: 'generate_share_link',
    GENERATE_CLAIM_LINK: 'generate_claim_link',
    
    // Boost Sending
    SELF_BOOST: 'self_boost',
    SEND_BOOST: 'send_boost',
    
    // Navigation/Screens
    SCREEN_VIEW: 'screen_view',

    // Authentication
    LOGIN: 'login',
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
        method: 'Earned Boost' | string;
    };

    [AnalyticsEvents.GENERATE_CLAIM_LINK]: {
        category?: string;
        boostType?: string;
        method: 'Claim Link' | string;
    };

    [AnalyticsEvents.BOOST_CMS_DATA_ENTRY]: {
        timestamp: number;
        action: 'data_entry';
        boostType?: string;
        category?: string;
    };

    [AnalyticsEvents.SELF_BOOST]: {
        category?: string;
        boostType?: string;
        method: 'Managed Boost' | string;
    };

    [AnalyticsEvents.SEND_BOOST]: {
        category?: string;
        boostType?: string;
        method: 'Managed Boost' | string;
    };

    [AnalyticsEvents.SCREEN_VIEW]: {
        screen_name: string;
    };

    [AnalyticsEvents.LOGIN]: {
        method: string;
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
