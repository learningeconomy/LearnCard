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
    TemplateCredentialInput,
    TemplateCredentialResponse,
    VerifiablePresentationRequest,
    CredentialSearchResponse,
    CredentialSpecificResponse,
    ConsentResponse,
    RequestConsentOptions,
    TemplateIssueResponse,
    CheckCredentialInput,
    CheckCredentialResponse,
    CheckIssuanceStatusInput,
    TemplateIssuanceStatusResponse,
    GetTemplateRecipientsInput,
    TemplateRecipientsResponse,
    RequestLearnerContextOptions,
    LearnerContextResponse,
    SendAiSessionCredentialInput,
    SendAiSessionCredentialResponse,
    AppNotificationInput,
    AppNotificationResponse,
    IncrementCounterResponse,
    GetCounterResponse,
    GetCountersResponse,
    AppEvent,
    AppEventResponse,
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

    /**
     * Built-in list of LearnCard-managed tenant origins.
     *
     * These are merged with the partner app's configured `hostOrigin` whitelist
     * unless `disableDefaultTenants: true` is passed. This lets a partner app
     * run inside any current or future LearnCard tenant (staging, preview,
     * VetPass, etc.) without needing a re-deploy each time a new tenant is
     * onboarded.
     *
     * Patterns follow the same rules as user-supplied `hostOrigin` entries:
     * `*` is a wildcard for one or more DNS labels in the host portion.
     */
    public static readonly DEFAULT_TRUSTED_TENANTS: readonly string[] = [
        'https://learncard.app',
        'https://*.learncard.app',
        'https://*.learncard.ai',
        'https://vetpass.app',
        'https://*.vetpass.app',
    ];

    private hostOrigins: string[] = ['https://learncard.app'];
    private activeHostOrigin: string = 'https://learncard.app';
    private allowNativeAppOrigins: boolean = true;
    private protocol: string = 'LEARNCARD_V1';
    private requestTimeout: number = 30000;
    private pendingRequests: Map<string, PendingRequest>;
    private messageListener: ((event: MessageEvent) => void) | null = null;
    private isInitialized = false;

    constructor(options?: PartnerConnectOptions) {
        // Normalize hostOrigin to an array for whitelist validation
        const hostOrigin = options?.hostOrigin ?? PartnerConnect.DEFAULT_HOST_ORIGIN;
        const configured = Array.isArray(hostOrigin) ? hostOrigin : [hostOrigin];

        // Merge with the built-in tenant list unless the caller explicitly
        // opted out. De-duplicate while preserving order so the caller's
        // first entry remains the default active origin.
        const disableDefaults = options?.disableDefaultTenants === true;
        const merged = disableDefaults
            ? [...configured]
            : [...configured, ...PartnerConnect.DEFAULT_TRUSTED_TENANTS];
        this.hostOrigins = Array.from(new Set(merged));

        this.protocol = options?.protocol || 'LEARNCARD_V1';
        this.requestTimeout = options?.requestTimeout || 30000;
        this.allowNativeAppOrigins = options?.allowNativeAppOrigins ?? true;
        this.pendingRequests = new Map();
        this.configureActiveOrigin();
        this.setupMessageListener();
    }

    /**
     * Configure the active host origin using the following hierarchy:
     * 1. `window.location.ancestorOrigins[0]` (when supported) — the browser's
     *    view of who our parent frame is. Cannot be forged by a malicious
     *    `lc_host_override` query param and therefore takes precedence.
     * 2. `?lc_host_override=<origin>` query param (for staging / cross-tenant).
     * 3. `sessionStorage` value saved from a previously-validated override.
     * 4. First configured origin.
     * 5. `DEFAULT_HOST_ORIGIN`.
     *
     * When a valid override is found in the query parameter, it is persisted
     * to sessionStorage so subsequent in-iframe navigations in the same tab
     * continue to use the same active origin.
     */
    private static readonly SESSION_STORAGE_KEY = 'lc_host_override';

    /**
     * Read `window.location.ancestorOrigins[0]` without throwing if the
     * property is unavailable (Firefox) or the list is empty (top-level
     * context, e.g. running outside of an iframe).
     */
    private readAncestorOrigin(): string | null {
        if (typeof window === 'undefined') return null;

        try {
            const ancestors = window.location.ancestorOrigins;

            if (ancestors && ancestors.length > 0) {
                const parent = ancestors[0];

                if (typeof parent === 'string' && parent.length > 0) {
                    return parent;
                }
            }
        } catch {
            // `ancestorOrigins` is a WebKit/Blink extension; accessing it
            // under unusual conditions can throw. Treat as unavailable.
        }

        return null;
    }

    private configureActiveOrigin(): void {
        if (typeof window === 'undefined') {
            this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
            return;
        }

        try {
            const ancestorOrigin = this.readAncestorOrigin();
            const urlParams = new URLSearchParams(window.location.search);
            const hostOverride = urlParams.get('lc_host_override');

            // Priority 1: the real parent origin as reported by the browser.
            // This is unspoofable by query-param manipulation, so if it is
            // trusted we use it and ignore any override. If both are present
            // and disagree, we log and prefer the ancestor.
            if (ancestorOrigin && this.isOriginInWhitelist(ancestorOrigin)) {
                if (hostOverride && hostOverride !== ancestorOrigin) {
                    console.warn(
                        '[LearnCard SDK] lc_host_override does not match the real parent origin; preferring parent.',
                        { override: hostOverride, parent: ancestorOrigin }
                    );
                }

                this.activeHostOrigin = ancestorOrigin;
                this.persistOverride(ancestorOrigin);
                console.log('[LearnCard SDK] Using parent origin:', ancestorOrigin);
                return;
            }

            // Priority 2: lc_host_override query parameter.
            if (hostOverride) {
                if (this.isOriginInWhitelist(hostOverride)) {
                    this.activeHostOrigin = hostOverride;
                    this.persistOverride(hostOverride);
                    console.log('[LearnCard SDK] Using lc_host_override:', hostOverride);
                    return;
                }

                console.warn(
                    '[LearnCard SDK] lc_host_override value is not in the configured whitelist:',
                    hostOverride,
                    'Allowed:',
                    this.hostOrigins
                );
            }

            // Priority 3: a previously-validated override from this tab session.
            let storedOverride: string | null = null;

            try {
                storedOverride = sessionStorage.getItem(PartnerConnect.SESSION_STORAGE_KEY);
            } catch {
                // sessionStorage may be unavailable (e.g. sandboxed iframes)
            }

            if (storedOverride && this.isOriginInWhitelist(storedOverride)) {
                this.activeHostOrigin = storedOverride;
                console.log('[LearnCard SDK] Using stored lc_host_override:', storedOverride);
                return;
            }

            // Priority 4/5: fall back to the first configured origin or default.
            this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
            console.log('[LearnCard SDK] Using configured origin:', this.activeHostOrigin);
        } catch (error) {
            console.error('[LearnCard SDK] Error configuring active origin:', error);
            this.activeHostOrigin = this.hostOrigins[0] || PartnerConnect.DEFAULT_HOST_ORIGIN;
        }
    }

    private persistOverride(origin: string): void {
        try {
            sessionStorage.setItem(PartnerConnect.SESSION_STORAGE_KEY, origin);
        } catch {
            // sessionStorage may be unavailable (e.g. sandboxed iframes)
        }
    }

    private isOriginNativeApp(origin: string): boolean {
        return (
            origin.startsWith('capacitor://') ||
            origin.startsWith('ionic://') ||
            origin.startsWith('https://localhost') ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1')
        );
    }

    /**
     * Internal placeholder substituted in for `*` so that `new URL(...)` can
     * parse a wildcard pattern. Chosen to be a syntactically-valid DNS label
     * that cannot collide with a real hostname.
     */
    private static readonly WILDCARD_PLACEHOLDER = '__lc_wildcard__';

    /** `*` (any number of occurrences) for replacement in the pattern. */
    private static readonly WILDCARD_REGEX = /\*/g;

    /** The required leading-label form a wildcard pattern must take. */
    private static readonly WILDCARD_LEADING_PREFIX = `${PartnerConnect.WILDCARD_PLACEHOLDER}.`;

    /**
     * Check whether a candidate origin matches a configured whitelist entry.
     *
     * Supports exact matches and wildcard patterns. A wildcard entry has the
     * form `<protocol>://*.<domain>` and matches any origin with the same
     * protocol, same port, and a host ending in `.<domain>` with at least
     * one non-empty DNS label in place of the `*`.
     *
     * Examples with pattern `https://*.learncard.app`:
     * - `https://staging.learncard.app`      → match
     * - `https://pr-1.preview.learncard.app` → match
     * - `https://learncard.app`              → no match (no subdomain)
     * - `http://staging.learncard.app`       → no match (protocol mismatch)
     * - `https://learncard.app.attacker.com` → no match (suffix mismatch)
     *
     * Exposed as a public static so it can be unit-tested directly without
     * standing up a full SDK instance.
     */
    public static matchesOriginPattern(candidate: string, pattern: string): boolean {
        if (candidate === pattern) return true;
        if (!pattern.includes('*')) return false;

        let patternUrl: URL;
        let candidateUrl: URL;

        try {
            // Replace the wildcard labels with a syntactically-valid host so
            // URL() can parse it; we validate the real shape ourselves below.
            patternUrl = new URL(
                pattern.replace(
                    PartnerConnect.WILDCARD_REGEX,
                    PartnerConnect.WILDCARD_PLACEHOLDER
                )
            );
            candidateUrl = new URL(candidate);
        } catch {
            return false;
        }

        // Protocol, port, and (empty) path-origin must match exactly.
        if (patternUrl.protocol !== candidateUrl.protocol) return false;
        if (patternUrl.port !== candidateUrl.port) return false;

        const patternHost = patternUrl.hostname;
        const candidateHost = candidateUrl.hostname;

        // Only allow wildcards as leading label(s): `*.foo.bar`, not `a*.b` or
        // `foo.*.bar`. This keeps the matching rule predictable and safe.
        if (!patternHost.startsWith(PartnerConnect.WILDCARD_LEADING_PREFIX)) return false;

        const patternSuffix = patternHost.slice(PartnerConnect.WILDCARD_LEADING_PREFIX.length);

        if (patternSuffix.length === 0) return false;
        // No further wildcards anywhere else in the pattern.
        if (patternSuffix.includes(PartnerConnect.WILDCARD_PLACEHOLDER)) return false;

        // Candidate must end with `.<suffix>` and have at least one label
        // before the suffix (the portion that the `*` stands in for).
        const required = '.' + patternSuffix;

        if (!candidateHost.endsWith(required)) return false;

        const prefix = candidateHost.slice(0, candidateHost.length - required.length);

        if (prefix.length === 0) return false;
        // Labels in the prefix must themselves be non-empty (no `..`).
        if (prefix.startsWith('.') || prefix.endsWith('.')) return false;
        if (prefix.split('.').some(label => label.length === 0)) return false;

        return true;
    }

    /**
     * Check if an origin is in the effective whitelist (exact origins +
     * wildcard patterns + optional native-app origins).
     */
    private isOriginInWhitelist(origin: string): boolean {
        if (!origin) return false;

        for (const entry of this.hostOrigins) {
            if (PartnerConnect.matchesOriginPattern(origin, entry)) return true;
        }

        if (this.allowNativeAppOrigins && this.isOriginNativeApp(origin)) return true;

        return false;
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
                pending.reject(
                    data.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
                );
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
        return this.sendMessage<IdentityResponse>('REQUEST_IDENTITY', {
            challenge: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
    }

    /**
     * Send a credential to the user's LearnCard wallet
     *
     * Supports two modes:
     * 1. **Raw credential**: Pass a full verifiable credential object
     * 2. **Template-based**: Pass `{ templateAlias, templateData }` to issue from a pre-configured boost template
     *
     * @param input - Either a verifiable credential or a template-based input
     * @returns Promise resolving to credential response
     *
     * @example Raw credential
     * ```typescript
     * const response = await learnCard.sendCredential({
     *   '@context': ['https://www.w3.org/2018/credentials/v1'],
     *   type: ['VerifiableCredential'],
     *   credentialSubject: { id: 'did:example:123' }
     * });
     * console.log('Credential ID:', response.credentialId);
     * ```
     *
     * @example Template-based (for App Store apps)
     * ```typescript
     * const response = await learnCard.sendCredential({
     *   templateAlias: 'achievement-badge',
     *   templateData: { score: '95', courseName: 'Web Dev 101' }
     * });
     * console.log('Credential URI:', response.credentialUri);
     * ```
     */
    public sendCredential(
        input: unknown | TemplateCredentialInput
    ): Promise<SendCredentialResponse | TemplateCredentialResponse> {
        if (
            input &&
            typeof input === 'object' &&
            'templateAlias' in input &&
            typeof (input as TemplateCredentialInput).templateAlias === 'string'
        ) {
            const templateInput = input as TemplateCredentialInput;

            return this.sendAppEvent<TemplateCredentialResponse>({
                type: 'send-credential',
                templateAlias: templateInput.templateAlias,
                templateData: templateInput.templateData,
                preventDuplicateClaim: templateInput.preventDuplicateClaim,
            });
        }

        return this.sendMessage<SendCredentialResponse>('SEND_CREDENTIAL', { credential: input });
    }

    /**
     * Check whether the current user already has a credential from a given boost template.
     * This is a silent, non-interactive status check for installed app integrations.
     */
    public checkUserHasCredential(input: CheckCredentialInput): Promise<CheckCredentialResponse> {
        return this.sendAppEvent<CheckCredentialResponse>({
            type: 'check-credential',
            ...input,
        });
    }

    /**
     * Check if the current user has issued/sent a specific template to someone.
     * Returns issuance status including sent date and claim status.
     *
     * @param input - Template identifier (templateAlias or boostUri) and recipient identifier (recipientDid or recipientProfileId)
     * @returns Promise resolving to issuance status response
     *
     * @example
     * ```typescript
     * // Check if user already issued 'achievement-badge' to a specific person
     * const status = await learnCard.getTemplateIssuanceStatus({
     *   templateAlias: 'achievement-badge',
     *   recipientProfileId: 'user123'
     * });
     *
     * if (status.sent) {
     *   console.log('Already issued on:', status.sentDate);
     *   console.log('Status:', status.status); // 'pending', 'claimed', or 'revoked'
     * }
     * ```
     */
    public getTemplateIssuanceStatus(
        input: CheckIssuanceStatusInput
    ): Promise<TemplateIssuanceStatusResponse> {
        return this.sendAppEvent<TemplateIssuanceStatusResponse>({
            type: 'check-issuance-status',
            ...input,
        });
    }

    /**
     * Get the list of all recipients for a specific template/boost.
     * Useful for dashboards showing who has received a credential.
     *
     * @param input - Template identifier (templateAlias or boostUri) and optional pagination params
     * @returns Promise resolving to paginated list of recipients
     *
     * @example
     * ```typescript
     * // Get first 10 recipients of 'achievement-badge'
     * const recipients = await learnCard.getTemplateRecipients({
     *   templateAlias: 'achievement-badge',
     *   limit: 10
     * });
     *
     * console.log(`Found ${recipients.records.length} recipients`);
     * recipients.records.forEach(r => {
     *   console.log(`${r.recipientDisplayName}: ${r.status}`);
     * });
     *
     * // Get next page if available
     * if (recipients.hasMore) {
     *   const nextPage = await learnCard.getTemplateRecipients({
     *     templateAlias: 'achievement-badge',
     *     limit: 10,
     *     cursor: recipients.cursor
     *   });
     * }
     * ```
     */
    public getTemplateRecipients(
        input: GetTemplateRecipientsInput
    ): Promise<TemplateRecipientsResponse> {
        return this.sendAppEvent<TemplateRecipientsResponse>({
            type: 'get-template-recipients',
            ...input,
        });
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
     * @param contractUri - URI of the consent contract (optional for App Store apps with configured contracts)
     * @param options - Additional options including redirect behavior
     * @returns Promise resolving to consent response
     *
     * @example
     * ```typescript
     * // With explicit contract URI (for external/non-app store integrations)
     * const response = await learnCard.requestConsent('lc:network:network.learncard.com/trpc:contract:abc123');
     * if (response.granted) {
     *   console.log('User granted consent');
     * }
     *
     * // Without contract URI (uses app's configured contract from integration)
     * // This works for App Store apps that have configured a contract in their integration
     * const response = await learnCard.requestConsent();
     * if (response.granted) {
     *   console.log('User granted consent using listing contract');
     * }
     *
     * // With redirect - redirects to contract's redirectUrl with VP in URL params
     * const response = await learnCard.requestConsent(undefined, { redirect: true });
     * ```
     */
    public requestConsent(
        contractUri?: string,
        options: RequestConsentOptions = {}
    ): Promise<ConsentResponse> {
        const { redirect = false } = options;

        return this.sendMessage<ConsentResponse>('REQUEST_CONSENT', {
            contractUri,
            redirect,
        });
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
     * Request comprehensive learner context for AI tutoring systems.
     *
     * This method retrieves the user's credentials and personal data,
     * then formats them into an LLM-ready prompt that can be injected directly into
     * an AI system prompt.
     *
     * @param options - Configuration options for what data to include and how to format it
     * @returns Promise resolving to learner context with prompt and optional raw data
     *
     * @example
     * ```typescript
     * // Get LLM-ready prompt with credentials and personal data
     * const context = await learnCard.requestLearnerContext({
     *   includeCredentials: true,
     *   includePersonalData: true,
     *   format: 'prompt',
     *   instructions: 'Focus on technical skills and certifications',
     *   detailLevel: 'expanded'
     * });
     *
     * // Use in AI system prompt
     * const systemPrompt = `You are a helpful tutor. ${context.prompt}`;
     *
     * // Access structured data if needed
     * console.log('User DID:', context.did);
     * console.log('Credentials count:', context.raw?.credentials.length);
     * ```
     */
    public requestLearnerContext(
        options?: RequestLearnerContextOptions
    ): Promise<LearnerContextResponse> {
        return this.sendMessage<LearnerContextResponse>('REQUEST_LEARNER_CONTEXT', {
            includeCredentials: options?.includeCredentials ?? true,
            includePersonalData: options?.includePersonalData ?? false,
            format: options?.format ?? 'prompt',
            instructions: options?.instructions,
            detailLevel: options?.detailLevel ?? 'compact',
        });
    }

    /**
     * Send a generic event to be processed by the brain service on behalf of this app.
     * This is used for backend-like operations such as issuing credentials.
     *
     * @param event - The event payload to send
     * @returns Promise resolving to the event response
     *
     * @example
     * ```typescript
     * // Issue a credential to the current user
     * const response = await learnCard.sendAppEvent({
     *   type: 'send-credential',
     *   templateAlias: 'achievement-badge',
     *   templateData: { score: '95' }
     * });
     *
     * if (response.credentialUri) {
     *   console.log('Credential issued:', response.credentialUri);
     * }
     * ```
     */
    public sendAppEvent<T = AppEventResponse>(event: AppEvent): Promise<T> {
        return this.sendMessage<T>('APP_EVENT', event);
    }

    /**
     * Create and send an AI Session credential to the user.
     *
     * This method manages the AI Topic → AI Session hierarchy:
     * - Ensures an AI Topic exists for this app (creates one if needed)
     * - Creates a new AI Session as a child of the topic
     * - The topic appears in the user's AI Sessions page with the app's name
     * - All sessions from this app are organized under that topic
     *
     * @param input - Session details including title and optional metadata
     * @returns Promise resolving to topic and session URIs
     */
    public sendAiSessionCredential(
        input: SendAiSessionCredentialInput
    ): Promise<SendAiSessionCredentialResponse> {
        return this.sendAppEvent<SendAiSessionCredentialResponse>({
            type: 'send-ai-session-credential',
            ...input,
        });
    }

    /**
     * Send a notification to the current user from this app.
     * The notification appears in the user's LearnCard notification inbox.
     */
    public sendNotification(input: AppNotificationInput): Promise<AppNotificationResponse> {
        return this.sendAppEvent<AppNotificationResponse>({
            type: 'send-notification',
            ...input,
        });
    }

    /**
     * Increment or decrement an app-scoped counter for the current user.
     */
    public incrementCounter(key: string, amount: number): Promise<IncrementCounterResponse> {
        return this.sendAppEvent<IncrementCounterResponse>({
            type: 'increment-counter',
            key,
            amount,
        });
    }

    /**
     * Read the current value of an app-scoped counter for the current user.
     */
    public getCounter(key: string): Promise<GetCounterResponse> {
        return this.sendAppEvent<GetCounterResponse>({
            type: 'get-counter',
            key,
        });
    }

    /**
     * Read multiple app-scoped counters at once for the current user.
     */
    public getCounters(keys?: string[]): Promise<GetCountersResponse> {
        return this.sendAppEvent<GetCountersResponse>({
            type: 'get-counters',
            ...(keys ? { keys } : {}),
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
export function createPartnerConnect(options?: PartnerConnectOptions): PartnerConnect {
    return new PartnerConnect(options);
}

// Default export for convenience
export default createPartnerConnect;
