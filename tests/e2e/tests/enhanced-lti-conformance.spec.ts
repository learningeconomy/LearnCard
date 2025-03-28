import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { fetch, Response } from 'undici';
import { URLSearchParams } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Import the mock helpers
import {
  registerPlatform,
  createState,
  getAndConsumeState,
  generateLtiJwks,
  createMockLtiIdToken,
  getEmptyLearnCard
} from './helpers/lti-conformance.helpers';

// Import the real helper to generate test key pairs
import { generateTestKeyPair } from './helpers/lti.helpers';

// Mock the helpers in the actual LTI module
vi.mock('../../../services/learn-card-network/learn-cloud-service/src/helpers/lti.helpers', () => ({
  registerPlatform: (data: any) => registerPlatform(data),
  findPlatform: (issuer: string, clientId: string, deploymentId?: string) => 
    registerPlatform({ issuer, client_id: clientId, deployment_id: deploymentId }),
  createState: (data: any) => createState(data),
  getAndConsumeState: (state: string) => getAndConsumeState(state),
  generateLtiJwks: () => generateLtiJwks(),
  getEmptyLearnCard: () => getEmptyLearnCard()
}));

// Mock fetch used in LTI implementation
vi.mock('undici', async () => {
  const actual = await vi.importActual('undici');
  return {
    ...actual,
    fetch: vi.fn().mockImplementation((url, options) => {
      // Mock JWKS response
      if (url.includes('jwks') || url.includes('platform_keys')) {
        return Promise.resolve(new Response(JSON.stringify(generateLtiJwks()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // If it's a real call, pass through to the real fetch
      return actual.fetch(url, options);
    })
  };
});

/**
 * Enhanced LTI 1.3 Conformance Tests
 * 
 * These tests validate the LearnCard LTI implementation against the IMS Global
 * conformance requirements. They're designed to run without external dependencies.
 */
describe('Enhanced LTI 1.3 Conformance Tests', () => {
  let keyPair: ReturnType<typeof generateTestKeyPair>;
  
  // Test constants
  const SERVER_URL = 'http://localhost:4100';
  const LTI_JWKS_ENDPOINT = `${SERVER_URL}/.well-known/jwks.json`;
  const LTI_CONFIG_ENDPOINT = `${SERVER_URL}/lti/config`;
  const LTI_LOGIN_ENDPOINT = `${SERVER_URL}/lti/login`;
  const LTI_LAUNCH_ENDPOINT = `${SERVER_URL}/lti/launch`;
  const LTI_DEEP_LINKING_ENDPOINT = `${SERVER_URL}/lti/deep-linking`;
  const LTI_ISSUE_CREDENTIAL_ENDPOINT = `${SERVER_URL}/lti/issue-credential`;
  
  beforeAll(() => {
    // Generate key pair for tests
    keyPair = generateTestKeyPair();
    
    // Register test platforms
    return Promise.all([
      registerPlatform({
        issuer: 'https://lti-ri.imsglobal.org',
        client_id: 'ims-test-client',
        deployment_id: 'ims-test-deployment',
        auth_login_url: 'https://lti-ri.imsglobal.org/platforms/2533/authorizations/new',
        auth_token_url: 'https://lti-ri.imsglobal.org/platforms/2533/access_tokens',
        key_set_url: 'https://lti-ri.imsglobal.org/platforms/2533/platform_keys/2533.json'
      }),
      registerPlatform({
        issuer: 'https://canvas.instructure.com',
        client_id: 'canvas-client',
        deployment_id: 'canvas-deployment',
        auth_login_url: 'https://canvas.instructure.com/api/lti/authorize',
        auth_token_url: 'https://canvas.instructure.com/api/lti/oauth2/token',
        key_set_url: 'https://canvas.instructure.com/api/lti/jwks'
      }),
      registerPlatform({
        issuer: 'https://blackboard.com',
        client_id: 'blackboard-client',
        deployment_id: 'blackboard-deployment',
        auth_login_url: 'https://blackboard.com/learn/api/lti/authorize',
        auth_token_url: 'https://blackboard.com/learn/api/lti/token',
        key_set_url: 'https://blackboard.com/learn/api/lti/keys'
      })
    ]);
  });

  // Reset mocks between tests
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });
  
  describe('OIDC Authentication Flow Tests', () => {
    test('Login endpoint should validate all required parameters', async () => {
      // Missing all parameters
      let response = await fetch(LTI_LOGIN_ENDPOINT);
      expect(response.status).toBe(400);
      
      // Missing target_link_uri
      response = await fetch(`${LTI_LOGIN_ENDPOINT}?iss=https://lti-ri.imsglobal.org&login_hint=user&client_id=ims-test-client`);
      expect(response.status).toBe(400);
      
      // Missing login_hint
      response = await fetch(`${LTI_LOGIN_ENDPOINT}?iss=https://lti-ri.imsglobal.org&target_link_uri=${LTI_LAUNCH_ENDPOINT}&client_id=ims-test-client`);
      expect(response.status).toBe(400);
      
      // Missing client_id
      response = await fetch(`${LTI_LOGIN_ENDPOINT}?iss=https://lti-ri.imsglobal.org&login_hint=user&target_link_uri=${LTI_LAUNCH_ENDPOINT}`);
      expect(response.status).toBe(400);
      
      // Missing issuer
      response = await fetch(`${LTI_LOGIN_ENDPOINT}?login_hint=user&target_link_uri=${LTI_LAUNCH_ENDPOINT}&client_id=ims-test-client`);
      expect(response.status).toBe(400);
    });
    
    test('Login endpoint should reject unknown platforms', async () => {
      response = await fetch(`${LTI_LOGIN_ENDPOINT}?iss=https://unknown-platform.com&login_hint=user&target_link_uri=${LTI_LAUNCH_ENDPOINT}&client_id=unknown-client`);
      expect(response.status).toBe(404);
    });
    
    test('Login endpoint should generate OIDC redirect with all required parameters', async () => {
      const params = new URLSearchParams({
        iss: 'https://lti-ri.imsglobal.org',
        login_hint: 'test-user',
        target_link_uri: LTI_LAUNCH_ENDPOINT,
        client_id: 'ims-test-client',
        lti_message_hint: 'test-hint'
      });
      
      const response = await fetch(`${LTI_LOGIN_ENDPOINT}?${params.toString()}`, {
        redirect: 'manual'
      });
      
      expect(response.status).toBe(302);
      
      const location = response.headers.get('location');
      expect(location).toBeDefined();
      
      // Verify all required parameters are present
      const redirectUrl = new URL(location as string);
      expect(redirectUrl.searchParams.get('scope')).toBe('openid');
      expect(redirectUrl.searchParams.get('response_type')).toBe('id_token');
      expect(redirectUrl.searchParams.get('client_id')).toBe('ims-test-client');
      expect(redirectUrl.searchParams.get('redirect_uri')).toBe(LTI_LAUNCH_ENDPOINT);
      expect(redirectUrl.searchParams.get('login_hint')).toBe('test-user');
      expect(redirectUrl.searchParams.get('state')).toBeTruthy(); // Present and non-empty
      expect(redirectUrl.searchParams.get('nonce')).toBeTruthy(); // Present and non-empty
      expect(redirectUrl.searchParams.get('prompt')).toBe('none');
      expect(redirectUrl.searchParams.get('response_mode')).toBe('form_post');
      expect(redirectUrl.searchParams.get('lti_message_hint')).toBe('test-hint');
    });
    
    test('Login endpoint should work with different platforms', async () => {
      // Test with Canvas
      const canvasParams = new URLSearchParams({
        iss: 'https://canvas.instructure.com',
        login_hint: 'canvas-user',
        target_link_uri: LTI_LAUNCH_ENDPOINT,
        client_id: 'canvas-client'
      });
      
      const canvasResponse = await fetch(`${LTI_LOGIN_ENDPOINT}?${canvasParams.toString()}`, {
        redirect: 'manual'
      });
      
      expect(canvasResponse.status).toBe(302);
      const canvasLocation = canvasResponse.headers.get('location');
      expect(canvasLocation).toBeDefined();
      expect(canvasLocation).toContain('https://canvas.instructure.com/api/lti/authorize');
      
      // Test with Blackboard
      const blackboardParams = new URLSearchParams({
        iss: 'https://blackboard.com',
        login_hint: 'blackboard-user',
        target_link_uri: LTI_LAUNCH_ENDPOINT,
        client_id: 'blackboard-client'
      });
      
      const blackboardResponse = await fetch(`${LTI_LOGIN_ENDPOINT}?${blackboardParams.toString()}`, {
        redirect: 'manual'
      });
      
      expect(blackboardResponse.status).toBe(302);
      const blackboardLocation = blackboardResponse.headers.get('location');
      expect(blackboardLocation).toBeDefined();
      expect(blackboardLocation).toContain('https://blackboard.com/learn/api/lti/authorize');
    });
  });
  
  describe('Launch Validation Tests', () => {
    test('Launch endpoint should validate state parameter', async () => {
      // Missing state and id_token
      let response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      expect(response.status).toBe(400);
      
      // Only state, missing id_token
      const formData1 = new URLSearchParams({
        state: 'test-state'
      });
      
      response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData1
      });
      expect(response.status).toBe(400);
      
      // State and id_token, but invalid state
      const formData2 = new URLSearchParams({
        state: 'invalid-state',
        id_token: 'test-token'
      });
      
      response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData2
      });
      expect(response.status).toBe(400);
    });
    
    test('Launch should validate all required LTI claims', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce: crypto.randomBytes(16).toString('hex')
      });
      
      // 2. Create ID token missing claims
      const idToken = createMockLtiIdToken({
        // Missing message_type and deployment_id
        'https://purl.imsglobal.org/spec/lti/claim/message_type': undefined,
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': undefined
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Should fail due to missing claims
      expect(response.status).toBe(401);
    });
    
    test('Launch should validate token issuer', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce: crypto.randomBytes(16).toString('hex')
      });
      
      // 2. Create ID token with wrong issuer
      const idToken = createMockLtiIdToken({
        iss: 'https://wrong-issuer.com'
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Should fail due to issuer mismatch
      expect(response.status).toBe(401);
    });
    
    test('Launch should validate token audience', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce: crypto.randomBytes(16).toString('hex')
      });
      
      // 2. Create ID token with wrong audience
      const idToken = createMockLtiIdToken({
        aud: 'wrong-client'
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Should fail due to audience mismatch
      expect(response.status).toBe(401);
    });
    
    test('Launch should validate deployment ID', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce: crypto.randomBytes(16).toString('hex')
      });
      
      // 2. Create ID token with wrong deployment ID
      const idToken = createMockLtiIdToken({
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'wrong-deployment'
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Should fail due to deployment ID mismatch
      expect(response.status).toBe(404);
    });
  });
  
  describe('Message Type Tests', () => {
    test('Resource Link launch should be processed correctly', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce
      });
      
      // 2. Create a valid resource link ID token
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
        'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
          id: 'test-resource-link',
          title: 'Test Resource'
        }
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });
      
      // Should succeed with redirect to app page
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/lti/app?session=');
    });
    
    test('Deep Linking launch should be processed correctly', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce,
        target_link_uri: LTI_DEEP_LINKING_ENDPOINT
      });
      
      // 2. Create a valid deep linking ID token
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
        'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
          deep_link_return_url: 'https://lti-ri.imsglobal.org/platforms/2533/deep_link_returns',
          accept_types: ['link', 'ltiResourceLink'],
          accept_media_types: '*/*',
          accept_presentation_document_targets: ['iframe', 'window']
        }
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_DEEP_LINKING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });
      
      // Should succeed with redirect to content selection page
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/lti/content-selection?session=');
    });
    
    test('Unsupported message type should be rejected', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce
      });
      
      // 2. Create an ID token with unsupported message type
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'UnsupportedMessageType'
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      // Should be rejected with 400 Bad Request
      expect(response.status).toBe(400);
    });
  });
  
  describe('Context and Role Tests', () => {
    test('Launch should process different LTI context types', async () => {
      // Test different context types
      const contextTypes = [
        'http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering',
        'http://purl.imsglobal.org/vocab/lis/v2/course#CourseSection',
        'http://purl.imsglobal.org/vocab/lis/v2/course#CourseTemplate',
        'http://purl.imsglobal.org/vocab/lis/v2/course#Group'
      ];
      
      // Test each context type
      for (const contextType of contextTypes) {
        // 1. Create a valid state
        const stateValue = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        await createState({
          platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
          state: stateValue,
          nonce
        });
        
        // 2. Create ID token with the context type
        const idToken = createMockLtiIdToken({
          nonce,
          'https://purl.imsglobal.org/spec/lti/claim/context': {
            id: 'test-context',
            title: 'Test Context',
            type: [contextType]
          }
        }, keyPair);
        
        // 3. Submit the launch
        const formData = new URLSearchParams({
          state: stateValue,
          id_token: idToken
        });
        
        const response = await fetch(LTI_LAUNCH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData,
          redirect: 'manual'
        });
        
        // Should succeed for all valid context types
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toContain('/lti/app?session=');
      }
    });
    
    test('Launch should process different LTI roles', async () => {
      // Test different roles
      const roles = [
        'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
        'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
        'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator',
        'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
        'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator'
      ];
      
      // Test each role
      for (const role of roles) {
        // 1. Create a valid state
        const stateValue = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        await createState({
          platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
          state: stateValue,
          nonce
        });
        
        // 2. Create ID token with the role
        const idToken = createMockLtiIdToken({
          nonce,
          'https://purl.imsglobal.org/spec/lti/claim/roles': [role]
        }, keyPair);
        
        // 3. Submit the launch
        const formData = new URLSearchParams({
          state: stateValue,
          id_token: idToken
        });
        
        const response = await fetch(LTI_LAUNCH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData,
          redirect: 'manual'
        });
        
        // Should succeed for all valid roles
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toContain('/lti/app?session=');
      }
    });
    
    test('Launch should handle multiple roles', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce
      });
      
      // 2. Create ID token with multiple roles
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/roles': [
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
          'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator'
        ]
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });
      
      // Should succeed with multiple roles
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/lti/app?session=');
    });
  });
  
  describe('Custom Parameter Tests', () => {
    test('Launch should process custom parameters', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce
      });
      
      // 2. Create ID token with custom parameters
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/custom': {
          tool_consumer_instance_guid: 'test-instance',
          context_title: 'Custom Course Title',
          course_section_sourcedid: 'section-123',
          custom_param1: 'value1',
          custom_param2: 'value2'
        }
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });
      
      // Should succeed with custom parameters
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/lti/app?session=');
    });
    
    test('Launch should support custom DID parameter', async () => {
      // 1. Create a valid state
      const stateValue = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');
      await createState({
        platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
        state: stateValue,
        nonce
      });
      
      // 2. Create ID token with DID in custom parameters
      const idToken = createMockLtiIdToken({
        nonce,
        'https://purl.imsglobal.org/spec/lti/claim/custom': {
          did: 'did:web:test.example.com'
        }
      }, keyPair);
      
      // 3. Submit the launch
      const formData = new URLSearchParams({
        state: stateValue,
        id_token: idToken
      });
      
      const response = await fetch(LTI_LAUNCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });
      
      // Should succeed with DID parameter
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/lti/app?session=');
    });
  });
});