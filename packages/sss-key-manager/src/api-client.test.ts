import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

import { SSSApiClient } from './api-client';
import { bufferToBase64 } from './crypto';
import { decryptEmailRelayPayload } from './email-relay-crypto';
import type { AuthProvider } from './types';

// P0-4: SSSApiClient must never place tokens/shares in a URL query string —
// only in headers or the POST/PUT/DELETE body. See sss-key-manager AGENTS.md
// / sss-prod-cutover-p0.md P0-4.

const SENTINEL_TOKEN = 'SENTINEL_TOKEN_XYZ';
const SENTINEL_SHARE = 'SENTINEL_SHARE_XYZ';
const EMAIL_SHARE = `0001${'ab'.repeat(48)}`;
let relayPublicKey = '';
let relayPrivateKey = '';

beforeAll(async () => {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveBits',
    ]);
    const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.exportKey('spki', keyPair.publicKey),
        crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    ]);

    relayPublicKey = bufferToBase64(publicKey);
    relayPrivateKey = bufferToBase64(privateKey);
});

const createMockAuthProvider = (): AuthProvider => ({
    getIdToken: vi.fn().mockResolvedValue(SENTINEL_TOKEN),
    getCurrentUser: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'sentinel-user@example.com',
        providerType: 'firebase' as const,
    }),
    getProviderType: vi.fn().mockReturnValue('firebase' as const),
    signOut: vi.fn().mockResolvedValue(undefined),
});

describe('SSSApiClient — no secrets in URLs (P0-4)', () => {
    let client: SSSApiClient;
    let calls: { url: string; init?: RequestInit }[];

    beforeEach(() => {
        calls = [];

        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
            calls.push({ url: url.toString(), init });
            return new Response(
                JSON.stringify({
                    success: true,
                    shareVersion: 1,
                    maskedEmail: 're***@example.com',
                }),
                { status: 200 }
            );
        });

        client = new SSSApiClient({
            serverUrl: 'http://test-server:5100/api',
            authProvider: createMockAuthProvider(),
            escrowRelayPublicKey: relayPublicKey,
            escrowRelayKeyId: 'api-client-test-key',
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const assertUrlIsClean = (url: string): void => {
        expect(url).not.toContain(SENTINEL_TOKEN);
        expect(url).not.toContain(SENTINEL_SHARE);

        const queryString = url.split('?')[1] ?? '';
        expect(queryString.toLowerCase()).not.toMatch(/token=/);
        expect(queryString.toLowerCase()).not.toMatch(/share=/);
    };

    it('getAuthShare', async () => {
        await client.getAuthShare();
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('storeAuthShare', async () => {
        await client.storeAuthShare({
            authShare: { encryptedData: SENTINEL_SHARE, encryptedDek: '', iv: 'iv' },
            primaryDid: 'did:key:zTest',
        });
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('addRecoveryMethod', async () => {
        await client.addRecoveryMethod({
            type: 'backup',
            encryptedShare: { encryptedData: SENTINEL_SHARE, iv: 'iv' },
        });
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('getRecoveryShare sends the token via header, not the URL', async () => {
        await client.getRecoveryShare('passkey', 'cred-1');
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);

        // Confirm the token is actually transmitted — just not via the URL.
        const headers = calls[0]!.init?.headers as Record<string, string>;
        expect(headers['X-Auth-Token']).toBe(SENTINEL_TOKEN);
    });

    it('markMigrated', async () => {
        await client.markMigrated();
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('activate', async () => {
        await client.activate();
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('sendEmailBackupShare', async () => {
        await client.sendEmailBackupShare(EMAIL_SHARE, 'recovery@example.com');
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);

        const body = JSON.parse(calls[0]!.init?.body as string);
        const decrypted = await decryptEmailRelayPayload(body.relayPayload, relayPrivateKey);

        expect(calls[0]!.init?.body).not.toContain(EMAIL_SHARE);
        expect(body.emailShare).toBeUndefined();
        expect(decrypted.recoveryKey).toBe(EMAIL_SHARE);
        expect(decrypted.targetEmail).toBe('recovery@example.com');
        expect(decrypted.confirmationCode).toBe(body.confirmationCode);
    });

    it('addRecoveryEmail', async () => {
        await client.addRecoveryEmail('recovery@example.com');
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('verifyRecoveryEmail', async () => {
        await client.verifyRecoveryEmail('123456');
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('deleteUserKey', async () => {
        await client.deleteUserKey();
        expect(calls).toHaveLength(1);
        assertUrlIsClean(calls[0]!.url);
    });

    it('grep-able guarantee: no "token=" or "share=" in any constructed URL across every method', async () => {
        await client.getAuthShare();
        await client.storeAuthShare({
            authShare: { encryptedData: SENTINEL_SHARE, encryptedDek: '', iv: 'iv' },
            primaryDid: 'did:key:zTest',
        });
        await client.addRecoveryMethod({ type: 'phrase' });
        await client.getRecoveryShare('phrase');
        await client.markMigrated();
        await client.activate();
        await client.sendEmailBackupShare(EMAIL_SHARE, 'recovery@example.com');
        await client.addRecoveryEmail('recovery@example.com');
        await client.verifyRecoveryEmail('123456');
        await client.deleteUserKey();

        expect(calls.length).toBeGreaterThanOrEqual(10);
        calls.forEach(call => assertUrlIsClean(call.url));
    });
});
