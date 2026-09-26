import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';
import { getLearnCard, type LearnCard } from './helpers/learncard.helpers';

const LCA_API_URL = 'http://localhost:5200';
const redis = new Redis({ port: 6381 });

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

const newToken = (label: string) => {
    const id = `${label}-${crypto.randomUUID()}`;
    return createMockAuthToken(id, `${id}@example.com`);
};

const auth = (authToken: string) => ({ authToken, providerType: 'firebase' });
const share = (encryptedData: string) => ({
    encryptedData,
    encryptedDek: `${encryptedData}-dek`,
    iv: `${encryptedData}-iv`,
});

const createChallengeHeaders = async (learnCard: LearnCard, challenge: string) => {
    await redis.set(`challenge|${learnCard.id.did()}|${challenge}`, 'valid', 'EX', 300);
    const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
    if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${vpJwt}` };
};

afterAll(async () => {
    await redis.quit();
});

describe('SSS Key Management API', () => {
    let learnCard: LearnCard;
    const mockAuthToken = newToken('sss-api');

    beforeAll(async () => {
        learnCard = await getLearnCard('a'.repeat(64));
    });

    // Every sensitive request gets its own nonce. Delete also requires a challenge
    // field in its input schema; use the very same nonce as the signed VP.
    const write = async (
        path: string,
        body: Record<string, unknown>,
        status = 200,
        signer = learnCard
    ) => {
        const challenge = crypto.randomUUID();
        const response = await fetch(`${LCA_API_URL}/api/keys/${path}`, {
            method: path === 'auth-share' ? 'PUT' : 'POST',
            headers: await createChallengeHeaders(signer, challenge),
            body: JSON.stringify({ ...body, ...(path === 'delete' ? { challenge } : {}) }),
        });
        const data = await response.json();
        expect(response.status, JSON.stringify(data)).toBe(status);
        if (status === 200) expect(data.success).toBe(true);
        return data;
    };

    const store = (token: string, encryptedData: string, extra: Record<string, unknown> = {}) =>
        write('auth-share', {
            ...auth(token),
            authShare: share(encryptedData),
            primaryDid: learnCard.id.did(),
            ...extra,
        });

    const getAuthShare = async (token: string, shareVersion?: number) => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...auth(token), shareVersion }),
        });
        expect(response.status).toBe(200);
        return response.json();
    };

    const getRecoveryShare = async (token: string, type: string, credentialId?: string) => {
        const params = new URLSearchParams({
            providerType: 'firebase',
            type,
            ...(credentialId ? { credentialId } : {}),
        });
        const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
            headers: { 'X-Auth-Token': token },
        });
        expect(response.status).toBe(200);
        return response.json();
    };

    const enroll = async (
        token: string,
        type: 'passkey' | 'phrase' | 'backup',
        encryptedData: string,
        extra: { credentialId?: string; shareVersion?: number; salt?: string } = {}
    ) => {
        const { salt, ...method } = extra;
        await write('recovery', {
            ...auth(token),
            type,
            encryptedShare: { encryptedData, iv: 'recovery-iv', ...(salt ? { salt } : {}) },
            ...method,
        });
        expect(await getRecoveryShare(token, type, method.credentialId)).toBeNull();
        await write('recovery/confirm', {
            ...auth(token),
            type,
            credentialId: method.credentialId,
        });
    };

    describe('Health Check', () => {
        test('LCA API should be healthy', async () => {
            expect((await fetch(`${LCA_API_URL}/api/health-check`)).status).toBe(200);
        });
    });

    describe('Store and Retrieve Auth Share', () => {
        test('should store an auth share', async () => {
            expect(
                await store(mockAuthToken, 'initial-auth-share', { expectedShareVersion: 0 })
            ).toMatchObject({ shareVersion: 1, expectedShareVersionChecked: true });
        });
        test('should retrieve the stored auth share', async () => {
            expect(await getAuthShare(mockAuthToken)).toMatchObject({
                authShare: share('initial-auth-share'),
                primaryDid: learnCard.id.did(),
                keyProvider: 'sss',
            });
        });
    });

    describe('Add and Retrieve Recovery Method', () => {
        test('should add and confirm a passkey recovery method', async () => {
            await enroll(mockAuthToken, 'passkey', 'first-passkey');
        });
        test('should retrieve the stored recovery share', async () => {
            expect(await getRecoveryShare(mockAuthToken, 'passkey')).toMatchObject({
                encryptedShare: { encryptedData: 'first-passkey' },
                shareVersion: 1,
            });
        });
    });

    describe('Multiple Recovery Methods', () => {
        test('should add and confirm a second passkey recovery method', async () => {
            await enroll(mockAuthToken, 'passkey', 'second-passkey', {
                credentialId: 'passkey-credential-123',
            });
        });
        test('should list all recovery methods via getAuthShare', async () => {
            const data = await getAuthShare(mockAuthToken);
            expect(data.recoveryMethods).toHaveLength(2);
            expect(
                data.recoveryMethods.every(
                    (method: { type: string; confirmedAt?: string }) =>
                        method.type === 'passkey' && !!method.confirmedAt
                )
            ).toBe(true);
        });
    });

    describe('Migration Support', () => {
        test('should reject marking a newly created SSS record as migrated', async () => {
            const token = newToken('migration');
            await store(token, 'migration-share');
            expect(await write('migrate', auth(token), 400)).toMatchObject({
                message: 'This key record is not eligible for migration.',
            });
        });
    });

    describe('Delete User Key', () => {
        test('should delete user key and all associated data', async () => {
            const token = newToken('delete');
            await store(token, 'delete-share');
            await enroll(token, 'backup', 'delete-backup');
            await write('delete', auth(token));
            expect(await getAuthShare(token)).toBeNull();
            expect(await getRecoveryShare(token, 'backup')).toBeNull();
        });
    });

    describe('Edge Cases - Non-existent User', () => {
        test('should return null for non-existent user getAuthShare', async () => {
            expect(await getAuthShare(newToken('missing'))).toBeNull();
        });
        test('should return null for non-existent recovery method', async () => {
            expect(await getRecoveryShare(newToken('no-recovery'), 'passkey')).toBeNull();
        });
    });

    describe('Edge Cases - Auth Share Updates', () => {
        test('should allow updating an existing auth share and reject stale CAS writes', async () => {
            const token = newToken('update');
            await store(token, 'initial-data', { expectedShareVersion: 0 });
            expect(await store(token, 'updated-data', { expectedShareVersion: 1 })).toMatchObject({
                shareVersion: 2,
                expectedShareVersionChecked: true,
            });
            await write(
                'auth-share',
                {
                    ...auth(token),
                    primaryDid: learnCard.id.did(),
                    authShare: share('stale-data'),
                    expectedShareVersion: 1,
                },
                409
            );
            expect(await getAuthShare(token)).toMatchObject({
                authShare: share('updated-data'),
                primaryDid: learnCard.id.did(),
                shareVersion: 2,
            });
        });
        test('rejects mismatched primaryDid and a different signer taking ownership', async () => {
            const token = newToken('owner');
            const other = await getLearnCard('3'.repeat(64));
            await store(token, 'owner-share');
            expect(
                await write(
                    'auth-share',
                    { ...auth(token), primaryDid: other.id.did(), authShare: share('wrong-did') },
                    403
                )
            ).toMatchObject({ message: 'The authenticated DID does not match primaryDid.' });
            expect(
                await write(
                    'auth-share',
                    { ...auth(token), primaryDid: other.id.did(), authShare: share('wrong-owner') },
                    403,
                    other
                )
            ).toMatchObject({ message: 'The authenticated DID does not own this key record.' });
            expect(await getAuthShare(token)).toMatchObject({
                primaryDid: learnCard.id.did(),
                authShare: share('owner-share'),
            });
        });
    });

    describe('Edge Cases - Recovery Method Retrieval', () => {
        const token = newToken('recovery-edge');
        beforeAll(async () => {
            await store(token, 'recovery-edge-data');
        });
        test('should add backup recovery method', async () => {
            await enroll(token, 'backup', 'backup-codes-encrypted');
        });
        test('should retrieve specific passkey by credentialId', async () => {
            await enroll(token, 'passkey', 'passkey-1-data', { credentialId: 'passkey-cred-1' });
            await enroll(token, 'passkey', 'passkey-2-data', { credentialId: 'passkey-cred-2' });
            expect(await getRecoveryShare(token, 'passkey', 'passkey-cred-2')).toMatchObject({
                encryptedShare: { encryptedData: 'passkey-2-data' },
            });
        });
        test('should return first passkey when no credentialId specified', async () => {
            expect(await getRecoveryShare(token, 'passkey')).toMatchObject({
                encryptedShare: { encryptedData: 'passkey-1-data' },
            });
        });
        test('should include all recovery methods with createdAt dates', async () => {
            const data = await getAuthShare(token);
            expect(data.recoveryMethods).toHaveLength(3);
            data.recoveryMethods.forEach((method: { type: string; createdAt: string }) => {
                expect(['passkey', 'backup']).toContain(method.type);
                expect(new Date(method.createdAt).getTime()).toBeGreaterThan(0);
            });
        });
    });

    describe('Edge Cases - Security Level', () => {
        test('should return default security level for new user', async () => {
            const token = newToken('security');
            await store(token, 'security-data');
            expect(await getAuthShare(token)).toMatchObject({ securityLevel: 'basic' });
        });
    });

    describe('Edge Cases - Multiple Auth Providers', () => {
        test('should isolate provider IDs sharing a contact email and owner DID', async () => {
            // Contact metadata and primaryDid are not unique indexes; provider identity is.
            const email = `shared-${crypto.randomUUID()}@example.com`;
            const token1 = createMockAuthToken(crypto.randomUUID(), email);
            const token2 = createMockAuthToken(crypto.randomUUID(), email);
            await store(token1, 'provider-one');
            expect(await getAuthShare(token2)).toBeNull();
            await store(token2, 'provider-two');
            expect(await getAuthShare(token1)).toMatchObject({
                authShare: share('provider-one'),
                primaryDid: learnCard.id.did(),
            });
            expect(await getAuthShare(token2)).toMatchObject({
                authShare: share('provider-two'),
                primaryDid: learnCard.id.did(),
            });
        });
    });

    describe('Edge Cases - Idempotency', () => {
        test('should return NOT_FOUND when deleting an already deleted user', async () => {
            const token = newToken('idempotent');
            await store(token, 'idempotent-data');
            await write('delete', auth(token));
            expect(await write('delete', auth(token), 404)).toMatchObject({
                message: 'User key not found. Set up SSS first.',
            });
        });
        test('should return NOT_FOUND when migrating a non-existent user', async () => {
            expect(await write('migrate', auth(newToken('no-migrate')), 404)).toMatchObject({
                message: 'User key not found. Set up SSS first.',
            });
        });
    });

    describe('Edge Cases - Recovery Method with Salt', () => {
        test('should store and retrieve recovery share with salt', async () => {
            const token = newToken('salt');
            await store(token, 'salt-data');
            await enroll(token, 'passkey', 'salted-share', { salt: 'random-salt-value-abc123' });
            expect(await getRecoveryShare(token, 'passkey')).toMatchObject({
                encryptedShare: { encryptedData: 'salted-share', salt: 'random-salt-value-abc123' },
            });
        });
    });

    describe('Orphaned Recovery Method Pruning', () => {
        const token = newToken('prune');
        test('prunes recovery method whose auth share version was evicted from history', async () => {
            await store(token, 'share-v1', { expectedShareVersion: 0 });
            await store(token, 'share-v2', { expectedShareVersion: 1 });
            await enroll(token, 'passkey', 'passkey-share-v2', { shareVersion: 2 });
            expect((await getAuthShare(token)).recoveryMethods).toHaveLength(1);
            for (let v = 3; v <= 8; v++) {
                expect(
                    await store(token, `share-v${v}`, { expectedShareVersion: v - 1 })
                ).toMatchObject({ shareVersion: v });
            }
            expect(await getAuthShare(token)).toMatchObject({
                recoveryMethods: [],
                shareVersion: 8,
            });
            expect(await getRecoveryShare(token, 'passkey')).toBeNull();
            expect((await getAuthShare(token, 2)).authShare).toBeNull();
        });
        test('does NOT prune recovery method whose auth share version is still in history', async () => {
            await enroll(token, 'phrase', 'phrase-share-v8', { shareVersion: 8 });
            await store(token, 'share-v9', { expectedShareVersion: 8 });
            const data = await getAuthShare(token);
            expect(data.shareVersion).toBe(9);
            expect(data.recoveryMethods).toHaveLength(1);
            expect(data.recoveryMethods[0]).toMatchObject({ type: 'phrase', shareVersion: 8 });
            expect(await getAuthShare(token, 8)).toMatchObject({ authShare: share('share-v8') });
        });
    });

    // Public storeAuthShare cannot create a legacy Web3Auth record anymore.
    // The real legacy migration fixture is DB-seeded in keys-lifecycle-invariants.
    // Keep the public-route lifecycle coverage, including rejecting that premise.
    describe('Full Provisioning Lifecycle (legacy migration input)', () => {
        const token = newToken('full-lifecycle');
        test('step 1: new user has no server record', async () => {
            expect(await getAuthShare(token)).toBeNull();
        });
        test('step 2: legacy keyProvider input cannot manufacture a Web3Auth record', async () => {
            await store(token, 'legacy-auth-share', {
                keyProvider: 'web3auth',
                expectedShareVersion: 0,
            });
        });
        test('step 3: server reports provisional SSS, not a client-selected migration state', async () => {
            expect(await getAuthShare(token)).toMatchObject({
                primaryDid: learnCard.id.did(),
                keyProvider: 'sss',
                sssActivationState: 'provisional',
            });
        });
        test('step 4: rotate SSS auth share while preserving its owner', async () => {
            await store(token, 'new-sss-auth-share', {
                keyProvider: 'sss',
                expectedShareVersion: 1,
            });
        });
        test('step 5: reject migration for SSS and activation without confirmed recovery', async () => {
            expect(await write('migrate', auth(token), 400)).toMatchObject({
                message: 'This key record is not eligible for migration.',
            });
            expect(await write('activate', auth(token), 400)).toMatchObject({
                message: 'A recovery method for the current key version is required.',
            });
        });
        test('step 6: server returns rotated SSS share and remains provisional', async () => {
            expect(await getAuthShare(token)).toMatchObject({
                primaryDid: learnCard.id.did(),
                keyProvider: 'sss',
                authShare: share('new-sss-auth-share'),
                shareVersion: 2,
                sssActivationState: 'provisional',
            });
        });
        test('step 7: enroll and confirm current-version recovery, then activate', async () => {
            await write('recovery', {
                ...auth(token),
                type: 'passkey',
                shareVersion: 2,
                encryptedShare: {
                    encryptedData: 'post-migration-recovery-share',
                    iv: 'recovery-iv',
                },
            });
            expect(await getRecoveryShare(token, 'passkey')).toBeNull();
            expect(await getAuthShare(token)).toMatchObject({
                recoveryMethods: [],
                sssActivationState: 'provisional',
            });
            await write('activate', auth(token), 400);
            expect(await getAuthShare(token)).toMatchObject({ sssActivationState: 'provisional' });
            await write('recovery/confirm', { ...auth(token), type: 'passkey' });
            await write('activate', auth(token));
        });
        test('step 8: recovery is accessible and SSS is active', async () => {
            expect(await getRecoveryShare(token, 'passkey')).toMatchObject({
                encryptedShare: { encryptedData: 'post-migration-recovery-share' },
                shareVersion: 2,
            });
            expect(await getAuthShare(token)).toMatchObject({ sssActivationState: 'active' });
        });
    });

    describe('Recovery Email Verification', () => {
        const token = newToken('email');
        const recoveryEmail = `recovery-${crypto.randomUUID()}@personal.com`;
        beforeAll(async () => {
            await store(token, 'email-auth-share');
        });

        test.each([
            ['add', { email: recoveryEmail }],
            ['verify', { code: '123456' }],
        ])('%sRecoveryEmail requires DID auth (rejects without VP)', async (action, input) => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...auth(token), ...input }),
            });
            expect(response.status).toBe(401);
        });
        test('getAuthShare should not have maskedRecoveryEmail before verification', async () => {
            expect(await getAuthShare(token)).toMatchObject({ maskedRecoveryEmail: null });
        });
        test('registering an email recovery method alone cannot confirm email receipt', async () => {
            await write('recovery', { ...auth(token), type: 'email', shareVersion: 1 });
            expect(
                await write(
                    'recovery/confirm',
                    { ...auth(token), type: 'email', code: '123456' },
                    400
                )
            ).toMatchObject({ message: 'Enter the confirmation code from your recovery email.' });
        });
        test('pending email recovery method is hidden from getAuthShare and getRecoveryShare', async () => {
            expect((await getAuthShare(token)).recoveryMethods).toEqual([]);
            expect(await getRecoveryShare(token, 'email')).toBeNull();
        });
        test('sendEmailBackup rejects the removed plaintext emailShare/useRecoveryEmail contract', async () => {
            await write(
                'email-backup',
                { ...auth(token), emailShare: 'test-share-data', useRecoveryEmail: true },
                400
            );
        });
        test('sendEmailBackup rejects a valid relay envelope without a verified recovery email', async () => {
            expect(
                await write(
                    'email-backup',
                    {
                        ...auth(token),
                        email: recoveryEmail,
                        confirmationCode: '123456',
                        shareVersion: 1,
                        relayPayload: {
                            version: 1,
                            algorithm: 'P-256-HKDF-SHA256-AES-256-GCM',
                            keyId: 'e2e-test-key',
                            ephemeralPublicKey: 'test-public-key',
                            salt: 'test-salt',
                            iv: 'test-iv',
                            ciphertext: 'test-ciphertext',
                        },
                    },
                    400
                )
            ).toMatchObject({ message: 'No verified recovery email on file.' });
        });
    });
});
