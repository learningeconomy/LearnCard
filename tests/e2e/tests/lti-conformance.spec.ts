import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { fetch } from 'undici';
import { 
    registerTestPlatform, 
    createLtiState, 
    createLtiIdToken, 
    generateTestKeyPair,
    closeMongoClient
} from './helpers/lti.helpers';
import crypto from 'crypto';
import { URLSearchParams } from 'url';

/**
 * IMS Global LTI 1.3 Conformance Tests
 * 
 * These tests validate the LearnCard LTI implementation
 * against the IMS Global conformance requirements.
 * 
 * For full conformance certification, the application should
 * be submitted to the IMS Global certification program.
 */
describe('LTI 1.3 Conformance Tests', () => {
    let keyPair: ReturnType<typeof generateTestKeyPair>;
    
    const SERVER_URL = 'http://localhost:4100';
    const LTI_LOGIN_ENDPOINT = `${SERVER_URL}/lti/login`;
    const LTI_LAUNCH_ENDPOINT = `${SERVER_URL}/lti/launch`;
    const LTI_DEEP_LINKING_ENDPOINT = `${SERVER_URL}/lti/deep-linking`;
    const LTI_JWKS_ENDPOINT = `${SERVER_URL}/.well-known/jwks.json`;
    
    beforeAll(async () => {
        // Generate key pair for tests
        keyPair = generateTestKeyPair();
        
        // Register a test platform
        await registerTestPlatform({
            issuer: `https://lti-ri.imsglobal.org`,
            client_id: 'ims-test-client',
            deployment_id: 'ims-test-deployment',
            auth_login_url: `https://lti-ri.imsglobal.org/platforms/2533/authorizations/new`,
            auth_token_url: `https://lti-ri.imsglobal.org/platforms/2533/access_tokens`,
            key_set_url: `https://lti-ri.imsglobal.org/platforms/2533/platform_keys/2533.json`,
        });
    });
    
    afterAll(async () => {
        await closeMongoClient();
    });
    
    describe('IMS JWKS Endpoint Requirements', () => {
        test('JWKS endpoint should be available at well-known location', async () => {
            const response = await fetch(LTI_JWKS_ENDPOINT);
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toContain('application/json');
        });
        
        test('JWKS should contain required key properties', async () => {
            const response = await fetch(LTI_JWKS_ENDPOINT);
            const jwks = await response.json();
            
            expect(jwks).toHaveProperty('keys');
            expect(Array.isArray(jwks.keys)).toBe(true);
            expect(jwks.keys.length).toBeGreaterThan(0);
            
            const key = jwks.keys[0];
            expect(key).toHaveProperty('kty', 'RSA');
            expect(key).toHaveProperty('use', 'sig');
            expect(key).toHaveProperty('alg', 'RS256');
            expect(key).toHaveProperty('kid');
            expect(key).toHaveProperty('n'); // RSA modulus
            expect(key).toHaveProperty('e'); // RSA exponent
        });
    });
    
    describe('IMS OIDC Flow Requirements', () => {
        test('Login endpoint should validate required parameters', async () => {
            // Test with missing parameters
            const response = await fetch(LTI_LOGIN_ENDPOINT);
            expect(response.status).toBe(400);
            
            // Test with only some parameters
            const incompleteParams = new URLSearchParams({
                iss: 'https://lti-ri.imsglobal.org',
                login_hint: 'test-user',
            });
            
            const incompleteResponse = await fetch(`${LTI_LOGIN_ENDPOINT}?${incompleteParams.toString()}`);
            expect(incompleteResponse.status).toBe(400);
        });
        
        test('Login endpoint should include all required OIDC parameters in redirect', async () => {
            const params = new URLSearchParams({
                iss: 'https://lti-ri.imsglobal.org',
                login_hint: 'test-user',
                target_link_uri: LTI_LAUNCH_ENDPOINT,
                client_id: 'ims-test-client',
                lti_message_hint: 'test-hint',
            });
            
            const response = await fetch(`${LTI_LOGIN_ENDPOINT}?${params.toString()}`, {
                redirect: 'manual',
            });
            
            expect(response.status).toBe(302);
            
            const location = response.headers.get('location');
            expect(location).toBeDefined();
            
            // Check all required parameters
            expect(location).toContain('scope=openid');
            expect(location).toContain('response_type=id_token');
            expect(location).toContain('client_id=ims-test-client');
            expect(location).toContain('redirect_uri=');
            expect(location).toContain('login_hint=test-user');
            expect(location).toContain('state=');
            expect(location).toContain('nonce=');
            expect(location).toContain('prompt=none');
            expect(location).toContain('response_mode=form_post');
            expect(location).toContain('lti_message_hint=test-hint');
        });
    });
    
    describe('IMS Launch Flow Requirements', () => {
        test('Launch endpoint should validate state and ID token', async () => {
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
        
        test('Launch should validate all required LTI claims', async () => {
            // 1. Create a valid state in the database
            const state = await createLtiState();
            
            // 2. Create a valid ID token but missing required LTI claims
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: 'https://lti-ri.imsglobal.org',
                aud: 'ims-test-client',
                // Missing deployment_id and other required claims
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
            
            // Should fail with 401 Unauthorized due to missing claims
            expect(response.status).toBe(401);
        });
        
        test('Launch should support different message types', async () => {
            // Test resource link message type
            const state1 = await createLtiState();
            const nonce1 = crypto.randomBytes(16).toString('hex');
            const idToken1 = createLtiIdToken({
                nonce: nonce1,
                iss: 'https://lti-ri.imsglobal.org',
                aud: 'ims-test-client',
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'ims-test-deployment',
                'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
                    id: 'test-resource-link-id',
                },
            }, keyPair.privateKey, keyPair.keyId);
            
            const formData1 = new URLSearchParams({
                state: state1,
                id_token: idToken1,
            });
            
            const response1 = await fetch(LTI_LAUNCH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData1,
                redirect: 'manual',
            });
            
            expect(response1.status).toBe(302);
            expect(response1.headers.get('location')).toContain('/lti/app?session=');
            
            // Test deep linking message type
            const state2 = await createLtiState({
                target_link_uri: LTI_DEEP_LINKING_ENDPOINT,
            });
            const nonce2 = crypto.randomBytes(16).toString('hex');
            const idToken2 = createLtiIdToken({
                nonce: nonce2,
                iss: 'https://lti-ri.imsglobal.org',
                aud: 'ims-test-client',
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'ims-test-deployment',
                'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
                    deep_link_return_url: 'https://lti-ri.imsglobal.org/platforms/2533/deep_link_returns',
                    accept_types: ['link'],
                    accept_media_types: '*/*',
                },
            }, keyPair.privateKey, keyPair.keyId);
            
            const formData2 = new URLSearchParams({
                state: state2,
                id_token: idToken2,
            });
            
            const response2 = await fetch(LTI_DEEP_LINKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData2,
                redirect: 'manual',
            });
            
            expect(response2.status).toBe(302);
            expect(response2.headers.get('location')).toContain('/lti/content-selection?session=');
        });
    });
    
    describe('Security Requirements', () => {
        test('Should validate token issuer', async () => {
            const state = await createLtiState();
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: 'https://invalid-issuer.example.com', // Different issuer than registered
                aud: 'ims-test-client',
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'ims-test-deployment',
            }, keyPair.privateKey, keyPair.keyId);
            
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
            
            expect(response.status).toBe(401);
        });
        
        test('Should validate token audience', async () => {
            const state = await createLtiState();
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: 'https://lti-ri.imsglobal.org',
                aud: 'invalid-client-id', // Different client_id than registered
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'ims-test-deployment',
            }, keyPair.privateKey, keyPair.keyId);
            
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
            
            expect(response.status).toBe(401);
        });
        
        test('Should validate deployment ID', async () => {
            const state = await createLtiState();
            const nonce = crypto.randomBytes(16).toString('hex');
            const idToken = createLtiIdToken({
                nonce,
                iss: 'https://lti-ri.imsglobal.org',
                aud: 'ims-test-client',
                'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'invalid-deployment-id', // Different deployment_id
            }, keyPair.privateKey, keyPair.keyId);
            
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
            
            expect(response.status).toBe(404);
        });
    });
});