/**
 * LearnCard Partner Connect SDK - Type Definitions
 */

import type {
    AppEvent as BaseAppEvent,
    AppEventResponse as BaseAppEventResponse,
    CheckCredentialEvent,
    SendCredentialEvent as BaseSendCredentialEvent,
} from '@learncard/types';
import type {
    CapturedAppManifest,
    ConsentRequest,
    InlineCredentialTemplate,
} from '@learncard/partner-connect-core';

// Re-export AppEvent types from shared types package
export type { CheckCredentialEvent };
export type {
    CapturedAppManifest,
    CapturedConsentRecord,
    CapturedTemplateRecord,
    CompiledInlineTemplate,
    ConsentRequest,
    InlineCredentialTemplate,
    InlineTemplateValidationError,
    PersonalField,
    RawInlineCredentialTemplate,
    SimpleInlineCredentialTemplate,
    VariableManifest,
    WalletCategory,
} from '@learncard/partner-connect-core';

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

    /**
     * Controls automatic **standalone mock mode**.
     *
     * When the SDK runs outside of a LearnCard host (i.e. as a top-level page,
     * not embedded in an iframe), there is no host to answer `postMessage`
     * requests, so every call would hang until it times out. Mock mode makes
     * the SDK simulate the host locally so your app is fully buildable,
     * demo-able, and testable without being embedded — and then behaves
     * identically (real host) once embedded, with no code changes.
     *
     * - `'auto'` **(default)**: mock only when **no LearnCard host is present
     *    AND the app is running on a local dev host** (`localhost`,
     *    `127.0.0.1`, `[::1]`, `*.localhost`, `*.local`). This covers local
     *    dev and local Storybook, but deliberately never fabricates identity
     *    or consent on a production or preview origin. Each mocked call
     *    surfaces a labeled toast plus a console log so it's clear the host
     *    is simulated.
     * - `'standalone'`: mock whenever **no LearnCard host is present**, on
     *    any origin — including remote deploy previews (Netlify, Lovable,
     *    Vercel, …) — and use the real host when embedded in LearnCard. The
     *    one-flag setting for apps that must demo standalone anywhere. Only
     *    choose it when a user opening your app's URL directly should see
     *    simulated data.
     * - `true`: always mock, **even when embedded in a real LearnCard host**.
     *    Use this for CI and tests; for previews that should go real once
     *    embedded, prefer `'standalone'`.
     * - `false`: never mock. Standalone calls reject immediately with
     *    `LC_NOT_EMBEDDED`. Set this in production builds meant to run only
     *    inside LearnCard.
     *
     * @default 'auto'
     */
    mock?: boolean | 'auto' | 'standalone';

    /**
     * Fine-grained configuration for standalone mock mode. Ignored when mock
     * mode is not active. See {@link MockHostOptions}.
     */
    mockOptions?: MockHostOptions;

    /**
     * How long (ms) to wait for the host to answer the one-time presence
     * probe used when the SDK is embedded in an iframe whose parent cannot
     * be confirmed as LearnCard (e.g. a same-origin Storybook canvas on
     * localhost). Only used with `mock: 'auto'` on local dev hosts.
     *
     * @default 1500
     */
    hostProbeTimeout?: number;
}

/**
 * Options controlling the behavior of standalone mock mode.
 *
 * All fields are optional; mock mode works out-of-the-box with sensible
 * defaults (visible UI, console logging, and localStorage-backed counters).
 */
export interface MockHostOptions {
    /**
     * Render lightweight visual feedback in the page: a fake credential-claim
     * modal / toast for `sendCredential`, and a "mock consent" banner for
     * `requestConsent`. Set to `false` for a headless mock (logs only).
     *
     * @default true
     */
    ui?: boolean;

    /**
     * Log every simulated host interaction to the console with a clear
     * `[LearnCard SDK · MOCK]` prefix.
     *
     * @default true
     */
    log?: boolean;

    /**
     * Persist counters (`incrementCounter` / `getCounter` / `getCounters`) to
     * `localStorage` so values survive page reloads, mirroring the real host's
     * durable per-user counters. Falls back to in-memory storage when
     * `localStorage` is unavailable.
     *
     * @default true
     */
    persist?: boolean;

    /**
     * Show the mock-mode "Publish to LearnCard" nudge once the captured app
     * manifest becomes publishable.
     *
     * @default true
     */
    publishPrompt?: boolean;

    /**
     * LearnCard origin used to build the App Store submission URL.
     *
     * @default 'https://learncard.app'
     */
    publishOrigin?: string;

    /**
     * The fake DID returned by `requestIdentity()` (and used as the mock
     * user's identity) while in mock mode.
     *
     * @default 'did:web:mock.learncard.app:user'
     */
    did?: string;

    /**
     * Namespace used to scope persisted mock data (counters, claimed
     * credentials) in `localStorage`. Change this if you run multiple mock
     * apps on the same origin and want isolated state.
     *
     * @default 'lc-mock'
     */
    namespace?: string;

    /**
     * Distinguishes your app from other apps served on the same origin
     * (e.g. multiple projects on localhost:4321). Defaults to a fingerprint
     * of the initial document.title.
     */
    appId?: string;

    /**
     * Seed the mock user's identity. Superseded per-field over the legacy
     * `did` option. Extra fields are returned as-is from `requestIdentity()`.
     */
    identity?: MockIdentitySeed;

    /**
     * Pre-populate the mock with credentials the user already holds (or has
     * issued to others). This lets you demo "happy path" states — e.g. a
     * "you already earned this" banner — without performing an action first.
     * Reads like `checkUserHasCredential`, `getTemplateRecipients`,
     * `requestLearnerContext`, and `askCredentialSearch` reflect these.
     */
    credentials?: MockCredentialSeed[];

    /**
     * Initial counter values, applied only when a counter has no persisted
     * value yet (so incremented values survive reloads).
     */
    counters?: Record<string, number>;
}

/**
 * Seed shape for the mock user's identity (see {@link MockHostOptions.identity}).
 */
export interface MockIdentitySeed {
    did?: string;
    name?: string;
    [key: string]: unknown;
}

/**
 * Seed shape for a pre-populated mock credential (see
 * {@link MockHostOptions.credentials}).
 */
export interface MockCredentialSeed {
    /** Template alias this credential was issued from. */
    templateAlias?: string;

    /** Boost URI this credential was issued from. */
    boostUri?: string;

    /** Human-readable credential name (used in toasts and mock VC data). */
    name?: string;

    /**
     * Recipient identifier (profileId or DID). Defaults to the mock user
     * (i.e. a credential the user holds). Set this to model credentials the
     * user has issued to other people.
     */
    recipient?: string;

    /** Claim status. @default 'claimed' */
    status?: 'pending' | 'claimed' | 'revoked';
}

/** Public manifest snapshot getter, available only while mock mode is active. */
export interface CapturedManifestReadable {
    getCapturedManifest(): CapturedAppManifest | undefined;
    getPublishUrl(): string | undefined;
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
 * Inline credential template input for sendCredential.
 *
 * This sends the full template definition to LearnCard at runtime, with no
 * pre-configured host template required.
 *
 * @example
 * ```typescript
 * await learnCard.sendCredential({
 *   alias: 'course-complete',
 *   template: {
 *     name: 'Completed {{courseName}}',
 *     description: 'Awarded for finishing {{courseName}}.',
 *     achievementType: 'Course',
 *     criteria: { narrative: 'Finished all modules' }
 *   },
 *   templateData: { courseName: 'Intro to Baking' }
 * });
 * ```
 */
export interface InlineTemplateCredentialInput {
    /** App-scoped alias used for duplicate checks and inline template versioning. */
    alias: string;

    /** Inline credential template definition compiled by LearnCard at issuance time. */
    template: InlineCredentialTemplate;

    /** Runtime values for the template variables. */
    templateData?: Record<string, unknown>;

    /**
     * If true, the host will return an existing credential (if present) instead of issuing a duplicate.
     */
    preventDuplicateClaim?: boolean;
}

/** Inline `send-credential` app event for zero-config issuance. */
export interface InlineTemplateSendCredentialEvent {
    type: 'send-credential';
    alias: string;
    template: InlineCredentialTemplate;
    templateData?: Record<string, unknown>;
    preventDuplicateClaim?: boolean;
}

export type SendCredentialEvent = BaseSendCredentialEvent | InlineTemplateSendCredentialEvent;
export type AppEvent = BaseAppEvent | InlineTemplateSendCredentialEvent;
export type AppEventResponse = BaseAppEventResponse;
export type SendCredentialInput = unknown | TemplateCredentialInput | InlineTemplateCredentialInput;

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

    /** Version number for inline templates sharing the same alias. */
    templateVersion?: number;

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
    scopes?: ConsentRequest;
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

    /**
     * Wait for LearnCard to finish background ConsentFlow data sync before returning context.
     * Apps that need a complete learner snapshot should set this to true.
     * @default false
     */
    waitForSync?: boolean;
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

export type LearnerContextCacheStatus =
    | 'browser-hit'
    | 'browser-miss'
    | 'backend-hit'
    | 'backend-miss'
    | 'structured';

export interface LearnerContextTimingBreakdown {
    totalMs: number;
    sdkRoundTripMs?: number;
    appEventMs?: number;
    credentialReadMs?: number;
    promptizerMs?: number;
    cacheLookupMs?: number;
    prewarmAgeMs?: number;
}

/**
 * Response from REQUEST_LEARNER_CONTEXT action
 */
export interface LearnerContextResponse {
    /** Whether the response used immediately available data or waited for a complete sync */
    status?: 'ready' | 'syncing';

    /** Current sync progress when available */
    progress?: SyncProgress;

    /** LLM-ready formatted prompt text */
    prompt: string;

    /** Raw structured data (only included when format is 'structured') */
    raw?: LearnerContextRawData;

    /** User's DID */
    did: string;

    /** User's display name if available */
    displayName?: string;

    /** Optional metadata for cache and timing diagnostics */
    metadata?: {
        cacheStatus?: LearnerContextCacheStatus;
        timings?: LearnerContextTimingBreakdown;
        backendMetadata?: Record<string, unknown>;
    };
}

export interface SyncProgress {
    totalCredentials: number;
    completedCredentials: number;
    failedCredentials: number;
    retryCount: number;
}

export interface SyncStatus {
    status: 'ready' | 'syncing' | 'error';
    progress: SyncProgress;
    eta?: number;
    lastError?: string;
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
    | 'LC_NOT_EMBEDDED'
    | 'LC_UNAUTHENTICATED'
    | 'CREDENTIAL_NOT_FOUND'
    | 'USER_REJECTED'
    | 'UNAUTHORIZED'
    | 'TEMPLATE_INVALID'
    | 'TEMPLATE_DATA_INVALID'
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
