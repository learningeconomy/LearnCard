/**
 * LearnCard Partner Connect SDK - Type Definitions
 */

/**
 * Configuration options for initializing the SDK
 */
export interface PartnerConnectOptions {
  /**
   * The origin of the LearnCard host (e.g., 'https://learncard.app')
   * All messages will be validated against this origin for security
   */
  hostOrigin?: string;

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
 * Response from SEND_CREDENTIAL action
 */
export interface SendCredentialResponse {
  credentialId: string;
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
  timeoutId: NodeJS.Timeout;
}
