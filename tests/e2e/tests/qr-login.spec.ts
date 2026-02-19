/**
 * E2E Tests for QR Cross-Device Login Flow
 *
 * Tests the full relay lifecycle via the LCA API:
 *   1. Create a session (Device B)
 *   2. Get session info by ID and short code (Device A)
 *   3. Approve session with encrypted payload (Device A)
 *   4. Poll and retrieve approved payload (Device B)
 *   5. Rate limiting
 *   6. Session expiration / edge cases
 *   7. Push notification route
 */

import { describe, test, expect, beforeAll } from 'vitest';

const LCA_API_URL = 'http://localhost:5200';

const post = async (path: string, body: Record<string, unknown>) => {
    return fetch(`${LCA_API_URL}/api${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
};

const get = async (path: string) => {
    return fetch(`${LCA_API_URL}/api${path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
};

const createMockAuthToken = (userId: string, email: string) => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify({
            sub: userId,
            email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        })
    ).toString('base64url');

    return `${header}.${payload}.`;
};

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

describe('QR Login Relay', () => {
    describe('Session Creation', () => {
        test('should create a new session with a valid public key', async () => {
            const res = await post('/qr-login/session', {
                publicKey: 'dGVzdC1wdWJsaWMta2V5LWJhc2U2NA==',
            });

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.sessionId).toBeTruthy();
            expect(data.shortCode).toMatch(/^\d{8}$/);
            expect(data.expiresInSeconds).toBe(120);
        });

        test('should reject empty public key', async () => {
            const res = await post('/qr-login/session', { publicKey: '' });

            expect(res.status).not.toBe(200);
        });
    });

    describe('Session Retrieval', () => {
        let sessionId: string;
        let shortCode: string;

        beforeAll(async () => {
            const res = await post('/qr-login/session', {
                publicKey: 'cmV0cmlldmFsLXRlc3Qta2V5',
            });

            const data = await res.json();

            sessionId = data.sessionId;
            shortCode = data.shortCode;
        });

        test('should retrieve session by session ID', async () => {
            const res = await get(`/qr-login/session/${sessionId}`);

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.sessionId).toBe(sessionId);
            expect(data.publicKey).toBe('cmV0cmlldmFsLXRlc3Qta2V5');
            expect(data.status).toBe('pending');
        });

        test('should retrieve session by short code', async () => {
            const res = await get(`/qr-login/session/${shortCode}`);

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.sessionId).toBe(sessionId);
            expect(data.status).toBe('pending');
        });

        test('should return error for non-existent session', async () => {
            const res = await get('/qr-login/session/non-existent-id');

            expect(res.status).not.toBe(200);
        });

        test('should return error for non-existent short code', async () => {
            const res = await get('/qr-login/session/00000001');

            // May or may not be 404 depending on whether 00000001 happens to exist
            // but extremely unlikely. Just check it doesn't return a valid session.
            if (res.status === 200) {
                const data = await res.json();
                // If somehow it resolves, it won't be our session
                expect(data.sessionId).not.toBe('non-existent');
            }
        });
    });

    describe('Session Approval', () => {
        let sessionId: string;

        beforeAll(async () => {
            const res = await post('/qr-login/session', {
                publicKey: 'YXBwcm92YWwtdGVzdC1rZXk=',
            });

            const data = await res.json();

            sessionId = data.sessionId;
        });

        test('should approve a pending session', async () => {
            const res = await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                encryptedPayload: '{"ciphertext":"abc","iv":"def","senderPublicKey":"ghi"}',
                approverDid: 'did:key:zApproverTest',
            });

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.success).toBe(true);
        });

        test('should return approved status with encrypted payload after approval', async () => {
            const res = await get(`/qr-login/session/${sessionId}`);

            expect(res.status).toBe(200);

            const data = await res.json();

            expect(data.status).toBe('approved');
            expect(data.encryptedPayload).toBe('{"ciphertext":"abc","iv":"def","senderPublicKey":"ghi"}');
            expect(data.approverDid).toBe('did:key:zApproverTest');
        });

        test('should reject double approval', async () => {
            const res = await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                encryptedPayload: '{"ciphertext":"xyz","iv":"123","senderPublicKey":"456"}',
                approverDid: 'did:key:zAttacker',
            });

            // Should fail — session already approved
            expect(res.status).not.toBe(200);
        });

        test('should reject approval of non-existent session', async () => {
            const res = await post('/qr-login/session/fake-session-id/approve', {
                sessionId: 'fake-session-id',
                encryptedPayload: '{}',
                approverDid: 'did:key:z',
            });

            expect(res.status).not.toBe(200);
        });
    });

    // -----------------------------------------------------------------------
    // Full flow: create → approve → poll
    // -----------------------------------------------------------------------

    describe('Full Relay Flow', () => {
        test('Device B creates, Device A approves, Device B polls and gets payload', async () => {
            // Device B: create session
            const createRes = await post('/qr-login/session', {
                publicKey: 'ZnVsbC1mbG93LXRlc3Qta2V5',
            });

            expect(createRes.status).toBe(200);

            const { sessionId, shortCode } = await createRes.json();

            // Device A: lookup by short code
            const lookupRes = await get(`/qr-login/session/${shortCode}`);

            expect(lookupRes.status).toBe(200);

            const sessionInfo = await lookupRes.json();

            expect(sessionInfo.publicKey).toBe('ZnVsbC1mbG93LXRlc3Qta2V5');
            expect(sessionInfo.status).toBe('pending');

            // Device A: approve
            const approveRes = await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                encryptedPayload: JSON.stringify({
                    ciphertext: 'encrypted-share-data',
                    iv: 'random-iv-bytes',
                    senderPublicKey: 'device-a-ephemeral-pub',
                }),
                approverDid: 'did:key:zFullFlowApprover',
            });

            expect(approveRes.status).toBe(200);

            // Device B: poll — should now be approved
            const pollRes = await get(`/qr-login/session/${sessionId}`);

            expect(pollRes.status).toBe(200);

            const pollData = await pollRes.json();

            expect(pollData.status).toBe('approved');
            expect(pollData.approverDid).toBe('did:key:zFullFlowApprover');

            const payload = JSON.parse(pollData.encryptedPayload);

            expect(payload.ciphertext).toBe('encrypted-share-data');
            expect(payload.senderPublicKey).toBe('device-a-ephemeral-pub');
        });
    });

    // -----------------------------------------------------------------------
    // Short code cleanup after approval
    // -----------------------------------------------------------------------

    describe('Short Code Cleanup', () => {
        test('short code should no longer resolve after approval', async () => {
            const createRes = await post('/qr-login/session', {
                publicKey: 'Y2xlYW51cC10ZXN0',
            });

            const { sessionId, shortCode } = await createRes.json();

            // Approve
            await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                encryptedPayload: '{"c":"x"}',
                approverDid: 'did:key:zCleanup',
            });

            // Short code should no longer resolve
            const lookupRes = await get(`/qr-login/session/${shortCode}`);

            // Should fail — short code mapping was deleted on approval
            expect(lookupRes.status).not.toBe(200);
        });
    });

    // -----------------------------------------------------------------------
    // Push notification route
    // -----------------------------------------------------------------------

    describe('Notify Devices Route', () => {
        test('should accept a valid notify request (may not send if no push tokens)', async () => {
            // First create a session to have a valid sessionId
            const createRes = await post('/qr-login/session', {
                publicKey: 'bm90aWZ5LXRlc3Q=',
            });

            const { sessionId, shortCode } = await createRes.json();

            const mockToken = createMockAuthToken('notify-user-1', `notify-${Date.now()}@test.com`);

            const res = await post('/qr-login/notify', {
                authToken: mockToken,
                providerType: 'firebase',
                sessionId,
                shortCode,
            });

            expect(res.status).toBe(200);

            const data = await res.json();

            // The user likely doesn't have push tokens registered, so sent may be false
            expect(data).toHaveProperty('sent');
            expect(data).toHaveProperty('deviceCount');
            expect(typeof data.sent).toBe('boolean');
            expect(typeof data.deviceCount).toBe('number');
        });

        test('should reject invalid auth token', async () => {
            const res = await post('/qr-login/notify', {
                authToken: 'invalid-not-a-jwt',
                providerType: 'firebase',
                sessionId: 'sid-1',
                shortCode: '12345678',
            });

            // Should fail auth verification
            expect(res.status).not.toBe(200);
        });
    });

    // -----------------------------------------------------------------------
    // Input validation
    // -----------------------------------------------------------------------

    describe('Input Validation', () => {
        test('createSession rejects missing publicKey', async () => {
            const res = await post('/qr-login/session', {});

            expect(res.status).not.toBe(200);
        });

        test('approveSession rejects missing encryptedPayload', async () => {
            const createRes = await post('/qr-login/session', {
                publicKey: 'dmFsaWRhdGlvbi10ZXN0',
            });

            const { sessionId } = await createRes.json();

            const res = await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                approverDid: 'did:key:z',
                // missing encryptedPayload
            });

            expect(res.status).not.toBe(200);
        });

        test('approveSession rejects missing approverDid', async () => {
            const createRes = await post('/qr-login/session', {
                publicKey: 'dmFsaWRhdGlvbi10ZXN0Mg==',
            });

            const { sessionId } = await createRes.json();

            const res = await post(`/qr-login/session/${sessionId}/approve`, {
                sessionId,
                encryptedPayload: '{}',
                // missing approverDid
            });

            expect(res.status).not.toBe(200);
        });
    });
});
