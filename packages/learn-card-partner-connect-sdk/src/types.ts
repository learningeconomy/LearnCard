/**
 * LearnCard Partner Connect SDK - Type Definitions
 */

// Re-export AppEvent types from shared types package
export type {
    AppEvent,
    SendCredentialEvent,
    CheckCredentialEvent,
    AppEventResponse,
} from '@learncard/types';

/**
 * Configuration options for initializing the SDK
 */
export interface PartnerConnectOptions {
    /**
     * The origin(s) of the LearnCard host.
     *
     * Each entry may be either an **exact origin** (`https://learncard.app`) or a
     * **wildcard pattern** where `*` stands in for a single DNS label portion in
     * the host portion of the origin (e.g. `https://*.learncard.app`,
     * `https://*.vetpass.app`). Wildcards are **only** allowed in the host and
     * only as label(s); the protocol and port must always match exactly.
     *
     * Wildcard patterns match any non-empty chain of labels. So
     * `https://*.learncard.app` matches both `https://staging.learncard.app` and
     * `https://pr-123.preview.learncard.app`, but **not** `https://learncard.app`
     * itself (include the bare origin explicitly if you need it) and **not**
     * `https://evil.learncard.app.attacker.com` (the suffix must match).
     *
     * **Origin Configuration Hierarchy at runtime:**
     * 1. `window.location.ancestorOrigins[0]` (when available) — the real parent
     *    origin as reported by the browser, validated against the effective
     *    whitelist. This source cannot be spoofed by a malicious query param.
     * 2. `?lc_host_override=<origin>` query parameter — validated against the
     *    whitelist. Used by the LearnCard host to tell the SDK which origin it
     *    is loading from.
     * 3. `sessionStorage['lc_host_override']` — a previously-validated override
     *    persisted across in-iframe navigation.
     * 4. First value in the configured `hostOrigin` array / single string.
     * 5. `PartnerConnect.DEFAULT_HOST_ORIGIN` (`https://learncard.app`).
     *
     * The partner app's configured whitelist is combined with a small built-in
     * list of LearnCard tenant domains (see `disableDefaultTenants` to opt out).
     * This lets a partner app work out-of-the-box inside any current or future
     * `*.learncard.app`, `*.learncard.ai`, or `*.vetpass.app` tenant without a
     * re-deploy.
     *
     * **Examples:**
     *
     * Single origin (production only):
     * ```typescript
     * hostOrigin: 'https://learncard.app'
     * ```
     *
     * Wildcard whitelist (covers staging + preview):
     * ```typescript
     * hostOrigin: ['https://learncard.app', 'https://*.learncard.app']
     * ```
     *
     * Custom tenant alongside the built-in LearnCard defaults:
     * ```typescript
     * hostOrigin: ['https://partner.example.com']
     * // learncard.app / *.learncard.app / *.learncard.ai / vetpass.app / *.vetpass.app
     * // are ALSO trusted because disableDefaultTenants is false.
     * ```
     *
     * @default 'https://learncard.app'
     */
    hostOrigin?: string | string[];

    /**
     * Opt out of the built-in LearnCard tenant whitelist.
     *
     * By default, the SDK merges `hostOrigin` with a curated list of LearnCard
     * and tenant domains (see `PartnerConnect.DEFAULT_TRUSTED_TENANTS`) so that
     * partner apps work on any LearnCard-managed tenant without reconfiguration.
     *
     * Set to `true` if you want the partner app to **only** trust the origins
     * you pass in `hostOrigin`.
     *
     * @default false
     */
    disableDefaultTenants?: boolean;

    /**
     * Whether to allow native app origins (default: true)
     *
     * @default true
     */
    allowNativeAppOrigins?: boolean;

    /**
     * Protocol identifier (default: 'LEARNCARD_V1')
     */
    protocol?: string;

    /**
     * Request timeout in milliseconds (default: 30000)
     */
    requestTimeout?: number;
}

/**
 * Identity information returned from REQUEST_IDENTITY
 */
export interface IdentityResponse {
    token: string;
    user: {
        did: string;
        [key: string]: unknown;
    };
}

/**
 * Response from SEND_CREDENTIAL action (raw credential)
 */
export interface SendCredentialResponse {
    credentialId: string;
    [key: string]: unknown;
}

/**
 * Template-based credential input for sendCredential
 * Uses a pre-configured boost template to issue a credential
 */
export interface TemplateCredentialInput {
    /** Alias of the boost template configured for this app */
    templateAlias: string;

    /** Optional template data for Mustache-style variable substitution */
    templateData?: Record<string, unknown>;

    /**
     * If true, the host will return an existing credential (if present) instead of issuing a duplicate.
     */
    preventDuplicateClaim?: boolean;
}

/**
 * Response from template-based credential issuance
 */
export interface TemplateCredentialResponse {
    /** URI of the issued credential */
    credentialUri: string;

    /** URI of the boost template used */
    boostUri: string;

    /** Whether the credential was already claimed (when preventDuplicateClaim is true) */
    alreadyClaimed?: boolean;

    /** Whether the user has the credential (when preventDuplicateClaim is true) */
    hasCredential?: boolean;

    /** The status of the credential (when preventDuplicateClaim is true) */
    status?: 'pending' | 'claimed' | 'revoked';

    /** The date the credential was received (when preventDuplicateClaim is true) */
    receivedDate?: string;

    [key: string]: unknown;
}

/**
 * Verifiable Presentation Request Query types
 */
export type VPRQuery =
    | {
          type: 'QueryByTitle';
          credentialQuery: {
              reason?: string;
              title: string;
          };
      }
    | {
          type: 'QueryByExample';
          credentialQuery: unknown;
      };

/**
 * Verifiable Presentation Request structure
 */
export interface VerifiablePresentationRequest {
    query: VPRQuery[];
    challenge: string;
    domain: string;
}

/**
 * Response from ASK_CREDENTIAL_SEARCH action
 */
export interface CredentialSearchResponse {
    verifiablePresentation?: {
        verifiableCredential: unknown[];
        [key: string]: unknown;
    };
}

/**
 * Response from ASK_CREDENTIAL_SPECIFIC action
 */
export interface CredentialSpecificResponse {
    credential?: unknown;
}

/**
 * Options for REQUEST_CONSENT action
 */
export interface RequestConsentOptions {
    /**
     * If true, redirect to contract's redirectUrl with VP after consent.
     * Default: false
     */
    redirect?: boolean;
}

/**
 * Payload for REQUEST_CONSENT action
 */
export interface RequestConsentPayload {
    /**
     * URI of the consent contract. If not provided, the system will attempt
     * to use the contract configured for the current app listing.
     */
    contractUri?: string;
    redirect?: boolean;
}

/**
 * Response from REQUEST_CONSENT action
 */
export interface ConsentResponse {
    granted: boolean;
    [key: string]: unknown;
}

/**
 * Response from INITIATE_TEMPLATE_ISSUE action
 */
export interface TemplateIssueResponse {
    issued: boolean;
    [key: string]: unknown;
}

// AppEvent, SendCredentialEvent, CheckCredentialEvent, and AppEventResponse are re-exported from @learncard/types above

/**
 * Input used to check if the authenticated user already has a credential for a boost template
 */
export type CheckCredentialInput = { templateAlias: string } | { boostUri: string };

/**
 * Response from checkUserHasCredential
 */
export interface CheckCredentialResponse {
    hasCredential: boolean;
    credentialUri?: string;
    receivedDate?: string;
    status?: 'pending' | 'claimed' | 'revoked';
}

/**
 * Input for checking template issuance status to a specific recipient.
 * The recipient can be either a DID (did:web:...) or a profileId.
 */
export type CheckIssuanceStatusInput =
    | { templateAlias: string; recipient: string }
    | { boostUri: string; recipient: string };

/**
 * Response from getTemplateIssuanceStatus
 */
export interface TemplateIssuanceStatusResponse {
    sent: boolean;
    credentialUri?: string;
    sentDate?: string;
    claimedDate?: string;
    status?: 'pending' | 'claimed' | 'revoked';
}

/**
 * Input for getting template recipients list
 */
export type GetTemplateRecipientsInput =
    | { templateAlias: string; limit?: number; cursor?: string }
    | { boostUri: string; limit?: number; cursor?: string };

/**
 * Individual recipient record in the template recipients response
 */
export interface TemplateRecipientRecord {
    recipientProfileId: string;
    recipientDisplayName?: string;
    sentDate: string;
    claimedDate?: string;
    credentialUri?: string;
    status: 'pending' | 'claimed' | 'revoked';
}

/**
 * Response from getTemplateRecipients
 */
export interface TemplateRecipientsResponse {
    records: TemplateRecipientRecord[];
    hasMore: boolean;
    cursor?: string;
    total?: number;
}

/**
 * Options for REQUEST_LEARNER_CONTEXT action
 */
export interface RequestLearnerContextOptions {
    /**
     * Whether to include credentials in the context
     * @default true
     */
    includeCredentials?: boolean;

    /**
     * Whether to include personal data (name, bio, etc.) in the context
     * @default false
     */
    includePersonalData?: boolean;

    /**
     * Format of the response
     * - 'prompt': Returns LLM-ready formatted text
     * - 'structured': Returns structured data object
     * @default 'prompt'
     */
    format?: 'prompt' | 'structured';

    /**
     * Optional instructions to guide the LLM prompt generation
     */
    instructions?: string;

    /**
     * Level of detail in the generated prompt
     * @default 'compact'
     */
    detailLevel?: 'compact' | 'expanded';
}

/**
 * Raw data included in learner context response (when format is 'structured')
 */
export interface LearnerContextRawData {
    /** Array of Verifiable Credentials */
    credentials: unknown[];

    /** Personal data if requested and available (name, bio, etc.) */
    personalData?: Record<string, unknown>;
}

/**
 * Response from REQUEST_LEARNER_CONTEXT action
 */
export interface LearnerContextResponse {
    /** LLM-ready formatted prompt text */
    prompt: string;

    /** Raw structured data (only included when format is 'structured') */
    raw?: LearnerContextRawData;

    /** User's DID */
    did: string;

    /** User's display name if available */
    displayName?: string;
}

/**
 * Keywords for next steps in summary credential data
 */
export interface SummaryCredentialKeyword {
    occupations: string[] | null;
    careers: string[] | null;
    jobs: string[] | null;
    skills: string[] | null;
    fieldOfStudy: string | null;
}

/**
 * Skill item in summary credential data
 */
export interface SummaryCredentialSkill {
    title: string;
    description: string;
}

/**
 * Next step item in summary credential data
 *
 * `keywords` is optional. Omit it entirely (or pass `undefined`) when you do not
 * have taxonomy data — you no longer need to pass a struct of `null` fields.
 */
export interface SummaryCredentialNextStep {
    title: string;
    description: string;
    keywords?: SummaryCredentialKeyword;
}

/**
 * Reflection item in summary credential data
 */
export interface SummaryCredentialReflection {
    title: string;
    description: string;
}

/**
 * Summary data for an AI Session credential
 * Contains structured information about what was learned
 */
export interface SummaryCredentialData {
    /** Short, concise title for the learning session or credential */
    title: string;
    /** Comprehensive summary of what happened during the session */
    summary: string;
    /** Bullet points of key knowledge gained */
    learned: string[];
    /** Categorized skills learned during the session */
    skills: SummaryCredentialSkill[];
    /** Recommended follow-up activities or learning modules */
    nextSteps: SummaryCredentialNextStep[];
    /** Reflections on the learning experience */
    reflections: SummaryCredentialReflection[];
}

/**
 * Input for creating and sending an AI Session credential
 */
export interface SendAiSessionCredentialInput {
    /** Title of this specific AI session */
    sessionTitle: string;
    /** Structured summary data about what was learned */
    summaryData: SummaryCredentialData;
    /** Optional metadata for the session */
    metadata?: Record<string, unknown>;
}

/**
 * Response from sending an AI Session credential
 */
export interface SendAiSessionCredentialResponse {
    /** URI of the AI Topic (parent) boost */
    topicUri: string;
    /** URI of the topic credential, if a new topic was created */
    topicCredentialUri?: string;
    /** URI of the created AI Session credential */
    sessionCredentialUri: string;
    /** URI of the session boost (child of topic) */
    sessionBoostUri: string;
    /** Whether a new topic was created (true) or existing was used (false) */
    isNewTopic: boolean;
}

/**
 * Input for sending a notification to the current user from this app.
 * The notification appears in the user's LearnCard notification inbox.
 */
export interface AppNotificationInput {
    /** Notification title */
    title?: string;

    /** Notification body text */
    body?: string;

    /** Deep link path within the app (e.g. '/prizes') */
    actionPath?: string;

    /** Grouping category (e.g. 'reward', 'announcement', 'status') */
    category?: string;

    /** Notification priority */
    priority?: 'normal' | 'high';
}

/**
 * Response from sendNotification
 */
export interface AppNotificationResponse {
    sent: boolean;
}

/**
 * Response from incrementCounter
 */
export interface IncrementCounterResponse {
    key: string;
    previousValue: number;
    newValue: number;
}

/**
 * Response from getCounter
 */
export interface GetCounterResponse {
    key: string;
    value: number;
    updatedAt: string | null;
}

/**
 * Response from getCounters
 */
export interface GetCountersResponse {
    counters: GetCounterResponse[];
}

/**
 * Error codes that can be returned by the LearnCard host
 */
export type ErrorCode =
    | 'LC_TIMEOUT'
    | 'LC_UNAUTHENTICATED'
    | 'CREDENTIAL_NOT_FOUND'
    | 'USER_REJECTED'
    | 'UNAUTHORIZED'
    | 'TEMPLATE_NOT_FOUND'
    | 'BOOST_NOT_FOUND'
    | 'INSUFFICIENT_PERMISSIONS'
    | string;

/**
 * Error object returned when a request fails.
 *
 * Historically the SDK rejected with a plain `{ code, message }` object. As of
 * v0.3.0 we reject with a {@link PartnerConnectError} instance instead, which
 * still satisfies this interface (it has both `code` and `message` fields), so
 * existing consumers that do `if (err.code === '...')` continue to work
 * unchanged.
 */
export interface LearnCardError {
    code: ErrorCode;
    message: string;
}

/**
 * Typed error class for all Partner Connect SDK rejections.
 *
 * Use `instanceof PartnerConnectError` to narrow caught errors and unlock
 * exhaustive `switch` checks on `code`. Both `code` and `message` are present
 * (so the legacy `LearnCardError` object shape is preserved), and `name` is
 * always `'PartnerConnectError'`.
 *
 * @example
 * ```typescript
 * try {
 *   await learnCard.requestLearnerContext();
 * } catch (err) {
 *   if (err instanceof PartnerConnectError) {
 *     switch (err.code) {
 *       case 'LC_UNAUTHENTICATED': showLogin(); break;
 *       case 'USER_REJECTED':      showPrivacyNotice(); break;
 *       case 'UNAUTHORIZED':       showPermissionsError(); break;
 *       default:                   console.error(err);
 *     }
 *   }
 * }
 * ```
 */
export class PartnerConnectError extends Error implements LearnCardError {
    public readonly code: ErrorCode;

    constructor(code: ErrorCode, message: string) {
        super(message);
        this.name = 'PartnerConnectError';
        this.code = code;

        // Restore prototype chain when transpiled to ES5 targets.
        Object.setPrototypeOf(this, PartnerConnectError.prototype);
    }

    /**
     * Wrap any incoming `LearnCardError`-shaped value into a `PartnerConnectError`.
     * Returns the value unchanged if it is already an instance.
     *
     * Used internally at every reject site so callers always receive a typed
     * `PartnerConnectError`, regardless of whether the failure originated from
     * the host (over postMessage), an SDK timeout, or `destroy()`.
     */
    public static from(input: LearnCardError | unknown): PartnerConnectError {
        if (input instanceof PartnerConnectError) return input;

        if (
            input &&
            typeof input === 'object' &&
            'code' in input &&
            typeof (input as { code: unknown }).code === 'string'
        ) {
            const candidate = input as { code: string; message?: unknown };
            const message =
                typeof candidate.message === 'string'
                    ? candidate.message
                    : 'Partner Connect request failed';
            return new PartnerConnectError(candidate.code as ErrorCode, message);
        }

        return new PartnerConnectError(
            'UNKNOWN_ERROR',
            input instanceof Error ? input.message : 'An unknown error occurred'
        );
    }
}

/**
 * Internal message structure sent via postMessage
 */
export interface PostMessageRequest {
    protocol: string;
    action: string;
    requestId: string;
    payload?: unknown;
}

/**
 * Internal message structure received via postMessage
 */
export interface PostMessageResponse {
    protocol: string;
    requestId: string;
    type: 'SUCCESS' | 'ERROR';
    data?: unknown;
    error?: LearnCardError;
}

/**
 * Pending request tracking structure
 */
export interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (error: LearnCardError) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}
