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

    // Pathways — ActionDescriptor dispatch (docs § 3.7).
    // Fires when a learner activates a node's primary CTA. `kind`
    // carries the resolved `ActionDescriptor.kind` (including `none`
    // for local-only nodes that fall back to the NodeDetail overlay);
    // `source` is `'explicit' | 'earn-url' | 'mcp-policy' | 'none'`
    // so we can measure how often authored descriptors drive dispatch
    // versus legacy-field fallbacks.
    PATHWAYS_ACTION_DISPATCHED: 'pathways.action.dispatched',

    // Pathways — OutcomeSignal lifecycle (docs § 3.8).
    PATHWAYS_OUTCOME_AUTOBIND_PROPOSED: 'pathways.outcome.autobindProposed',
    PATHWAYS_OUTCOME_BOUND: 'pathways.outcome.bound',
    PATHWAYS_OUTCOME_BINDING_CLEARED: 'pathways.outcome.bindingCleared',

    // OpenID4VC / OpenID4VP
    /**
     * Fired when a user explicitly taps "Tell LearnCard about this" on an
     * OID4VC/VP exchange error screen. Distinct from a Sentry exception
     * — this is product-prioritization signal (which formats / verifiers
     * are users *trying* to use), not a crash report.
     */
    OPENID_EXCHANGE_ERROR_REPORTED: 'openid_exchange_error_reported',

    /**
     * One attempt of an OID4VC/VP exchange under the resilience
     * orchestrator. Emits once per strategy attempt (success or
     * failure). Joinable across attempts by `exchange_run_id`.
     */
    OPENID_RESILIENCE_ATTEMPT: 'openid_resilience_attempt',

    /**
     * Recovery decision the orchestrator made after a failed attempt.
     * Joinable to the failed attempt by `exchange_run_id` +
     * `attempt_number`.
     */
    OPENID_RESILIENCE_DECISION: 'openid_resilience_decision',

    /**
     * Final outcome of an exchange that went through the resilience
     * orchestrator. Lets product see "% of exchanges that succeeded
     * after fallback" and "% that surfaced error after exhaustion".
     */
    OPENID_RESILIENCE_OUTCOME: 'openid_resilience_outcome',

    /** 
     * Fired when the resilience orchestrator gave up on an error
     * whose classified `kind` suggested it might have been
     * recoverable (wallet / request_invalid / unknown). Used to mine
     * production for new signer-failure patterns: filter on
     * `pattern_matched=false` in the dashboard to find shapes worth
     * adding to STRUCTURED_SIGNER_FAILURES or SIGNER_FAILURE_PATTERNS.
     * Payload omits raw message text (PII risk) — only a stable hash
     * is included.
     */
    OPENID_RESILIENCE_UNRECOGNIZED_FAILURE: 'openid_resilience_unrecognized_failure',
    /**
     * Fired every time a claim-input string is routed (camera scan,
     * paste field, image upload, clipboard auto-detect). Lets product
     * answer "where do users actually claim from?" and "what fraction
     * of pastes are unrecognized?".
     */
    CLAIM_INPUT_ROUTED: 'claim_input_routed',

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
         * learner clicked, a direct CTID / URL they pasted, or the
         * cold-start `DiscoverStart` showcase picker on
         * `/pathways/onboard`. Lets us measure whether the browse UX
         * is actually getting used vs. power users bypassing it, and
         * how often new learners pick a showcase to demo with versus
         * describing their own goal.
         */
        importSource: 'catalog' | 'direct' | 'onboard';
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

    // -- Pathways — action dispatch (docs § 3.7) ----------------------------

    [AnalyticsEvents.PATHWAYS_ACTION_DISPATCHED]: {
        nodeId: string;
        /** Resolved `ActionDescriptor.kind` at click time. */
        kind:
            | 'in-app-route'
            | 'app-listing'
            | 'ai-session'
            | 'external-url'
            | 'mcp-tool'
            | 'none';
        /** How the resolver arrived at that kind. */
        source: 'explicit' | 'earn-url' | 'mcp-policy' | 'none';
        /**
         * Coarse destination label — a URL, route path, listing id,
         * or literal like `'in-app:node-detail'`. Never carries learner
         * PII (query strings are safe because our in-app hrefs don't
         * embed identifiers, but callers should avoid building hrefs
         * that do).
         */
        destination: string;
    };

    // -- Pathways — outcome signal lifecycle (docs § 3.8) -------------------

    [AnalyticsEvents.PATHWAYS_OUTCOME_AUTOBIND_PROPOSED]: {
        pathwayId: string;
        outcomeId: string;
        signalKind: string;
        issuerTrustTier: 'self' | 'peer' | 'trusted' | 'institution';
        /** The VC's numeric value when the signal is `score-threshold`. */
        observedValue?: number | string;
        outOfWindow: boolean;
    };

    [AnalyticsEvents.PATHWAYS_OUTCOME_BOUND]: {
        pathwayId: string;
        outcomeId: string;
        signalKind: string;
        boundVia: 'auto' | 'manual';
        outOfWindow: boolean;
    };

    [AnalyticsEvents.PATHWAYS_OUTCOME_BINDING_CLEARED]: {
        pathwayId: string;
        outcomeId: string;
        /** Why we cleared — learner disputed, issuer revoked, etc. */
        reason?: string;
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

    [AnalyticsEvents.OPENID_RESILIENCE_ATTEMPT]: {
        surface: 'vci' | 'vp';
        exchange_run_id: string;
        attempt_number: number;
        strategy_id: string;
        strategy_axis: 'signer' | 'transport' | 'trust';
        outcome: 'succeeded' | 'failed';
        duration_ms: number;
        error_kind?:
            | 'format_gap'
            | 'trust_gap'
            | 'transport'
            | 'request_invalid'
            | 'wallet'
            | 'unknown';
        counterparty?: string;
    };

    [AnalyticsEvents.OPENID_RESILIENCE_DECISION]: {
        surface: 'vci' | 'vp';
        exchange_run_id: string;
        attempt_number: number;
        decision: 'retry_silent' | 'retry_with_prompt' | 'surface_error';
        next_strategy_id?: string;
        next_strategy_axis?: 'signer' | 'transport' | 'trust';
        prompt_severity?: 'info' | 'warning';
        backoff_ms?: number;
    };

    [AnalyticsEvents.OPENID_RESILIENCE_OUTCOME]: {
        surface: 'vci' | 'vp';
        exchange_run_id: string;
        outcome:
            | 'success_first_attempt'
            | 'success_after_fallback'
            | 'failure_user_cancelled'
            | 'failure_exhausted';
        total_attempts: number;
        signers_tried: string[];
        transport_retries: number;
        trust_gaps_accepted: number;
        final_error_kind?:
            | 'format_gap'
            | 'trust_gap'
            | 'transport'
            | 'request_invalid'
            | 'wallet'
            | 'unknown';
        counterparty?: string;
        total_duration_ms: number;
    };

    [AnalyticsEvents.OPENID_RESILIENCE_UNRECOGNIZED_FAILURE]: {
        surface: 'vci' | 'vp';
        exchange_run_id: string;
        attempt_number: number;
        error_kind: 'wallet' | 'request_invalid' | 'unknown';
        error_name?: string;
        error_code?: string;
        http_status?: number;
        message_hash: string;
        pattern_matched: boolean;
        signers_tried: string[];
        counterparty?: string;
    };

    [AnalyticsEvents.CLAIM_INPUT_ROUTED]: {
        source: 'camera' | 'paste' | 'image_upload' | 'clipboard_auto';
        parsed_kind:
            | 'oid4vci'
            | 'oid4vp'
            | 'vc-api-custom-scheme'
            | 'lcw-https'
            | 'boost-claim'
            | 'connection-request'
            | 'raw-vc-candidate'
            | 'interaction-url'
            | 'unrecognized';
        outcome:
            | 'routed'
            | 'open_contact'
            | 'open_claim_boost'
            | 'open_claim_vc'
            | 'open_website'
            | 'unrecognized';
        unrecognized_reason?:
            | 'empty'
            | 'malformed_url'
            | 'unknown_scheme'
            | 'invalid_vc'
            | 'unknown_format';
        surface?:
            | 'oid4vci'
            | 'oid4vp'
            | 'vc-api-custom-scheme'
            | 'lcw-https'
            | 'boost-claim'
            | 'connection-request'
            | 'raw-vc'
            | 'interaction';
    };
}

/**
 * Helper type to get the payload type for a specific event.
 */
export type EventPayload<E extends AnalyticsEventName> = E extends keyof AnalyticsEventPayloads
    ? AnalyticsEventPayloads[E]
    : Record<string, unknown>;
