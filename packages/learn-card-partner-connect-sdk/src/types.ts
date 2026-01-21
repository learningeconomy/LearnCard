/**
 * LearnCard Partner Connect SDK - Type Definitions
 */

// Re-export AppEvent types from shared types package
export type { AppEvent, SendCredentialEvent, AppEventResponse } from '@learncard/types';

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
}

/**
 * Response from template-based credential issuance
 */
export interface TemplateCredentialResponse {
    /** URI of the issued credential */
    credentialUri: string;

    /** URI of the boost template used */
    boostUri: string;

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

// AppEvent, SendCredentialEvent, and AppEventResponse are re-exported from @learncard/types above

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
