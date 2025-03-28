import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { fetch } from 'undici';
import { LtiPlatformMock } from './helpers/lti-platform-mock';
import { 
    registerTestPlatform, 
    createLtiState, 
    createLtiIdToken, 
    generateTestKeyPair,
    getLtiUserLearnCard,
    createMockLtiCredential,
    getMongoClient,
    closeMongoClient
} from './helpers/lti.helpers';
import { URLSearchParams } from 'url';
import crypto from 'crypto';

// Constants for testing
const SERVER_URL = 'http://localhost:4100';
const LTI_LOGIN_ENDPOINT = `${SERVER_URL}/lti/login`;
const LTI_LAUNCH_ENDPOINT = `${SERVER_URL}/lti/launch`;
const LTI_DEEP_LINKING_ENDPOINT = `${SERVER_URL}/lti/deep-linking`;
const LTI_JWKS_ENDPOINT = `${SERVER_URL}/.well-known/jwks.json`;
const LTI_CONFIG_ENDPOINT = `${SERVER_URL}/lti/config`;
const LTI_REGISTER_PLATFORM_ENDPOINT = `${SERVER_URL}/lti/register-platform`;
const LTI_ISSUE_CREDENTIAL_ENDPOINT = `${SERVER_URL}/lti/issue-credential`;

describe('LTI 1.3 Implementation', () => {
    let platformMock: LtiPlatformMock;
    let keyPair: ReturnType<typeof generateTestKeyPair>;

    beforeAll(async () => {
        // Set up mock LTI platform
        platformMock = new LtiPlatformMock(9001);
        await platformMock.start();
        
        // Generate key pair for tests
        keyPair = generateTestKeyPair();
        
        // Register a test platform
        await registerTestPlatform({
            issuer: `http://localhost:9001`,
            client_id: 'test-client-id',
            deployment_id: 'test-deployment-id',
            auth_login_url: `http://localhost:9001/auth`,
            auth_token_url: `http://localhost:9001/token`,
            key_set_url: `http://localhost:9001/jwks`,
        });
    });

    afterAll(async () => {
        // Stop mock platform
        await platformMock.stop();
        
        // Close MongoDB connection
        await closeMongoClient();
    });

    describe('Configuration and JWKS Endpoints', () => {
        test('JWKS endpoint should return valid keys', async () => {
            const response = await fetch(LTI_JWKS_ENDPOINT);
            expect(response.status).toBe(200);
            
            const jwks = await response.json();
            expect(jwks).toHaveProperty('keys');
            expect(Array.isArray(jwks.keys)).toBe(true);
            
            // Basic structure verification
            const key = jwks.keys[0];
            expect(key).toHaveProperty('kty', 'RSA');
            expect(key).toHaveProperty('use', 'sig');
            expect(key).toHaveProperty('alg', 'RS256');
            expect(key).toHaveProperty('kid');
            expect(key).toHaveProperty('n'); // RSA modulus
            expect(key).toHaveProperty('e'); // RSA exponent
        });

        test('Configuration endpoint should return valid XML', async () => {
            const response = await fetch(LTI_CONFIG_ENDPOINT);
            expect(response.status).toBe(200);
            
            const configXml = await response.text();
            expect(configXml).toContain('<toolConfiguration');
            expect(configXml).toContain('<issuer>');
            expect(configXml).toContain('<client_id>');
            expect(configXml).toContain('<jwks_uri>');
            expect(configXml).toContain('<login_url>');
            expect(configXml).toContain('<redirect_uri>');
        });

        test('Platform registration endpoint should register a platform', async () => {
            const platformData = {
                issuer: 'https://test-registration.example.com',
                client_id: 'test-registration-client',
                deployment_id: 'test-registration-deployment',
                auth_login_url: 'https://test-registration.example.com/auth',
                auth_token_url: 'https://test-registration.example.com/token',
                key_set_url: 'https://test-registration.example.com/jwks',
            };
            
            const response = await fetch(LTI_REGISTER_PLATFORM_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(platformData),
            });
            
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('platformId');
        });
    });

    describe('OIDC Login Flow', () => {
        test('Login endpoint should reject missing parameters', async () => {
            const response = await fetch(LTI_LOGIN_ENDPOINT);
            expect(response.status).toBe(400);
        });

        test('Login endpoint should reject unknown platform', async () => {
            const params = new URLSearchParams({
                iss: 'https://unknown.example.com',
                login_hint: 'test-user',
                target_link_uri: LTI_LAUNCH_ENDPOINT,
                client_id: 'unknown-client',
            });
            
            const response = await fetch(`${LTI_LOGIN_ENDPOINT}?${params.toString()}`);
            expect(response.status).toBe(404);
        });

        test('Login endpoint should redirect to platform auth URL', async () => {
            const params = new URLSearchParams({
                iss: `http://localhost:9001`,
                login_hint: 'test-user',
                target_link_uri: LTI_LAUNCH_ENDPOINT,
                client_id: 'test-client-id',
            });
            
            const response = await fetch(`${LTI_LOGIN_ENDPOINT}?${params.toString()}`, {
                redirect: 'manual',
            });
            
            expect(response.status).toBe(302);
            
            const location = response.headers.get('location');
            expect(location).toBeDefined();
            expect(location).toContain('http://localhost:9001/auth');
            expect(location).toContain('scope=openid');
            expect(location).toContain('response_type=id_token');
            expect(location).toContain('client_id=test-client-id');
            expect(location).toContain('redirect_uri=');
            expect(location).toContain('login_hint=');
            expect(location).toContain('state=');
            expect(location).toContain('nonce=');
        });
    });

    describe('Launch Flow', () => {
        test('Launch endpoint should reject missing parameters', async () => {
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            
            expect(response.status).toBe(400);
        });

        test('Launch endpoint should reject invalid state', async () => {
            const formData = new URLSearchParams({
                state: 'invalid-state',
                id_token: 'invalid-token',
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });
            
            expect(response.status).toBe(400);
        });

        test('Launch endpoint should successfully process a valid launch', async () => {
            // 1. Create a valid state in the database
            const state = await createLtiState();
            
            // 2. Create a valid ID token
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: `http://localhost:9001`,
                aud: 'test-client-id',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
            }, keyPair.privateKey, keyPair.keyId);
            
            // 3. Make the launch request
            const formData = new URLSearchParams({
                state,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                redirect: 'manual',
            });
            
            expect(response.status).toBe(302);
            
            const location = response.headers.get('location');
            expect(location).toBeDefined();
            expect(location).toContain('/lti/app?session=');
        });

        test('Deep linking endpoint should process a valid deep linking launch', async () => {
            // 1. Create a valid state in the database
            const state = await createLtiState({
                target_link_uri: LTI_DEEP_LINKING_ENDPOINT,
            });
            
            // 2. Create a valid ID token with deep linking message type
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: `http://localhost:9001`,
                aud: 'test-client-id',
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
                'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
                    deep_link_return_url: 'http://localhost:9001/deep-linking-return',
                    accept_types: ['link'],
                    accept_media_types: '*/*',
                    accept_presentation_document_targets: ['iframe', 'window'],
                    auto_create: true,
                },
            }, keyPair.privateKey, keyPair.keyId);
            
            // 3. Make the launch request
            const formData = new URLSearchParams({
                state,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_DEEP_LINKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                redirect: 'manual',
            });
            
            expect(response.status).toBe(302);
            
            const location = response.headers.get('location');
            expect(location).toBeDefined();
            expect(location).toContain('/lti/content-selection?session=');
        });
    });

    describe('LearnCard Integration', () => {
        test('Should map an LTI user to a DID', async () => {
            // 1. Get a LearnCard for LTI user
            const { learnCard, did } = await getLtiUserLearnCard('test-user-id-mapping');
            
            // 2. Create a valid state and session
            const state = await createLtiState();
            
            // 3. Create a valid ID token
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: `http://localhost:9001`,
                sub: 'test-user-id-mapping',
                aud: 'test-client-id',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
            }, keyPair.privateKey, keyPair.keyId);
            
            // 4. Make the launch request
            const formData = new URLSearchParams({
                state,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                redirect: 'manual',
            });
            
            expect(response.status).toBe(302);
            
            // 5. Verify the mapping was created correctly
            // This would be more thoroughly tested with a direct database query,
            // but for now we'll just check that the response is successful
            expect(response.headers.get('location')).toContain('/lti/app?session=');
            
            // In a real application, we'd verify the mapping directly in the database
            const client = await getMongoClient();
            const db = client.db('learn-cloud');
            const mappings = db.collection('lti_user_mappings');
            
            const mapping = await mappings.findOne({ 
                _id: 'http://localhost:9001#test-client-id#test-deployment-id#test-user-id-mapping' 
            });
            
            expect(mapping).not.toBeNull();
            expect(mapping?.did).toBe(did);
        });

        test('Should issue a credential from LTI context', async () => {
            // 1. Get a LearnCard for LTI user
            const { learnCard, did } = await getLtiUserLearnCard('test-user-credential');
            
            // 2. Create a valid state and launch to create a session
            const state = await createLtiState();
            
            // 3. Create a valid ID token
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: `http://localhost:9001`,
                sub: 'test-user-credential',
                aud: 'test-client-id',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
                'https://purl.imsglobal.org/spec/lti/claim/context': {
                    id: 'test-context-id',
                    label: 'Test Course',
                    title: 'Test Course Title',
                },
            }, keyPair.privateKey, keyPair.keyId);
            
            // 4. Make the launch request to create a session
            const formData = new URLSearchParams({
                state,
                id_token: idToken,
            });
            
            const launchResponse = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                redirect: 'manual',
            });
            
            expect(launchResponse.status).toBe(302);
            
            // 5. Extract session ID from redirect URL
            const location = launchResponse.headers.get('location') || '';
            const sessionId = location.split('session=')[1];
            expect(sessionId).toBeDefined();
            
            // 6. Request credential issuance
            const credentialData = {
                achievement: 'Completed Test Course',
                score: 95,
            };
            
            const credentialResponse = await fetch(LTI_ISSUE_CREDENTIAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    credentialData,
                }),
            });
            
            expect(credentialResponse.status).toBe(200);
            
            const result = await credentialResponse.json();
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('credential');
            
            // Verify credential structure
            const credential = result.credential;
            expect(credential).toHaveProperty('@context');
            expect(credential).toHaveProperty('type');
            expect(credential.type).toContain('VerifiableCredential');
            expect(credential.type).toContain('LtiCredential');
            expect(credential).toHaveProperty('issuer');
            expect(credential).toHaveProperty('issuanceDate');
            expect(credential).toHaveProperty('credentialSubject');
            expect(credential.credentialSubject).toHaveProperty('id', did);
            expect(credential.credentialSubject).toHaveProperty('contextId', 'test-context-id');
            expect(credential.credentialSubject).toHaveProperty('achievement', 'Completed Test Course');
            expect(credential.credentialSubject).toHaveProperty('score', 95);
        });
    });

    describe('Security Tests', () => {
        test('Should reject launch with invalid state', async () => {
            const invalidState = 'invalid-state-' + crypto.randomBytes(8).toString('hex');
            const idToken = createLtiIdToken({}, keyPair.privateKey, keyPair.keyId);
            
            const formData = new URLSearchParams({
                state: invalidState,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });
            
            expect(response.status).toBe(400);
        });

        test('Should reject launch with expired state', async () => {
            // Create an expired state directly in the database
            const client = await getMongoClient();
            const db = client.db('learn-cloud');
            const states = db.collection('lti_states');
            
            const expiredState = crypto.randomBytes(16).toString('hex');
            const now = new Date();
            
            await states.insertOne({
                _id: crypto.randomBytes(16).toString('hex'),
                state: expiredState,
                nonce: crypto.randomBytes(16).toString('hex'),
                platform_id: `http://localhost:9001#test-client-id#test-deployment-id`,
                target_link_uri: LTI_LAUNCH_ENDPOINT,
                createdAt: new Date(now.getTime() - 7200000), // 2 hours ago
                expiresAt: new Date(now.getTime() - 3600000), // 1 hour ago
            });
            
            // Try to launch with the expired state
            const idToken = createLtiIdToken({}, keyPair.privateKey, keyPair.keyId);
            
            const formData = new URLSearchParams({
                state: expiredState,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });
            
            expect(response.status).toBe(400);
        });

        test('Should reject launch with mismatched nonce', async () => {
            // 1. Create a valid state in the database
            const nonce = crypto.randomBytes(16).toString('hex');
            const state = await createLtiState({ nonce });
            
            // 2. Create an ID token with a different nonce
            const differentNonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce: differentNonce, // Different from the one stored with the state
            }, keyPair.privateKey, keyPair.keyId);
            
            // 3. Make the launch request
            const formData = new URLSearchParams({
                state,
                id_token: idToken,
            });
            
            const response = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });
            
            // This should fail with 401 Unauthorized due to nonce mismatch
            expect(response.status).toBe(401);
        });

        test('Should reject credential issuance with invalid session', async () => {
            const invalidSessionId = 'invalid-session-' + crypto.randomBytes(8).toString('hex');
            
            const credentialResponse = await fetch(LTI_ISSUE_CREDENTIAL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: invalidSessionId,
                    credentialData: {
                        achievement: 'Invalid Achievement',
                    },
                }),
            });
            
            expect(credentialResponse.status).toBe(404);
        });
    });
});