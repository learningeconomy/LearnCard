/**
 * LearnCard Partner Connect SDK
 * 
 * A Promise-based JavaScript utility for managing cross-origin message communication
 * between partner apps and the LearnCard host application.
 * 
 * @example
 * ```typescript
 * import { createPartnerConnect } from '@learncard/partner-connect';
 * 
 * const learnCard = createPartnerConnect({
 *   hostOrigin: 'https://learncard.app'
 * });
 * 
 * // Request user identity (SSO)
 * const identity = await learnCard.requestIdentity();
 * console.log('User DID:', identity.user.did);
 * ```
 */

import type {
  PartnerConnectOptions,
  IdentityResponse,
  SendCredentialResponse,
  VerifiablePresentationRequest,
  CredentialSearchResponse,
  CredentialSpecificResponse,
  ConsentResponse,
  TemplateIssueResponse,
  LearnCardError,
  PostMessageRequest,
  PostMessageResponse,
  PendingRequest,
} from './types';

export type * from './types';

/**
 * LearnCard Partner Connect SDK class
 */
export class PartnerConnect {
  /** Default host origin (security anchor) */
  public static readonly DEFAULT_HOST_ORIGIN = 'https://learncard.app';
  
  private hostOrigins: string[] = ['https://learncard.app'];
  private activeHostOrigin: string = 'https://learncard.app';
  private protocol: string = 'LEARNCARD_V1';
  private requestTimeout: number = 30000;
  private pendingRequests: Map<string, PendingRequest>;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private isInitialized = false;

  constructor(options: PartnerConnectOptions) {
    // Normalize hostOrigin to an array for whitelist validation
    const hostOrigin = options.hostOrigin || PartnerConnect.DEFAULT_HOST_ORIGIN;
    this.hostOrigins = Array.isArray(hostOrigin) ? hostOrigin : [hostOrigin];
    
    this.protocol = options.protocol || 'LEARNCARD_V1';
    this.requestTimeout = options.requestTimeout || 30000;
    this.pendingRequests = new Map();
    this.configureActiveOrigin();
    this.setupMessageListener();
  }

  /**
   * Configure the active host origin using the following hierarchy:
   * 1. Check for `lc_host_override` query parameter (for staging/testing)
   * 2. Fall back to first configured origin
   * 3. Fall back to DEFAULT_HOST_ORIGIN
   * 
   * This origin will be used for all outgoing messages and incoming message validation.
   */
  private configureActiveOrigin(): void {
    if (typeof window === 'undefined') {
      this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
      return;
    }

    try {
      // Check for lc_host_override query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const hostOverride = urlParams.get('lc_host_override');

      if (hostOverride) {
        // Validate override against whitelist (if provided)
        if (this.hostOrigins.length > 0 && !this.isOriginInWhitelist(hostOverride)) {
          console.warn(
            '[LearnCard SDK] lc_host_override value is not in the configured whitelist:',
            hostOverride,
            'Allowed:',
            this.hostOrigins
          );
          this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
        } else {
          this.activeHostOrigin = hostOverride;
          console.log('[LearnCard SDK] Using lc_host_override:', hostOverride);
        }
      } else {
        // Use first configured origin or default
        this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
        console.log('[LearnCard SDK] Using configured origin:', this.activeHostOrigin);
      }
    } catch (error) {
      console.error('[LearnCard SDK] Error configuring active origin:', error);
      this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
    }
  }

  /**
   * Check if an origin is in the configured whitelist
   */
  private isOriginInWhitelist(origin: string): boolean {
    return this.hostOrigins.includes(origin);
  }

  /**
   * Check if an event origin is valid against the active host origin
   * 
   * Security Rule: Incoming messages must exactly match the active host origin.
   * This prevents malicious actors from spoofing origins via query parameters.
   * 
   * @param eventOrigin - The origin from the MessageEvent
   * @returns true if the origin is valid
   */
  private isValidOrigin(eventOrigin: string): boolean {
    // STRICT: Exact match with active host origin only
    return eventOrigin === this.activeHostOrigin;
  }

  /**
   * Set up the central message listener to handle responses from the LearnCard host
   */
  private setupMessageListener(): void {
    if (typeof window === 'undefined') {
      throw new Error('PartnerConnect SDK can only be used in a browser environment');
    }

    this.messageListener = (event: MessageEvent) => {
      // SECURITY CHECK 1: Strict origin validation - must exactly match active host origin
      if (!this.isValidOrigin(event.origin)) {
        // Silently ignore messages from unauthorized origins
        return;
      }

      const data = event.data as PostMessageResponse;

      // SECURITY CHECK 2: Validate protocol and requestId
      if (data.protocol !== this.protocol || !data.requestId) {
        return;
      }

      // Look up the pending request
      const pending = this.pendingRequests.get(data.requestId);
      if (!pending) {
        return; // Ignore stale or unrecognized responses
      }

      // Clean up
      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(data.requestId);

      // Resolve or reject the promise
      if (data.type === 'SUCCESS') {
        pending.resolve(data.data);
      } else if (data.type === 'ERROR') {
        pending.reject(data.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' });
      }
    };

    window.addEventListener('message', this.messageListener);
    this.isInitialized = true;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(action: string): string {
    return `${action}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Send a message to the parent window and return a Promise
   */
  private sendMessage<T = unknown>(action: string, payload?: unknown): Promise<T> {
    if (!this.isInitialized) {
      return Promise.reject({
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK is not initialized',
      } as LearnCardError);
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId(action);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject({
            code: 'LC_TIMEOUT',
            message: `Request ${action} timed out after ${this.requestTimeout}ms`,
          } as LearnCardError);
        }
      }, this.requestTimeout);

      // Store the pending request
      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      // Construct the message
      const message: PostMessageRequest = {
        protocol: this.protocol,
        action,
        requestId,
        payload,
      };

      // Send to parent window with the active host origin (configured or overridden)
      window.parent.postMessage(message, this.activeHostOrigin);
    });
  }

  /**
   * Request user identity (Single Sign-On)
   * 
   * @returns Promise resolving to user identity including DID and JWT token
   * @throws {LearnCardError} When user is not authenticated or request fails
   * 
   * @example
   * ```typescript
   * const identity = await learnCard.requestIdentity();
   * console.log('User DID:', identity.user.did);
   * console.log('JWT Token:', identity.token);
   * ```
   */
  public requestIdentity(): Promise<IdentityResponse> {
    return this.sendMessage<IdentityResponse>('REQUEST_IDENTITY', { challenge: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` });
  }

  /**
   * Send a credential to the user's LearnCard wallet
   * 
   * @param credential - The verifiable credential to send
   * @returns Promise resolving to credential ID
   * 
   * @example
   * ```typescript
   * const response = await learnCard.sendCredential({
   *   '@context': ['https://www.w3.org/2018/credentials/v1'],
   *   type: ['VerifiableCredential'],
   *   credentialSubject: { id: 'did:example:123' }
   * });
   * console.log('Credential ID:', response.credentialId);
   * ```
   */
  public sendCredential(credential: unknown): Promise<SendCredentialResponse> {
    return this.sendMessage<SendCredentialResponse>('SEND_CREDENTIAL', { credential });
  }

  /**
   * Launch a feature in the LearnCard host application
   * 
   * @param featurePath - Path to the feature (e.g., '/ai/topics')
   * @param initialPrompt - Optional initial prompt or data
   * 
   * @example
   * ```typescript
   * await learnCard.launchFeature(
   *   '/ai/topics?shortCircuitStep=newTopic',
   *   'Help me understand cryptography'
   * );
   * ```
   */
  public launchFeature(featurePath: string, initialPrompt?: string): Promise<void> {
    return this.sendMessage<void>('LAUNCH_FEATURE', { featurePath, initialPrompt });
  }

  /**
   * Request credentials from the user's wallet using a query
   * 
   * @param verifiablePresentationRequest - VPR with query criteria
   * @returns Promise resolving to verifiable presentation
   * 
   * @example
   * ```typescript
   * const response = await learnCard.askCredentialSearch({
   *   query: [{
   *     type: 'QueryByTitle',
   *     credentialQuery: {
   *       reason: 'We need to verify your skills',
   *       title: 'JavaScript Expert'
   *     }
   *   }],
   *   challenge: 'challenge-123',
   *   domain: window.location.hostname
   * });
   * 
   * if (response.verifiablePresentation) {
   *   console.log('Received credentials:', response.verifiablePresentation.verifiableCredential);
   * }
   * ```
   */
  public askCredentialSearch(
    verifiablePresentationRequest: VerifiablePresentationRequest
  ): Promise<CredentialSearchResponse> {
    return this.sendMessage<CredentialSearchResponse>('ASK_CREDENTIAL_SEARCH', {
      verifiablePresentationRequest,
    });
  }

  /**
   * Request a specific credential by ID
   * 
   * @param credentialId - The ID of the credential to request
   * @returns Promise resolving to the credential
   * 
   * @example
   * ```typescript
   * const response = await learnCard.askCredentialSpecific('credential-id-123');
   * if (response.credential) {
   *   console.log('Received credential:', response.credential);
   * }
   * ```
   */
  public askCredentialSpecific(credentialId: string): Promise<CredentialSpecificResponse> {
    return this.sendMessage<CredentialSpecificResponse>('ASK_CREDENTIAL_SPECIFIC', {
      credentialId,
    });
  }

  /**
   * Request user consent for permissions
   * 
   * @param contractUri - URI of the consent contract
   * @returns Promise resolving to consent response
   * 
   * @example
   * ```typescript
   * const response = await learnCard.requestConsent('lc:network:network.learncard.com/trpc:contract:abc123');
   * if (response.granted) {
   *   console.log('User granted consent');
   * }
   * ```
   */
  public requestConsent(contractUri: string): Promise<ConsentResponse> {
    return this.sendMessage<ConsentResponse>('REQUEST_CONSENT', { contractUri });
  }

  /**
   * Initiate a template-based credential issuance flow
   * 
   * @param templateId - ID of the template/boost to issue
   * @param draftRecipients - Optional array of recipient DIDs
   * @returns Promise resolving to template issue response
   * 
   * @example
   * ```typescript
   * const response = await learnCard.initiateTemplateIssue(
   *   'lc:network:network.learncard.com/trpc:boost:xyz789',
   *   ['did:key:abc', 'did:key:def']
   * );
   * 
   * if (response.issued) {
   *   console.log('Template issued successfully');
   * }
   * ```
   */
  public initiateTemplateIssue(
    templateId: string,
    draftRecipients?: string[]
  ): Promise<TemplateIssueResponse> {
    return this.sendMessage<TemplateIssueResponse>('INITIATE_TEMPLATE_ISSUE', {
      templateId,
      draftRecipients: draftRecipients || [],
    });
  }

  /**
   * Clean up the SDK and remove event listeners
   */
  public destroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject({
        code: 'SDK_DESTROYED',
        message: 'SDK was destroyed before request completed',
      });
    }

    this.pendingRequests.clear();
    this.isInitialized = false;
  }
}

/**
 * Factory function to create a PartnerConnect instance
 * 
 * @param options - Configuration options
 * @returns PartnerConnect instance
 * 
 * @example
 * ```typescript
 * const learnCard = createPartnerConnect({
 *   hostOrigin: 'https://learncard.app',
 *   protocol: 'LEARNCARD_V1',
 *   requestTimeout: 30000
 * });
 * ```
 */
export function createPartnerConnect(options: PartnerConnectOptions): PartnerConnect {
  return new PartnerConnect(options);
}

// Default export for convenience
export default createPartnerConnect;
