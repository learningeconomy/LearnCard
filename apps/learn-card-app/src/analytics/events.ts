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

    // Pathways (see docs § 13). Phase 0 stubs — callers land in later phases.
    PATHWAYS_ONBOARD_STARTED: 'pathways.onboard.started',
    PATHWAYS_ONBOARD_SUGGESTIONS_RENDERED: 'pathways.onboard.suggestionsRendered',
    PATHWAYS_ONBOARD_SUGGESTION_ACCEPTED: 'pathways.onboard.suggestionAccepted',
    PATHWAYS_TODAY_NEXT_ACTION_SHOWN: 'pathways.today.nextActionShown',
    PATHWAYS_TODAY_NEXT_ACTION_DISMISSED: 'pathways.today.nextActionDismissed',
    PATHWAYS_NODE_TERMINATION_COMPLETED: 'pathways.node.terminationCompleted',
    PATHWAYS_PROPOSAL_CREATED: 'pathways.proposal.created',
    PATHWAYS_PROPOSAL_ACCEPTED: 'pathways.proposal.accepted',
    PATHWAYS_PROPOSAL_REJECTED: 'pathways.proposal.rejected',
    PATHWAYS_PROPOSAL_EXPIRED: 'pathways.proposal.expired',
    PATHWAYS_AGENT_BUDGET_EXCEEDED: 'pathways.agent.budgetExceeded',
    PATHWAYS_LEARNER_COST_SNAPSHOT: 'pathways.learnerCost.snapshot',
    PATHWAYS_ENDORSEMENT_REQUESTED: 'pathways.endorsement.requested',
    PATHWAYS_ENDORSEMENT_RECEIVED: 'pathways.endorsement.received',
    PATHWAYS_ENDORSEMENT_DECLINED: 'pathways.endorsement.declined',
    PATHWAYS_OFFLINE_CONFLICT: 'pathways.offline.conflict',
    PATHWAYS_PATHWAY_SWITCHED: 'pathways.pathway.switched',
    PATHWAYS_PATHWAY_REMOVED: 'pathways.pathway.removed',
    PATHWAYS_COMPOSITE_OPENED: 'pathways.composite.opened',
    PATHWAYS_CTDL_IMPORTED: 'pathways.ctdl.imported',
    PATHWAYS_CATALOG_BROWSED: 'pathways.catalog.browsed',
    PATHWAYS_CATALOG_SEARCHED: 'pathways.catalog.searched',
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

    // -- Pathways (docs § 13) ------------------------------------------------

    [AnalyticsEvents.PATHWAYS_ONBOARD_STARTED]: {
        hasWallet: boolean;
        goalMode: 'free-text' | 'template' | 'skipped';
    };

    [AnalyticsEvents.PATHWAYS_ONBOARD_SUGGESTIONS_RENDERED]: {
        latencyMs: number;
        vectorOnly: boolean;
        suggestionCount: number;
    };

    [AnalyticsEvents.PATHWAYS_ONBOARD_SUGGESTION_ACCEPTED]: {
        suggestionId: string;
        position: number;
    };

    [AnalyticsEvents.PATHWAYS_TODAY_NEXT_ACTION_SHOWN]: {
        nodeId: string;
        reasons: string[];
        topScore: number;
        runnerUpScores: number[];
        /**
         * Which selector produced this pick — `'route'` means the
         * learner's committed `chosenRoute` drove the answer (turn-
         * by-turn), `'ranking'` means the weighted scorer did. We
         * break these out so we can measure how often learners are
         * actually walking a route vs. bouncing through availability.
         */
        source?: 'route' | 'detour' | 'ranking';
        /** 1-indexed position of the pick on the chosenRoute; only set when `source === 'route'`. */
        routePosition?: number;
        /** Total chosenRoute length; only set when `source === 'route'`. */
        routeTotal?: number;
    };

    [AnalyticsEvents.PATHWAYS_TODAY_NEXT_ACTION_DISMISSED]: {
        nodeId: string;
        reasons: string[];
    };

    [AnalyticsEvents.PATHWAYS_NODE_TERMINATION_COMPLETED]: {
        nodeId: string;
        terminationKind: string;
        evidenceCount: number;
        offlineQueued: boolean;
    };

    [AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED]: {
        agent: string;
        pathwayId: string | null;
        tokensIn?: number;
        tokensOut?: number;
        latencyMs: number;
        costCents: number;
    };

    [AnalyticsEvents.PATHWAYS_PROPOSAL_ACCEPTED]: {
        proposalId: string;
        agent: string;
        ageMs: number;
    };

    [AnalyticsEvents.PATHWAYS_PROPOSAL_REJECTED]: {
        proposalId: string;
        agent: string;
        ageMs: number;
    };

    [AnalyticsEvents.PATHWAYS_PROPOSAL_EXPIRED]: {
        proposalId: string;
        agent: string;
    };

    [AnalyticsEvents.PATHWAYS_AGENT_BUDGET_EXCEEDED]: {
        agent: string;
        tier: 'low' | 'medium' | 'high';
        cappedAt:
            | 'per-invocation'
            | 'per-learner-daily'
            | 'per-learner-monthly'
            | 'per-tenant-monthly';
    };

    [AnalyticsEvents.PATHWAYS_LEARNER_COST_SNAPSHOT]: {
        learnerDid: string;
        monthToDateCents: number;
        byCapability: Record<string, number>;
    };

    [AnalyticsEvents.PATHWAYS_ENDORSEMENT_REQUESTED]: {
        nodeId: string;
        endorserRelationship: 'mentor' | 'peer' | 'guardian' | 'institution';
    };

    [AnalyticsEvents.PATHWAYS_ENDORSEMENT_RECEIVED]: {
        nodeId: string;
        endorserTrustTier: string;
        latencyMs: number;
    };

    [AnalyticsEvents.PATHWAYS_ENDORSEMENT_DECLINED]: {
        nodeId: string;
        reason?: string;
    };

    [AnalyticsEvents.PATHWAYS_OFFLINE_CONFLICT]: {
        mutationType: string;
        resolution: 'client-wins' | 'server-wins' | 'last-write-wins' | 'learner-prompt';
    };

    [AnalyticsEvents.PATHWAYS_PATHWAY_SWITCHED]: {
        fromPathwayId: string | null;
        toPathwayId: string;
        subscribedCount: number;
    };

    [AnalyticsEvents.PATHWAYS_PATHWAY_REMOVED]: {
        pathwayId: string;
        remainingCount: number;
    };

    [AnalyticsEvents.PATHWAYS_COMPOSITE_OPENED]: {
        parentPathwayId: string;
        parentNodeId: string;
        nestedPathwayId: string;
        renderStyle: 'inline-expandable' | 'link-out';
    };

    [AnalyticsEvents.PATHWAYS_CTDL_IMPORTED]: {
        ctid: string;
        nodeCount: number;
        warningCount: number;
        hasDestination: boolean;
        /**
         * Where the import originated — the curated catalog card the
         * learner clicked, or a direct CTID / URL they pasted. Lets us
         * measure whether the browse UX is actually getting used vs.
         * power users bypassing it.
         */
        importSource: 'catalog' | 'direct';
    };

    [AnalyticsEvents.PATHWAYS_CATALOG_BROWSED]: {
        /** Total entries visible at landing (after featured filter). */
        entryCount: number;
    };

    [AnalyticsEvents.PATHWAYS_CATALOG_SEARCHED]: {
        /** Length of the query string (not the string itself — no PII). */
        queryLength: number;
        /** Active tag-filter chips at search time. */
        tagCount: number;
        /** How many entries survived the filter + query. */
        resultCount: number;
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
