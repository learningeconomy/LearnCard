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
     * The origin(s) of the LearnCard host
     *
     * This can be a single string or an array of strings to serve as a whitelist for
     * the `lc_host_override` query parameter.
     *
     * **Origin Configuration Hierarchy:**
     * 1. **Hardcoded Default**: `https://learncard.app` (security anchor)
     * 2. **Query Parameter Override**: `?lc_host_override=https://staging.learncard.app`
     *    - Checked against whitelist if `hostOrigin` is provided
     *    - Used for staging/testing environments
     * 3. **Configured Origin**: First value in array or single string value
     *
     * **Security Model:**
     * - The SDK enforces STRICT origin validation
     * - Incoming messages must EXACTLY match the active host origin
     * - Prevents origin spoofing: even if malicious query param is added,
     *   messages from unauthorized origins are rejected
     *
     * **Examples:**
     *
     * Single origin (production):
     * ```typescript
     * hostOrigin: 'https://learncard.app'
     * // Uses: https://learncard.app
     * // Override: ?lc_host_override=https://staging.learncard.app (not validated)
     * ```
     *
     * Multiple origins (whitelist for staging):
     * ```typescript
     * hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
     * // Default: https://learncard.app
     * // Override: ?lc_host_override=https://staging.learncard.app (validated)
     * // Invalid: ?lc_host_override=https://evil.com (rejected)
     * ```
     *
     * @default 'https://learncard.app'
     */
    hostOrigin?: string | string[];

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
 */
export interface SummaryCredentialNextStep {
    title: string;
    description: string;
    keywords: SummaryCredentialKeyword;
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
    /** URI of the created AI Session credential */
    sessionCredentialUri: string;
    /** URI of the session boost (child of topic) */
    sessionBoostUri: string;
    /** Whether a new topic was created (true) or existing was used (false) */
    isNewTopic: boolean;
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
 * Error object returned when a request fails
 */
export interface LearnCardError {
    code: ErrorCode;
    message: string;
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
