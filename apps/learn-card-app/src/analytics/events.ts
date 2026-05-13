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

    // LC-1644 perf bench (admin-only)
    BENCH_APPEVENT_RUN_TRIGGERED: 'bench_appevent_run_triggered',

    // LC-1644 frontend perf telemetry — captures user-perceived sendCredential→claim flow.
    // Joinable to backend `bench.appevent.iteration` via `run_id` when fired from the bench panel.
    FRONTEND_SENDCREDENTIAL_ITERATION: 'frontend.sendcredential.iteration',
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

    [AnalyticsEvents.BENCH_APPEVENT_RUN_TRIGGERED]: {
        run_id: string;
        iterations: number;
        warmup: number;
        listing_id: string;
        recipient_profile_id: string;
        run_label: string;
    };

    /**
     * One iteration of the user-perceived sendCredential → claim flow.
     *
     * Phases (all milliseconds, undefined when phase not reached):
     *  - request_to_response_ms: time from `learnCard.invoke.sendAppEvent` invocation
     *    to the response promise resolving. Includes network RTT + brain-service total.
     *    Joinable to backend `bench.appevent.iteration.total_ms` when both fire from
     *    the bench panel (same `run_id`).
     *  - response_to_modal_mount_ms: time from response received to `CredentialClaimModal`
     *    `useEffect` first running. Captures React state propagation + lazy modal mount cost.
     *  - modal_mount_to_credential_resolved_ms: time from modal mount to credential set in
     *    state. Should be ~0 with Tasks 1+2 (`fast_path: true`); ~500–1500ms on the
     *    URI-re-resolve fallback path.
     *  - claim_phase_ms: time from "Accept" click to `claimed=true` rendered. Covers the
     *    three-tRPC-call sequence (`addVCtoWallet`, `acceptCredential`,
     *    `queryNotifications`, `updateNotificationMeta`).
     *  - time_to_modal_interactive_ms: PERF METRIC. Time from `sendAppEvent` invocation
     *    to credential rendered in the modal — the "how long does the user wait before
     *    they can act?" number. Sum of request_to_response + response_to_modal_mount +
     *    modal_mount_to_credential_resolved. Excludes user-think-time between modal
     *    appearance and clicking Accept. This is the number to compare across A/B branches.
     *  - total_e2e_ms: WALL CLOCK. End-to-end elapsed time from `sendAppEvent` invocation
     *    to claim success state. INCLUDES the variable user-think-time between when the
     *    modal becomes interactive and when the user clicks Accept. Useful for cohort/UX
     *    analysis but NOT a perf metric — use `time_to_modal_interactive_ms` for that.
     */
    [AnalyticsEvents.FRONTEND_SENDCREDENTIAL_ITERATION]: {
        run_id: string;
        listing_id?: string;
        event_type?: string;
        outcome: 'claimed' | 'already_claimed' | 'modal_dismissed' | 'error';
        fast_path?: boolean;
        already_claimed?: boolean;
        request_to_response_ms?: number;
        response_to_modal_mount_ms?: number;
        modal_mount_to_credential_resolved_ms?: number;
        claim_phase_ms?: number;
        time_to_modal_interactive_ms?: number;
        total_e2e_ms?: number;
        error_phase?: 'request' | 'modal_mount' | 'credential_resolve' | 'claim';
        error_message?: string;
        triggered_by_bench?: boolean;
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
