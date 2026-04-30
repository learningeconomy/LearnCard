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
    SEND_BOOST_WITH_ATTACHMENTS: 'send_boost_with_attachments',
    
    // Navigation/Screens
    SCREEN_VIEW: 'screen_view',

    // Authentication
    LOGIN: 'login',

    // AI Features
    AI_CHAT_SESSION_STARTED: 'ai_chat_session_started',
    AI_INSIGHTS_TAB_SWITCHED: 'ai_insights_tab_switched',

    // Onboarding
    ONBOARDING_COMPLETED: 'onboarding_completed',

    // Consent Flow
    CONSENT_FLOW_STARTED: 'consent_flow_started',
    CONSENT_FLOW_ACCEPTED: 'consent_flow_accepted',

    // LaunchPad
    LAUNCHPAD_APP_CLICKED: 'launchpad_app_clicked',
    LAUNCHPAD_QUICKNAV_ACTION_CLICKED: 'launchpad_quicknav_action_clicked',
    LAUNCHPAD_APP_INSTALLED: 'launchpad_app_installed',

    // OpenID4VC / OpenID4VP
    /**
     * Fired when a user explicitly taps "Tell LearnCard about this" on an
     * OID4VC/VP exchange error screen. Distinct from a Sentry exception
     * — this is product-prioritization signal (which formats / verifiers
     * are users *trying* to use), not a crash report.
     */
    OPENID_EXCHANGE_ERROR_REPORTED: 'openid_exchange_error_reported',
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

    [AnalyticsEvents.SEND_BOOST_WITH_ATTACHMENTS]: {
        category?: string;
        boostType?: string;
        method: 'Managed Boost' | string;
        recipientCount: number;
        recipientsWithAttachments: number;
        totalAttachments: number;
        attachmentTypeCounts: Record<string, number>;
        perRecipient: Array<{ attachmentCount: number; types: string[] }>;
    };

    [AnalyticsEvents.SCREEN_VIEW]: {
        screen_name: string;
    };

    [AnalyticsEvents.LOGIN]: {
        method: string;
    };

    [AnalyticsEvents.AI_CHAT_SESSION_STARTED]: {
        topic?: string;
        appType: 'internal' | 'external';
        appName?: string;
    };

    [AnalyticsEvents.AI_INSIGHTS_TAB_SWITCHED]: {
        tab: string;
    };

    [AnalyticsEvents.ONBOARDING_COMPLETED]: {
        role?: string;
        country?: string;
    };

    [AnalyticsEvents.CONSENT_FLOW_STARTED]: {
        contractName?: string;
    };

    [AnalyticsEvents.CONSENT_FLOW_ACCEPTED]: {
        contractName?: string;
        alreadyConsented: boolean;
    };

    [AnalyticsEvents.LAUNCHPAD_APP_CLICKED]: {
        appName: string;
        appId: string;
        action: 'connect' | 'open';
        appType?: string;
    };

    [AnalyticsEvents.LAUNCHPAD_QUICKNAV_ACTION_CLICKED]: {
        action: string;
        role: string;
    };

    [AnalyticsEvents.LAUNCHPAD_APP_INSTALLED]: {
        appName: string;
        appId: string;
        category?: string;
    };

    [AnalyticsEvents.OPENID_EXCHANGE_ERROR_REPORTED]: {
        /** Which OID4VC surface the error came from. */
        surface: 'vci' | 'vp';
        /**
         * UX-meaningful classification from `FriendlyErrorInfo.kind`. Use
         * this for top-level dashboards — "how many trust gaps this
         * week?" "which formats are users hitting most?".
         */
        kind: 'format_gap' | 'trust_gap' | 'transport' | 'request_invalid' | 'wallet' | 'unknown';
        /**
         * Stable plugin-side error code when present (e.g.
         * `unsupported_client_id_scheme`, `unknown_credential_format`).
         * Useful for drilling down inside a `kind`.
         */
        code?: string;
        /**
         * `error.name` from the plugin (`VciError`, `RequestObjectError`,
         * …). Lets us split aggregate counts by which plugin module
         * surfaced the error.
         */
        errorName?: string;
        /**
         * Sanitized counterparty identifier — verifier `client_id` (host
         * only) or issuer URL (host only). Never carries query strings,
         * user secrets, or PII. `undefined` when we couldn't extract
         * anything safe to log.
         */
        counterparty?: string;
        /**
         * Optional free-text the user typed into the report textarea.
         * Treat as user-supplied PII downstream; do not enrich with
         * automatic classification.
         */
        userNote?: string;
        /** Wallet build version (from package.json). */
        walletVersion?: string;
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
