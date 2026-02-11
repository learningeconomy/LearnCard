/**
 * Tests for QR Login Client
 *
 * Tests the full flow: session creation → approval → polling + decryption.
 * Uses a mock fetch to simulate the relay server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    createQrLoginSession,
    pollQrLoginSession,
    getQrLoginSessionInfo,
    approveQrLoginSession,
    pollUntilApproved,
} from './qr-login';

import {
    generateEphemeralKeypair,
    encryptShareForTransfer,
} from './qr-crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVER_URL = 'https://api.example.com';

const supportsX25519 = async (): Promise<boolean> => {
    try {
        await crypto.subtle.generateKey({ name: 'X25519' }, false, ['deriveBits']);
        return true;
    } catch {
        return false;
    }
};

// In-memory "server" state for mock fetch
let sessions: Map<string, {
    sessionId: string;
    shortCode: string;
    publicKey: string;
    status: 'pending' | 'approved';
    encryptedPayload?: string;
    approverDid?: string;
}>;

let shortCodeMap: Map<string, string>;

const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    // POST /qr-login/session — create session
    if (urlStr.endsWith('/qr-login/session') && method === 'POST') {
        const sessionId = `session-${Math.random().toString(36).slice(2, 8)}`;
        const shortCode = Math.floor(Math.random() * 100_000_000).toString().padStart(8, '0');

        sessions.set(sessionId, {
            sessionId,
            shortCode,
            publicKey: body.publicKey,
            status: 'pending',
        });

        shortCodeMap.set(shortCode, sessionId);

        return new Response(JSON.stringify({
            sessionId,
            shortCode,
            expiresInSeconds: 120,
        }), { status: 200 });
    }

    // GET /qr-login/session/:lookup — get session
    const getMatch = urlStr.match(/\/qr-login\/session\/([^/]+)$/);

    if (getMatch && method === 'GET') {
        let sessionId = getMatch[1]!;

        if (/^\d{8}$/.test(sessionId)) {
            const resolved = shortCodeMap.get(sessionId);

            if (!resolved) {
                return new Response('Not found', { status: 404 });
            }

            sessionId = resolved;
        }

        const session = sessions.get(sessionId);

        if (!session) {
            return new Response('Not found', { status: 404 });
        }

        return new Response(JSON.stringify({
            sessionId: session.sessionId,
            publicKey: session.publicKey,
            status: session.status,
            encryptedPayload: session.encryptedPayload,
            approverDid: session.approverDid,
        }), { status: 200 });
    }

    // POST /qr-login/session/:id/approve
    const approveMatch = urlStr.match(/\/qr-login\/session\/([^/]+)\/approve$/);

    if (approveMatch && method === 'POST') {
        const sessionId = approveMatch[1]!;
        const session = sessions.get(sessionId);

        if (!session) {
            return new Response('Not found', { status: 404 });
        }

        session.status = 'approved';
        session.encryptedPayload = body.encryptedPayload;
        session.approverDid = body.approverDid;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Not found', { status: 404 });
});

describe('QR Login Client', async () => {
    const supported = await supportsX25519();

    beforeEach(() => {
        sessions = new Map();
        shortCodeMap = new Map();
        vi.stubGlobal('fetch', mockFetch);
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // -----------------------------------------------------------------------
    // Session creation
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('createQrLoginSession returns session info and ephemeral keypair', async () => {
        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        expect(session.sessionId).toBeTruthy();
        expect(session.shortCode).toMatch(/^\d{8}$/);
        expect(session.expiresInSeconds).toBe(120);

        expect(ephemeralKeypair.publicKey).toBeTruthy();
        expect(ephemeralKeypair.privateKey.type).toBe('private');

        expect(qrPayload.sessionId).toBe(session.sessionId);
        expect(qrPayload.publicKey).toBe(ephemeralKeypair.publicKey);
        expect(qrPayload.serverUrl).toBe(SERVER_URL);
    });

    // -----------------------------------------------------------------------
    // Session info retrieval
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('getQrLoginSessionInfo retrieves session by ID', async () => {
        const { session } = await createQrLoginSession({ serverUrl: SERVER_URL });

        const info = await getQrLoginSessionInfo({ serverUrl: SERVER_URL }, session.sessionId);

        expect(info.sessionId).toBe(session.sessionId);
        expect(info.status).toBe('pending');
        expect(info.publicKey).toBeTruthy();
    });

    it.skipIf(!supported)('getQrLoginSessionInfo retrieves session by short code', async () => {
        const { session } = await createQrLoginSession({ serverUrl: SERVER_URL });

        const info = await getQrLoginSessionInfo({ serverUrl: SERVER_URL }, session.shortCode);

        expect(info.sessionId).toBe(session.sessionId);
    });

    // -----------------------------------------------------------------------
    // Full flow: create → approve → poll → decrypt
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('full cross-device flow: Device B creates, Device A approves, Device B decrypts', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
        const approverDid = 'did:key:zApprover123';

        // --- Device B: create session ---
        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        // --- Device A: scan QR, get session info ---
        const sessionInfo = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            qrPayload.sessionId
        );

        expect(sessionInfo.status).toBe('pending');

        // --- Device A: approve (encrypt + push) ---
        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            deviceShare,
            approverDid,
            sessionInfo.publicKey
        );

        // --- Device B: poll and decrypt ---
        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
            expect(result.approverDid).toBe(approverDid);
        }
    });

    // -----------------------------------------------------------------------
    // Polling
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('pollQrLoginSession returns pending when not yet approved', async () => {
        const { session, ephemeralKeypair } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('pending');
    });

    it.skipIf(!supported)('pollUntilApproved resolves when session is approved', async () => {
        const deviceShare = 'share-for-polling-test';
        const approverDid = 'did:key:zPoller';

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        // Simulate Device A approving after a short delay
        setTimeout(async () => {
            const info = await getQrLoginSessionInfo(
                { serverUrl: SERVER_URL },
                qrPayload.sessionId
            );

            await approveQrLoginSession(
                { serverUrl: SERVER_URL },
                session.sessionId,
                deviceShare,
                approverDid,
                info.publicKey
            );
        }, 50);

        const result = await pollUntilApproved(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey,
            { intervalMs: 30, timeoutMs: 5000 }
        );

        expect(result.deviceShare).toBe(deviceShare);
        expect(result.approverDid).toBe(approverDid);
    });

    it.skipIf(!supported)('pollUntilApproved can be aborted', async () => {
        const { session, ephemeralKeypair } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const controller = new AbortController();

        // Abort after 100ms
        setTimeout(() => controller.abort(), 100);

        await expect(
            pollUntilApproved(
                { serverUrl: SERVER_URL },
                session.sessionId,
                ephemeralKeypair.privateKey,
                { intervalMs: 30, timeoutMs: 10000, signal: controller.signal }
            )
        ).rejects.toThrow('aborted');
    });

    // -----------------------------------------------------------------------
    // Account hint in encrypted payload
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('full flow with accountHint: hint is encrypted and returned to Device B', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
        const approverDid = 'did:key:zHintTest';
        const accountHint = 'user@example.com';

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const sessionInfo = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            qrPayload.sessionId
        );

        // Device A approves WITH accountHint
        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            deviceShare,
            approverDid,
            sessionInfo.publicKey,
            accountHint
        );

        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
            expect(result.approverDid).toBe(approverDid);
            expect(result.accountHint).toBe(accountHint);
        }
    });

    // -----------------------------------------------------------------------
    // shareVersion in encrypted envelope
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('full flow with shareVersion: version is encrypted and returned to Device B', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
        const approverDid = 'did:key:zVersionTest';
        const shareVersion = 5;

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const sessionInfo = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            qrPayload.sessionId
        );

        // Device A approves WITH shareVersion
        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            deviceShare,
            approverDid,
            sessionInfo.publicKey,
            undefined, // no accountHint
            shareVersion
        );

        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
            expect(result.approverDid).toBe(approverDid);
            expect(result.shareVersion).toBe(shareVersion);
        }
    });

    it.skipIf(!supported)('shareVersion is undefined when not provided by Device A', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
        const approverDid = 'did:key:zNoVersion';

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const sessionInfo = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            qrPayload.sessionId
        );

        // Device A approves WITHOUT shareVersion
        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            deviceShare,
            approverDid,
            sessionInfo.publicKey
            // no accountHint, no shareVersion
        );

        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
            expect(result.shareVersion).toBeUndefined();
        }
    });

    it.skipIf(!supported)('full flow with both accountHint and shareVersion', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';
        const approverDid = 'did:key:zBothFields';
        const accountHint = 'user@example.com';
        const shareVersion = 3;

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        const sessionInfo = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            qrPayload.sessionId
        );

        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            deviceShare,
            approverDid,
            sessionInfo.publicKey,
            accountHint,
            shareVersion
        );

        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
            expect(result.approverDid).toBe(approverDid);
            expect(result.accountHint).toBe(accountHint);
            expect(result.shareVersion).toBe(shareVersion);
        }
    });

    it.skipIf(!supported)('pollUntilApproved returns shareVersion', async () => {
        const deviceShare = 'share-for-poll-version';
        const approverDid = 'did:key:zPollVersion';
        const shareVersion = 7;

        const { session, ephemeralKeypair, qrPayload } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        // Simulate Device A approving after a short delay
        setTimeout(async () => {
            const info = await getQrLoginSessionInfo(
                { serverUrl: SERVER_URL },
                qrPayload.sessionId
            );

            await approveQrLoginSession(
                { serverUrl: SERVER_URL },
                session.sessionId,
                deviceShare,
                approverDid,
                info.publicKey,
                undefined,
                shareVersion
            );
        }, 50);

        const result = await pollUntilApproved(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey,
            { intervalMs: 30, timeoutMs: 5000 }
        );

        expect(result.deviceShare).toBe(deviceShare);
        expect(result.approverDid).toBe(approverDid);
        expect(result.shareVersion).toBe(shareVersion);
    });

    // -----------------------------------------------------------------------
    // Short code flow (typed code instead of QR scan)
    // -----------------------------------------------------------------------

    it.skipIf(!supported)('full flow via short code (phone → desktop)', async () => {
        const deviceShare = 'share-via-short-code';
        const approverDid = 'did:key:zDesktopUser';

        // Device B (phone) creates session
        const { session, ephemeralKeypair } = await createQrLoginSession({
            serverUrl: SERVER_URL,
        });

        // Device A (desktop) types in the 6-digit code
        const info = await getQrLoginSessionInfo(
            { serverUrl: SERVER_URL },
            session.shortCode
        );

        // Device A approves
        await approveQrLoginSession(
            { serverUrl: SERVER_URL },
            info.sessionId,
            deviceShare,
            approverDid,
            info.publicKey
        );

        // Device B polls and decrypts
        const result = await pollQrLoginSession(
            { serverUrl: SERVER_URL },
            session.sessionId,
            ephemeralKeypair.privateKey
        );

        expect(result.status).toBe('approved');

        if (result.status === 'approved') {
            expect(result.deviceShare).toBe(deviceShare);
        }
    });
});
