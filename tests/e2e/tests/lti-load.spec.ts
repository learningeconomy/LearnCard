import { describe, test, expect } from 'vitest';
import { fetch } from 'undici';
import { 
    registerTestPlatform, 
    createLtiState, 
    createLtiIdToken, 
    generateTestKeyPair,
    getMongoClient,
    closeMongoClient
} from './helpers/lti.helpers';
import { URLSearchParams } from 'url';
import crypto from 'crypto';

/**
 * Create an LTI launch for load testing
 */
async function createLaunch(keyPair: ReturnType<typeof generateTestKeyPair>, launchId: number) {
    // Create a unique state
    const state = await createLtiState();
    
    // Create a unique nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create an ID token with unique identifier
    const idToken = createLtiIdToken({
        nonce,
        iss: `http://localhost:9001`,
        sub: `test-user-${launchId}`,
        aud: 'test-client-id',
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
        'https://purl.imsglobal.org/spec/lti/claim/context': {
            id: `test-context-${launchId}`,
            label: `Test Course ${launchId}`,
            title: `Test Course Title ${launchId}`,
        },
    }, keyPair.privateKey, keyPair.keyId);
    
    // Return the launch parameters
    return {
        state,
        idToken,
    };
}

/**
 * Execute a single LTI launch
 */
async function executeLaunch(state: string, idToken: string, expectedStatus = 302) {
    const formData = new URLSearchParams({
        state,
        id_token: idToken,
    });
    
    const response = await fetch('http://localhost:4100/lti/launch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        redirect: 'manual',
    });
    
    return {
        status: response.status,
        ok: response.status === expectedStatus,
        location: response.headers.get('location'),
    };
}

describe('LTI Load Testing', () => {
    let keyPair: ReturnType<typeof generateTestKeyPair>;
    
    beforeAll(async () => {
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
        await closeMongoClient();
    });
    
    test('Should handle a single launch request', async () => {
        const { state, idToken } = await createLaunch(keyPair, 1);
        const result = await executeLaunch(state, idToken);
        
        expect(result.ok).toBe(true);
        expect(result.location).toContain('/lti/app?session=');
    });
    
    test('Should handle 10 sequential launch requests', async () => {
        const results = [];
        
        for (let i = 0; i < 10; i++) {
            const { state, idToken } = await createLaunch(keyPair, i + 100);
            const result = await executeLaunch(state, idToken);
            results.push(result);
        }
        
        // Verify all launches were successful
        expect(results.every(r => r.ok)).toBe(true);
        
        // Verify each launch got a unique session
        const sessions = results
            .map(r => r.location?.split('session=')[1])
            .filter(Boolean);
        
        expect(sessions.length).toBe(10);
        // Check for uniqueness
        expect(new Set(sessions).size).toBe(10);
    });
    
    test('Should handle 10 concurrent launch requests', async () => {
        // Create 10 launch requests in parallel
        const launches = await Promise.all(
            Array.from({ length: 10 }, (_, i) => createLaunch(keyPair, i + 200))
        );
        
        // Execute all 10 launches concurrently
        const results = await Promise.all(
            launches.map(({ state, idToken }) => executeLaunch(state, idToken))
        );
        
        // Verify all launches were successful
        expect(results.every(r => r.ok)).toBe(true);
        
        // Verify each launch got a unique session
        const sessions = results
            .map(r => r.location?.split('session=')[1])
            .filter(Boolean);
        
        expect(sessions.length).toBe(10);
        // Check for uniqueness
        expect(new Set(sessions).size).toBe(10);
    });
    
    test('Should handle mixed valid and invalid launches', async () => {
        // Create 5 valid launches
        const validLaunches = await Promise.all(
            Array.from({ length: 5 }, (_, i) => createLaunch(keyPair, i + 300))
        );
        
        // Create 5 invalid launches (with invalid states)
        const invalidLaunches = Array.from({ length: 5 }, (_, i) => ({
            state: `invalid-state-${i}`,
            idToken: createLtiIdToken({
                iss: `http://localhost:9001`,
                sub: `test-user-invalid-${i}`,
                aud: 'test-client-id',
                'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
            }, keyPair.privateKey, keyPair.keyId),
        }));
        
        // Execute all launches concurrently
        const validResults = await Promise.all(
            validLaunches.map(({ state, idToken }) => executeLaunch(state, idToken, 302))
        );
        
        const invalidResults = await Promise.all(
            invalidLaunches.map(({ state, idToken }) => executeLaunch(state, idToken, 400))
        );
        
        // Verify valid launches were successful
        expect(validResults.every(r => r.ok)).toBe(true);
        
        // Verify invalid launches were rejected
        expect(invalidResults.every(r => r.status === 400)).toBe(true);
    });
    
    test('Performance: Should measure response time for launches', async () => {
        const measurements = [];
        
        // Measure time for 5 sequential launches
        for (let i = 0; i < 5; i++) {
            const start = Date.now();
            const { state, idToken } = await createLaunch(keyPair, i + 400);
            const result = await executeLaunch(state, idToken);
            const elapsed = Date.now() - start;
            
            measurements.push({
                index: i,
                elapsed,
                ok: result.ok,
            });
        }
        
        // Log launch times
        console.log('Sequential launch times (ms):', measurements.map(m => m.elapsed));
        
        // Calculate statistics
        const times = measurements.map(m => m.elapsed);
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        console.log(`Launch time stats - Avg: ${avg.toFixed(2)}ms, Min: ${min}ms, Max: ${max}ms`);
        
        // No specific assertions, but we can check launches were successful
        expect(measurements.every(m => m.ok)).toBe(true);
        
        // Reasonable threshold for performance (adjust based on your requirements)
        expect(max).toBeLessThan(5000); // Maximum launch time < 5 seconds
    });
    
    test('Database performance: Should check MongoDB connections during load', async () => {
        const mongo = await getMongoClient();
        
        // Execute 20 concurrent launches
        const launches = await Promise.all(
            Array.from({ length: 20 }, (_, i) => createLaunch(keyPair, i + 500))
        );
        
        // Start measuring
        const start = Date.now();
        
        // Execute all launches concurrently
        const results = await Promise.all(
            launches.map(({ state, idToken }) => executeLaunch(state, idToken))
        );
        
        const elapsed = Date.now() - start;
        
        // Check MongoDB server stats to see connection utilization
        const db = mongo.db('admin');
        const serverStatus = await db.command({ serverStatus: 1 });
        
        console.log('MongoDB Connection pool stats:');
        console.log('- Current connections:', serverStatus.connections.current);
        console.log('- Available connections:', serverStatus.connections.available);
        console.log('- Total created connections:', serverStatus.connections.totalCreated);
        
        console.log(`Total time for 20 concurrent launches: ${elapsed}ms`);
        console.log(`Average time per launch: ${(elapsed / 20).toFixed(2)}ms`);
        
        // Verify all launches were successful
        expect(results.every(r => r.ok)).toBe(true);
    });
});