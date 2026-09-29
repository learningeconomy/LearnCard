import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SSSApiClient } from './api-client';

import type { AuthProvider } from './types';

const SENTINEL_TOKEN = 'SENTINEL_TOKEN_XYZ';
const DID_CHALLENGE_ERROR = 'This operation requires the DID-challenge flow; use createSSSStrategy';

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

describe('SSSApiClient', () => {
    let client: SSSApiClient;
    let calls: { url: string; init?: RequestInit }[];

    beforeEach(() => {
        calls = [];

        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
            calls.push({ url: url.toString(), init });
            return new Response(
                JSON.stringify({
                    authShare: null,
                    primaryDid: null,
                    securityLevel: 'basic',
                    recoveryMethods: [],
                    keyProvider: 'sss',
                    shareVersion: 1,
                    sssActivationState: 'active',
                    recoverySessionToken: 'recovery-session-token',
                    rebindSessionToken: 'rebind-session-token',
                    recoveryMethodsRequireConfirmation: [],
                }),
                { status: 200 }
            );
        });

        client = new SSSApiClient({
            serverUrl: 'http://test-server:5100/api',
            authProvider: createMockAuthProvider(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses X-Auth-Token rather than Authorization for provider-authenticated reads', async () => {
        await client.getAuthShare();

        const headers = calls[0]!.init?.headers as Record<string, string>;
        expect(headers['X-Auth-Token']).toBe(SENTINEL_TOKEN);
        expect(headers.Authorization).toBeUndefined();
        expect(calls[0]!.url).not.toContain(SENTINEL_TOKEN);
    });

    it('keeps recovery read credentials out of the URL', async () => {
        await client.getRecoveryShare('passkey', 'credential-1');

        const headers = calls[0]!.init?.headers as Record<string, string>;
        expect(headers['X-Auth-Token']).toBe(SENTINEL_TOKEN);
        expect(calls[0]!.url).not.toContain(SENTINEL_TOKEN);
        expect(calls[0]!.url).not.toMatch(/[?&](token|share)=/i);
    });

    it('retains the valid unauthenticated identity-recovery helpers', async () => {
        await client.startIdentityRecovery('recovery@example.com');
        await client.verifyIdentityRecovery('recovery@example.com', '123456');
        await client.useIdentityRecoverySession('recovery-session-token', 'phrase');

        expect(calls.map(call => call.url)).toEqual([
            'http://test-server:5100/api/keys/recovery-session/start',
            'http://test-server:5100/api/keys/recovery-session/verify',
            'http://test-server:5100/api/keys/recovery-session/recover',
        ]);
    });

    it('retains identity rebind because it supplies both DID proof and the auth token', async () => {
        await client.completeIdentityRecoveryRebind({
            recoverySessionToken: 'rebind-session-token',
            newAuthToken: SENTINEL_TOKEN,
            providerType: 'firebase',
            primaryDid: 'did:key:zTest',
            authShare: { encryptedData: 'encrypted-share', encryptedDek: '', iv: '' },
            didAuthVp: 'did-auth-vp',
        });

        const headers = calls[0]!.init?.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer did-auth-vp');
        expect(headers['X-Auth-Token']).toBe(SENTINEL_TOKEN);
    });

    it.each([
        [
            'storeAuthShare',
            () =>
                client.storeAuthShare({
                    authShare: { encryptedData: 'share', encryptedDek: '', iv: '' },
                    primaryDid: 'did:key:zTest',
                }),
        ],
        ['addRecoveryMethod', () => client.addRecoveryMethod({ type: 'phrase' })],
        ['markMigrated', () => client.markMigrated()],
        ['activate', () => client.activate()],
        ['sendEmailBackupShare', () => client.sendEmailBackupShare('email-share')],
        ['addRecoveryEmail', () => client.addRecoveryEmail('recovery@example.com')],
        ['verifyRecoveryEmail', () => client.verifyRecoveryEmail('123456')],
        ['deleteUserKey', () => client.deleteUserKey()],
    ])('%s fails closed instead of calling a route without DID proof', async (_name, call) => {
        await expect(call()).rejects.toThrow(DID_CHALLENGE_ERROR);
        expect(calls).toHaveLength(0);
    });
});
