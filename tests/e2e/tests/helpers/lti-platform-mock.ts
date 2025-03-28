import { Server, IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { fetch } from 'undici';
import { URLSearchParams } from 'url';
import { generateTestKeyPair, generateTestJwks } from './lti.helpers';

/**
 * LTI Context Type enum
 */
export enum LtiContextType {
    CourseOffering = 'http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering',
    CourseSection = 'http://purl.imsglobal.org/vocab/lis/v2/course#CourseSection',
    CourseTemplate = 'http://purl.imsglobal.org/vocab/lis/v2/course#CourseTemplate',
    Group = 'http://purl.imsglobal.org/vocab/lis/v2/course#Group',
}

/**
 * LTI Role enum
 */
export enum LtiRole {
    Learner = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    Instructor = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
    Administrator = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator',
    ContentDeveloper = 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
}

/**
 * LTI Message Type enum
 */
export enum LtiMessageType {
    ResourceLink = 'LtiResourceLinkRequest',
    DeepLinking = 'LtiDeepLinkingRequest',
    SubmissionReview = 'LtiSubmissionReviewRequest',
}

/**
 * LTI Platform Mock Configuration
 */
export interface LtiMockConfig {
    port: number;
    issuer: string;
    clientId: string;
    deploymentId: string;
    authLoginUrl?: string;
    authTokenUrl?: string;
    jwksUrl?: string;
    deepLinkReturnUrl?: string;
    launchUrl?: string;
    deepLinkingUrl?: string;
}

/**
 * Mock LTI Platform Server
 * This class implements a complete LTI 1.3 platform for testing purposes
 */
export class LtiPlatformMock {
    private server: Server | null = null;
    private keyPairs: Array<ReturnType<typeof generateTestKeyPair>> = [];
    private jwks: any;
    private config: LtiMockConfig;
    private nonces: Set<string> = new Set();
    private states: Map<string, { nonce: string; redirectUri: string; createdAt: number }> = new Map();
    private launchCounter: number = 0;
    
    constructor(config: Partial<LtiMockConfig> = {}) {
        // Set default configuration
        this.config = {
            port: config.port || 9000,
            issuer: config.issuer || 'https://lti-mock.example.com',
            clientId: config.clientId || 'mock-client-id',
            deploymentId: config.deploymentId || 'mock-deployment-id',
            authLoginUrl: config.authLoginUrl || `/auth`,
            authTokenUrl: config.authTokenUrl || `/token`,
            jwksUrl: config.jwksUrl || `/jwks`,
            deepLinkReturnUrl: config.deepLinkReturnUrl || `/deep-link-return`,
            launchUrl: config.launchUrl || 'http://localhost:4100/lti/launch',
            deepLinkingUrl: config.deepLinkingUrl || 'http://localhost:4100/lti/deep-linking',
        };
        
        // Generate a key pair for signing tokens
        const keyPair = generateTestKeyPair();
        this.keyPairs.push(keyPair);
        
        // Generate JWKS
        this.jwks = generateTestJwks(this.keyPairs.map(kp => ({ 
            publicKey: kp.publicKey, 
            keyId: kp.keyId 
        })));
    }

    /**
     * Get the JWKS for this platform
     */
    getJwks() {
        return this.jwks;
    }

    /**
     * Get the current key pair for signing
     */
    getCurrentKeyPair() {
        return this.keyPairs[0];
    }

    /**
     * Generate a base URL for this mock platform
     */
    getBaseUrl() {
        return `http://localhost:${this.config.port}`;
    }

    /**
     * Start the mock LTI platform server
     */
    async start(): Promise<void> {
        if (this.server) return;

        return new Promise(resolve => {
            this.server = new Server(this.handleRequest.bind(this));
            this.server.listen(this.config.port, () => {
                console.log(`Mock LTI Platform running on port ${this.config.port}`);
                resolve();
            });
        });
    }

    /**
     * Stop the mock LTI platform server
     */
    async stop(): Promise<void> {
        if (!this.server) return;

        return new Promise((resolve, reject) => {
            this.server!.close(err => {
                if (err) reject(err);
                else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    /**
     * Handle incoming HTTP requests
     */
    private handleRequest(req: IncomingMessage, res: ServerResponse): void {
        const url = req.url || '';
        const baseUrl = this.getBaseUrl();
        
        // JWKS endpoint
        if (url.includes('/jwks')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.jwks));
            return;
        }
        
        // OIDC Authorization endpoint
        if (url.includes('/auth')) {
            try {
                // Parse authorization request parameters
                const params = new URLSearchParams(url.split('?')[1]);
                
                // Check for required params
                const clientId = params.get('client_id');
                const redirectUri = params.get('redirect_uri');
                const state = params.get('state');
                const nonce = params.get('nonce');
                const loginHint = params.get('login_hint');
                const ltiMessageHint = params.get('lti_message_hint');
                
                // Validate request parameters
                if (!clientId || !redirectUri || !state || !nonce || !loginHint) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Missing required parameters');
                    return;
                }
                
                // Validate client ID
                if (clientId !== this.config.clientId) {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Invalid client_id');
                    return;
                }

                // Store state and nonce for later verification
                this.states.set(state, {
                    nonce,
                    redirectUri,
                    createdAt: Date.now(),
                });
                this.nonces.add(nonce);
                
                // Create a new message ID for this launch
                this.launchCounter++;
                const messageId = `launch-${this.launchCounter}`;
                
                // Determine message type based on redirect URI
                const isDeepLinking = redirectUri.includes('/deep-linking');
                const messageType = isDeepLinking
                    ? LtiMessageType.DeepLinking
                    : LtiMessageType.ResourceLink;
                
                // Create ID token for launch
                const idToken = this.generateIdToken({
                    nonce,
                    messageType,
                    subject: `user-${loginHint}`,
                    targetLinkUri: redirectUri,
                    messageId,
                    ltiMessageHint,
                });
                
                // Create the form to auto-submit to the tool
                const autoSubmitForm = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>LTI Launch</title>
                    <script type="text/javascript">
                        window.onload = function() {
                            document.forms[0].submit();
                        }
                    </script>
                </head>
                <body>
                    <form action="${redirectUri}" method="post">
                        <input type="hidden" name="id_token" value="${idToken}" />
                        <input type="hidden" name="state" value="${state}" />
                        <input type="submit" value="Launch" />
                    </form>
                </body>
                </html>
                `;
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(autoSubmitForm);
                return;
                
            } catch (error) {
                console.error('Error handling auth request:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }
        }
        
        // Deep Linking Return endpoint
        if (url.includes('/deep-link-return')) {
            try {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    try {
                        // Parse the deep linking response
                        const params = new URLSearchParams(body);
                        const jwt = params.get('JWT');
                        
                        if (!jwt) {
                            res.writeHead(400, { 'Content-Type': 'text/plain' });
                            res.end('Missing JWT parameter');
                            return;
                        }
                        
                        // In a real implementation, we would validate the JWT signature
                        // and process the deep linking content items
                        
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(`<html><body><h1>Deep Linking Return</h1><pre>${JSON.stringify(jwt, null, 2)}</pre></body></html>`);
                    } catch (error) {
                        console.error('Error processing deep linking return:', error);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error processing deep linking return');
                    }
                });
                
                return;
            } catch (error) {
                console.error('Error handling deep linking return:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
                return;
            }
        }
        
        // Token endpoint - usually not needed for LTI 1.3 but included for completeness
        if (url.includes('/token')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                access_token: 'mock_access_token.' + crypto.randomBytes(32).toString('hex'),
                token_type: 'Bearer',
                expires_in: 3600
            }));
            return;
        }
        
        // Default 404 response
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }

    /**
     * Generate an ID token for LTI launch
     */
    generateIdToken(options: {
        nonce: string;
        messageType: LtiMessageType;
        subject?: string;
        targetLinkUri?: string;
        contextId?: string;
        resourceLinkId?: string;
        roles?: LtiRole[];
        contextType?: LtiContextType | LtiContextType[];
        customParams?: Record<string, string>;
        messageId?: string;
        ltiMessageHint?: string | null;
    }): string {
        const keyPair = this.keyPairs[0];
        const now = Math.floor(Date.now() / 1000);
        
        const defaultPayload: any = {
            // JWT standard claims
            iss: this.config.issuer,
            sub: options.subject || 'mock-user-id',
            aud: this.config.clientId,
            exp: now + 3600,
            iat: now,
            nonce: options.nonce,
            
            // LTI required claims
            'https://purl.imsglobal.org/spec/lti/claim/message_type': options.messageType,
            'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
            'https://purl.imsglobal.org/spec/lti/claim/deployment_id': this.config.deploymentId,
            'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': options.targetLinkUri || this.config.launchUrl,
            'https://purl.imsglobal.org/spec/lti/claim/roles': options.roles || [LtiRole.Learner],
        };
        
        // Add context if provided
        if (options.contextId || options.contextType) {
            defaultPayload['https://purl.imsglobal.org/spec/lti/claim/context'] = {
                id: options.contextId || `context-${crypto.randomBytes(8).toString('hex')}`,
                label: 'Test Course',
                title: 'Test Course Title',
                type: Array.isArray(options.contextType) 
                    ? options.contextType 
                    : options.contextType 
                        ? [options.contextType] 
                        : [LtiContextType.CourseOffering],
            };
        }
        
        // Add custom parameters if provided
        if (options.customParams) {
            defaultPayload['https://purl.imsglobal.org/spec/lti/claim/custom'] = options.customParams;
        }
        
        // Add resource link for resource link request
        if (options.messageType === LtiMessageType.ResourceLink) {
            defaultPayload['https://purl.imsglobal.org/spec/lti/claim/resource_link'] = {
                id: options.resourceLinkId || `resource-${crypto.randomBytes(8).toString('hex')}`,
                title: 'Test Resource',
                description: 'Test Resource Description',
            };
        }
        
        // Add deep linking settings for deep linking request
        if (options.messageType === LtiMessageType.DeepLinking) {
            defaultPayload['https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'] = {
                deep_link_return_url: `${this.getBaseUrl()}${this.config.deepLinkReturnUrl}`,
                accept_types: ['link', 'ltiResourceLink'],
                accept_media_types: '*/*',
                accept_presentation_document_targets: ['iframe', 'window'],
                auto_create: true,
                data: options.messageId || '',
            };
        }
        
        return jwt.sign(defaultPayload, keyPair.privateKey, {
            algorithm: 'RS256',
            keyid: keyPair.keyId,
        });
    }

    /**
     * Simulate an LTI launch through the OIDC flow
     */
    async simulateOidcLaunch(options: {
        messageType?: LtiMessageType;
        contextType?: LtiContextType | LtiContextType[];
        roles?: LtiRole[];
        customParams?: Record<string, string>;
    } = {}): Promise<Response> {
        // 1. Prepare OIDC login parameters
        const state = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        const loginHint = 'test-user';
        
        // 2. Determine target URL based on message type
        const isDeepLinking = options.messageType === LtiMessageType.DeepLinking;
        const targetLinkUri = isDeepLinking ? this.config.deepLinkingUrl : this.config.launchUrl;
        
        // 3. Create OIDC login request parameters
        const loginParams = new URLSearchParams({
            iss: this.config.issuer,
            login_hint: loginHint,
            target_link_uri: targetLinkUri,
            client_id: this.config.clientId,
            state,
            nonce,
            lti_message_hint: 'test-hint',
        });
        
        // Store state and nonce for the authentication process
        this.states.set(state, {
            nonce,
            redirectUri: targetLinkUri,
            createdAt: Date.now(),
        });
        this.nonces.add(nonce);
        
        // 4. Generate ID token for the launch
        const idToken = this.generateIdToken({
            nonce,
            messageType: options.messageType || LtiMessageType.ResourceLink,
            subject: `user-${loginHint}`,
            targetLinkUri,
            contextType: options.contextType,
            roles: options.roles,
            customParams: options.customParams,
        });
        
        // 5. Create form data for the launch
        const formData = new URLSearchParams({
            state,
            id_token: idToken,
        });
        
        // 6. POST directly to the launch endpoint
        return fetch(targetLinkUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'manual',
        });
    }

    /**
     * Simulate an LTI resource link launch
     */
    async simulateResourceLinkLaunch(options: {
        contextType?: LtiContextType | LtiContextType[];
        roles?: LtiRole[];
        customParams?: Record<string, string>;
    } = {}): Promise<Response> {
        return this.simulateOidcLaunch({
            messageType: LtiMessageType.ResourceLink,
            ...options,
        });
    }

    /**
     * Simulate an LTI deep linking launch
     */
    async simulateDeepLinkingLaunch(options: {
        contextType?: LtiContextType | LtiContextType[];
        roles?: LtiRole[];
        customParams?: Record<string, string>;
    } = {}): Promise<Response> {
        return this.simulateOidcLaunch({
            messageType: LtiMessageType.DeepLinking,
            ...options,
        });
    }
}
