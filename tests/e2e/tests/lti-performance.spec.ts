import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { fetch, Response } from 'undici';
import { URLSearchParams } from 'url';
import crypto from 'crypto';

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
 * Create an LTI launch for load testing
 */
async function createPerfLaunch(keyPair: ReturnType<typeof generateTestKeyPair>, launchId: number) {
  // Create a unique state value
  const stateValue = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Store state in the mock database
  await createState({
    platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
    state: stateValue,
    nonce
  });
  
  // Create a unique ID token
  const idToken = createMockLtiIdToken({
    nonce,
    sub: `test-user-${launchId}`,
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: `test-context-${launchId}`,
      label: `Test Course ${launchId}`,
      title: `Test Course Title ${launchId}`
    },
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: `test-resource-${launchId}`,
      title: `Test Resource ${launchId}`
    }
  }, keyPair);
  
  return {
    stateValue,
    idToken
  };
}

/**
 * Execute a single LTI launch
 */
async function executeLaunch(stateValue: string, idToken: string, expectedStatus = 302) {
  const formData = new URLSearchParams({
    state: stateValue,
    id_token: idToken
  });
  
  const startTime = performance.now();
  
  const response = await fetch('http://localhost:4100/lti/launch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData,
    redirect: 'manual'
  });
  
  const endTime = performance.now();
  
  return {
    status: response.status,
    ok: response.status === expectedStatus,
    location: response.headers.get('location'),
    elapsedTime: endTime - startTime
  };
}

/**
 * LTI Performance and Load Testing
 * 
 * These tests measure the performance and scaling characteristics
 * of the LTI implementation without requiring external dependencies.
 */
describe('LTI Performance and Load Tests', () => {
  let keyPair: ReturnType<typeof generateTestKeyPair>;
  
  beforeAll(() => {
    // Generate key pair for tests
    keyPair = generateTestKeyPair();
    
    // Register test platform
    return registerPlatform({
      issuer: 'https://lti-ri.imsglobal.org',
      client_id: 'ims-test-client',
      deployment_id: 'ims-test-deployment',
      auth_login_url: 'https://lti-ri.imsglobal.org/platforms/2533/authorizations/new',
      auth_token_url: 'https://lti-ri.imsglobal.org/platforms/2533/access_tokens',
      key_set_url: 'https://lti-ri.imsglobal.org/platforms/2533/platform_keys/2533.json'
    });
  });
  
  // Reset mocks between tests
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });
  
  describe('Basic Performance Tests', () => {
    test('Should handle a single launch request', async () => {
      // Create a launch
      const { stateValue, idToken } = await createPerfLaunch(keyPair, 1);
      
      // Execute the launch
      const result = await executeLaunch(stateValue, idToken);
      
      // Verify success
      expect(result.ok).toBe(true);
      expect(result.location).toContain('/lti/app?session=');
      
      // Check performance - not making hard assertions because it depends on the environment
      console.log(`Single launch time: ${result.elapsedTime.toFixed(2)}ms`);
    });
    
    test('Should handle 10 sequential launch requests', async () => {
      const results = [];
      const startTime = performance.now();
      
      // Execute 10 launches sequentially
      for (let i = 0; i < 10; i++) {
        const { stateValue, idToken } = await createPerfLaunch(keyPair, i + 100);
        const result = await executeLaunch(stateValue, idToken);
        results.push(result);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all launches were successful
      expect(results.every(r => r.ok)).toBe(true);
      
      // Check for unique session IDs
      const sessions = results
        .map(r => r.location?.split('session=')[1])
        .filter(Boolean);
      
      expect(sessions.length).toBe(10);
      expect(new Set(sessions).size).toBe(10);
      
      // Log performance metrics
      console.log(`Total time for 10 sequential launches: ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per launch: ${(totalTime / 10).toFixed(2)}ms`);
      
      // List individual launch times
      const launchTimes = results.map(r => r.elapsedTime);
      console.log('Sequential launch times (ms):', launchTimes.map(t => t.toFixed(2)));
      
      // Calculate statistics
      const avg = launchTimes.reduce((sum, t) => sum + t, 0) / launchTimes.length;
      const min = Math.min(...launchTimes);
      const max = Math.max(...launchTimes);
      
      console.log(`Launch time stats - Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
    });
    
    test('Should handle 10 concurrent launch requests', async () => {
      // Create 10 launches in parallel
      const launches = await Promise.all(
        Array.from({ length: 10 }, (_, i) => createPerfLaunch(keyPair, i + 200))
      );
      
      // Execute all 10 launches concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        launches.map(({ stateValue, idToken }) => executeLaunch(stateValue, idToken))
      );
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all launches were successful
      expect(results.every(r => r.ok)).toBe(true);
      
      // Check for unique session IDs
      const sessions = results
        .map(r => r.location?.split('session=')[1])
        .filter(Boolean);
      
      expect(sessions.length).toBe(10);
      expect(new Set(sessions).size).toBe(10);
      
      // Log performance metrics
      console.log(`Total time for 10 concurrent launches: ${totalTime.toFixed(2)}ms`);
      console.log(`Effective time per launch: ${(totalTime / 10).toFixed(2)}ms`);
    });
  });
  
  describe('Advanced Performance Tests', () => {
    test('Should handle mixed launch types', async () => {
      // Create 5 resource link launches and 5 deep linking launches
      const resourceLinkLaunches = await Promise.all(
        Array.from({ length: 5 }, (_, i) => {
          const stateValue = crypto.randomBytes(16).toString('hex');
          const nonce = crypto.randomBytes(16).toString('hex');
          
          // Create state pointing to launch endpoint
          return createState({
            platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
            state: stateValue,
            nonce,
            target_link_uri: 'http://localhost:4100/lti/launch'
          }).then(() => ({
            stateValue,
            idToken: createMockLtiIdToken({
              nonce,
              'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
              'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
                id: `resource-${i}`,
                title: `Resource ${i}`
              }
            }, keyPair),
            endpoint: 'http://localhost:4100/lti/launch'
          }));
        })
      );
      
      const deepLinkingLaunches = await Promise.all(
        Array.from({ length: 5 }, (_, i) => {
          const stateValue = crypto.randomBytes(16).toString('hex');
          const nonce = crypto.randomBytes(16).toString('hex');
          
          // Create state pointing to deep linking endpoint
          return createState({
            platform_id: 'https://lti-ri.imsglobal.org#ims-test-client#ims-test-deployment',
            state: stateValue,
            nonce,
            target_link_uri: 'http://localhost:4100/lti/deep-linking'
          }).then(() => ({
            stateValue,
            idToken: createMockLtiIdToken({
              nonce,
              'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
              'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
                deep_link_return_url: 'https://test.com/return',
                accept_types: ['link']
              }
            }, keyPair),
            endpoint: 'http://localhost:4100/lti/deep-linking'
          }));
        })
      );
      
      // Combine launches
      const allLaunches = [...resourceLinkLaunches, ...deepLinkingLaunches];
      
      // Execute launches concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        allLaunches.map(({ stateValue, idToken, endpoint }) => {
          const formData = new URLSearchParams({
            state: stateValue,
            id_token: idToken
          });
          
          return fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData,
            redirect: 'manual'
          });
        })
      );
      const endTime = performance.now();
      
      // Verify all launches succeeded
      expect(results.every(r => r.status === 302)).toBe(true);
      
      // Check that resource link and deep linking launches redirect to correct endpoints
      const redirectUrls = results.map(r => r.headers.get('location'));
      
      const resourceLinkRedirects = redirectUrls.slice(0, 5);
      const deepLinkingRedirects = redirectUrls.slice(5);
      
      expect(resourceLinkRedirects.every(url => url && url.includes('/lti/app?session='))).toBe(true);
      expect(deepLinkingRedirects.every(url => url && url.includes('/lti/content-selection?session='))).toBe(true);
      
      // Log performance metrics
      console.log(`Total time for 10 mixed launches: ${(endTime - startTime).toFixed(2)}ms`);
    });
    
    test('Should handle burst of many concurrent launches', async () => {
      // Number of concurrent launches
      const COUNT = 50;
      
      // Create many launches in parallel
      const launches = await Promise.all(
        Array.from({ length: COUNT }, (_, i) => createPerfLaunch(keyPair, i + 300))
      );
      
      // Execute all launches concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        launches.map(({ stateValue, idToken }) => executeLaunch(stateValue, idToken))
      );
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Calculate success rate
      const successCount = results.filter(r => r.ok).length;
      const successRate = (successCount / COUNT) * 100;
      
      // Verify most launches were successful
      expect(successRate).toBeGreaterThanOrEqual(90);
      
      // Log performance metrics
      console.log(`Success rate for ${COUNT} concurrent launches: ${successRate.toFixed(2)}%`);
      console.log(`Total time for ${COUNT} concurrent launches: ${totalTime.toFixed(2)}ms`);
      console.log(`Throughput: ${(COUNT / (totalTime / 1000)).toFixed(2)} launches/second`);
      
      // Calculate response time percentiles
      const responseTimes = results.map(r => r.elapsedTime).sort((a, b) => a - b);
      const p50 = responseTimes[Math.floor(0.5 * responseTimes.length)];
      const p95 = responseTimes[Math.floor(0.95 * responseTimes.length)];
      const p99 = responseTimes[Math.floor(0.99 * responseTimes.length)];
      
      console.log(`Response time percentiles: p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, p99=${p99.toFixed(2)}ms`);
    });
    
    test('Should handle mixed valid and invalid requests', async () => {
      // Create 5 valid launches
      const validLaunches = await Promise.all(
        Array.from({ length: 5 }, (_, i) => createPerfLaunch(keyPair, i + 400))
      );
      
      // Create 5 invalid launches (with invalid states or tokens)
      const invalidLaunches = Array.from({ length: 5 }, (_, i) => ({
        stateValue: `invalid-state-${i}`,
        idToken: createMockLtiIdToken({
          nonce: crypto.randomBytes(16).toString('hex'),
          iss: 'https://invalid-issuer.com'
        }, keyPair)
      }));
      
      // Mix valid and invalid launches
      const allLaunches = [...validLaunches, ...invalidLaunches];
      
      // Execute all launches concurrently
      const startTime = performance.now();
      const results = await Promise.all(
        allLaunches.map(({ stateValue, idToken }) => {
          const formData = new URLSearchParams({
            state: stateValue,
            id_token: idToken
          });
          
          return fetch('http://localhost:4100/lti/launch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData,
            redirect: 'manual'
          });
        })
      );
      const endTime = performance.now();
      
      // Verify correct status codes for valid and invalid launches
      const validResults = results.slice(0, 5);
      const invalidResults = results.slice(5);
      
      expect(validResults.every(r => r.status === 302)).toBe(true);
      expect(invalidResults.every(r => r.status !== 302)).toBe(true);
      
      // Log performance metrics
      console.log(`Total time for 10 mixed valid/invalid launches: ${(endTime - startTime).toFixed(2)}ms`);
      
      // Compare response times for valid vs invalid requests
      const validLaunchTimes = validLaunches.map((_, i) => results[i].headers.get('x-response-time') || '0');
      const invalidLaunchTimes = invalidLaunches.map((_, i) => results[i + 5].headers.get('x-response-time') || '0');
      
      console.log('Valid launch response times:', validLaunchTimes);
      console.log('Invalid launch response times:', invalidLaunchTimes);
    });
  });
  
  describe('Credential Issuance Performance', () => {
    test('Should measure credential issuance performance', async () => {
      // First create a launch and get a session
      const { stateValue, idToken } = await createPerfLaunch(keyPair, 500);
      
      // Execute the launch to get a session
      const launchResult = await executeLaunch(stateValue, idToken);
      expect(launchResult.ok).toBe(true);
      
      // Extract session ID
      const sessionId = launchResult.location?.split('session=')[1];
      expect(sessionId).toBeDefined();
      
      // Now measure credential issuance performance
      const credentialData = {
        achievement: 'Completed Performance Test Course',
        score: 95,
        completion: true
      };
      
      const startTime = performance.now();
      const credentialResponse = await fetch('http://localhost:4100/lti/issue-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          credentialData
        })
      });
      const endTime = performance.now();
      
      // Verify credential issuance was successful
      expect(credentialResponse.status).toBe(200);
      
      const result = await credentialResponse.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('credential');
      
      // Log performance metrics
      console.log(`Credential issuance time: ${(endTime - startTime).toFixed(2)}ms`);
    });
    
    test('Should handle multiple concurrent credential issuances', async () => {
      // Number of concurrent issuances
      const COUNT = 10;
      
      // First create multiple launches and get sessions
      const sessions = [];
      for (let i = 0; i < COUNT; i++) {
        const { stateValue, idToken } = await createPerfLaunch(keyPair, 600 + i);
        const launchResult = await executeLaunch(stateValue, idToken);
        const sessionId = launchResult.location?.split('session=')[1];
        if (sessionId) {
          sessions.push(sessionId);
        }
      }
      
      expect(sessions.length).toBe(COUNT);
      
      // Now measure concurrent credential issuance performance
      const credentialRequests = sessions.map((sessionId, i) => ({
        sessionId,
        credentialData: {
          achievement: `Completed Performance Test Course ${i}`,
          score: 90 + i,
          completion: true
        }
      }));
      
      const startTime = performance.now();
      const results = await Promise.all(
        credentialRequests.map(request => 
          fetch('http://localhost:4100/lti/issue-credential', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
          }).then(res => res.json())
        )
      );
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify all credential issuances were successful
      expect(results.every(r => r.success === true)).toBe(true);
      
      // Log performance metrics
      console.log(`Total time for ${COUNT} concurrent credential issuances: ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per issuance: ${(totalTime / COUNT).toFixed(2)}ms`);
      console.log(`Throughput: ${(COUNT / (totalTime / 1000)).toFixed(2)} issuances/second`);
    });
  });
});