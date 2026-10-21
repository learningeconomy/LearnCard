import { describe, test, expect, beforeAll } from 'vitest';

import { getLearnCard, type LearnCard } from './helpers/learncard.helpers';

// The plugin exposes enrollment but not confirmation. Use the public challenge
// endpoint for this missing operation; plugin calls obtain their own challenges.
const confirmRecoveryMethod = async (
    learnCard: LearnCard,
    authToken: string,
    type: 'phrase' | 'passkey' | 'backup',
    credentialId?: string
): Promise<void> => {
    const vp = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });
    if (typeof vp !== 'string') throw new Error('Failed to create DID-Auth VP');
    const challengeResponse = await fetch('http://localhost:5200/api/keys/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vp}` },
        body: JSON.stringify({ did: learnCard.id.did() }),
    });
    expect(challengeResponse.status).toBe(200);
    const { challenge } = await challengeResponse.json();
    const boundVp = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
    if (typeof boundVp !== 'string') throw new Error('Failed to create DID-Auth VP');
    const response = await fetch('http://localhost:5200/api/keys/recovery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${boundVp}` },
        body: JSON.stringify({ authToken, providerType: 'firebase', type, credentialId }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
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

describe('SSS Key Management via LearnCard Plugin', () => {
    let learnCard: LearnCard;

    const testUserId = `lc-invoke-user-${Date.now()}`;
    const testEmail = `lc-invoke-${Date.now()}@example.com`;

    let mockAuthToken: string;
    let vpDid: string;

    beforeAll(async () => {
        learnCard = await getLearnCard('a'.repeat(64));
        mockAuthToken = createMockAuthToken(testUserId, testEmail);
        vpDid = learnCard.id.did();
    });

    describe('Store and Retrieve Auth Share via invoke', () => {
        const authShare = {
            encryptedData: 'lc-encrypted-auth-share-' + Date.now(),
            encryptedDek: 'lc-encrypted-dek-' + Date.now(),
            iv: 'lc-iv-' + Date.now(),
        };

        test('should store auth share using invoke.storeAuthShare', async () => {
            const result = await learnCard.invoke.storeAuthShare(
                mockAuthToken,
                'firebase',
                authShare,
                vpDid
            );

            expect(result.success).toBe(true);
        });

        test('should retrieve auth share using invoke.getAuthShare', async () => {
            const result = await learnCard.invoke.getAuthShare(mockAuthToken, 'firebase');

            expect(result).not.toBeNull();
            expect(result?.authShare?.encryptedData).toBe(authShare.encryptedData);
            // The supplied primaryDid must equal the signing DID.
            expect(result?.primaryDid).toBe(vpDid);
            expect(result?.keyProvider).toBe('sss');
            expect(result?.securityLevel).toBe('basic');
        });
    });

    describe('Recovery Methods via invoke', () => {
        const phraseShare = {
            encryptedData: 'lc-phrase-share-' + Date.now(),
            iv: 'lc-phrase-iv-' + Date.now(),
        };

        const passkeyShare = {
            encryptedData: 'lc-passkey-share-' + Date.now(),
            iv: 'lc-passkey-iv-' + Date.now(),
        };

        test('should add phrase recovery method using invoke.addRecoveryMethod', async () => {
            const result = await learnCard.invoke.addRecoveryMethod(
                mockAuthToken,
                'firebase',
                'phrase',
                phraseShare
            );

            expect(result.success).toBe(true);
            expect(
                await learnCard.invoke.getRecoveryShare(mockAuthToken, 'firebase', 'phrase')
            ).toBeNull();
            await confirmRecoveryMethod(learnCard, mockAuthToken, 'phrase');
        });

        test('should add passkey recovery method with credentialId', async () => {
            const result = await learnCard.invoke.addRecoveryMethod(
                mockAuthToken,
                'firebase',
                'passkey',
                passkeyShare,
                'lc-passkey-cred-123'
            );

            expect(result.success).toBe(true);
            await confirmRecoveryMethod(learnCard, mockAuthToken, 'passkey', 'lc-passkey-cred-123');
        });

        test('should retrieve phrase recovery share using invoke.getRecoveryShare', async () => {
            const result = await learnCard.invoke.getRecoveryShare(
                mockAuthToken,
                'firebase',
                'phrase'
            );

            expect(result).not.toBeNull();
            expect(result?.encryptedShare?.encryptedData).toBe(phraseShare.encryptedData);
        });

        test('should retrieve passkey recovery share by credentialId', async () => {
            const result = await learnCard.invoke.getRecoveryShare(
                mockAuthToken,
                'firebase',
                'passkey',
                'lc-passkey-cred-123'
            );

            expect(result).not.toBeNull();
            expect(result?.encryptedShare?.encryptedData).toBe(passkeyShare.encryptedData);
        });

        test('should list all recovery methods via getAuthShare', async () => {
            const result = await learnCard.invoke.getAuthShare(mockAuthToken, 'firebase');

            expect(result).not.toBeNull();
            expect(result?.recoveryMethods.length).toBeGreaterThanOrEqual(2);

            const hasPhrase = result?.recoveryMethods.some(m => m.type === 'phrase');
            const hasPasskey = result?.recoveryMethods.some(m => m.type === 'passkey');

            expect(hasPhrase).toBe(true);
            expect(hasPasskey).toBe(true);
        });
    });

    describe('Migration via invoke', () => {
        const migrationUserId = `lc-migration-${Date.now()}`;
        const migrationEmail = `lc-migration-${Date.now()}@example.com`;
        let migrationToken: string;

        beforeAll(async () => {
            migrationToken = createMockAuthToken(migrationUserId, migrationEmail);

            await learnCard.invoke.storeAuthShare(
                migrationToken,
                'firebase',
                {
                    encryptedData: 'migration-data',
                    encryptedDek: 'migration-dek',
                    iv: 'migration-iv',
                },
                vpDid
            );
        });

        test('should mark a provisional SSS record as migrated', async () => {
            await expect(
                learnCard.invoke.markMigrated(migrationToken, 'firebase')
            ).resolves.toMatchObject({ success: true });
        });

        test('should keep the Web3Auth fallback until the migration activates', async () => {
            const result = await learnCard.invoke.getAuthShare(migrationToken, 'firebase');

            expect(result).not.toBeNull();
            expect(result?.keyProvider).toBe('web3auth');
        });
    });

    describe('Delete User Key via invoke', () => {
        const deleteUserId = `lc-delete-${Date.now()}`;
        const deleteEmail = `lc-delete-${Date.now()}@example.com`;
        let deleteToken: string;

        beforeAll(async () => {
            deleteToken = createMockAuthToken(deleteUserId, deleteEmail);

            await learnCard.invoke.storeAuthShare(
                deleteToken,
                'firebase',
                {
                    encryptedData: 'delete-data',
                    encryptedDek: 'delete-dek',
                    iv: 'delete-iv',
                },
                vpDid
            );
        });

        test('should delete user key using invoke.deleteUserKey', async () => {
            const result = await learnCard.invoke.deleteUserKey(
                deleteToken,
                'firebase',
                crypto.randomUUID()
            );

            expect(result.success).toBe(true);
        });

        test('should return null after deletion', async () => {
            const result = await learnCard.invoke.getAuthShare(deleteToken, 'firebase');

            expect(result).toBeNull();
        });
    });

    describe('Edge Cases via invoke', () => {
        test('should return null for non-existent user', async () => {
            const nonExistentToken = createMockAuthToken(
                `non-existent-lc-${Date.now()}`,
                `nonexistent-lc-${Date.now()}@example.com`
            );

            const result = await learnCard.invoke.getAuthShare(nonExistentToken, 'firebase');

            expect(result).toBeNull();
        });

        test('should return null for non-existent recovery method', async () => {
            const noRecoveryToken = createMockAuthToken(
                `no-recovery-lc-${Date.now()}`,
                `norecovery-lc-${Date.now()}@example.com`
            );

            const result = await learnCard.invoke.getRecoveryShare(
                noRecoveryToken,
                'firebase',
                'phrase'
            );

            expect(result).toBeNull();
        });

        test('should allow updating existing auth share', async () => {
            const updateUserId = `lc-update-${Date.now()}`;
            const updateEmail = `lc-update-${Date.now()}@example.com`;
            const updateToken = createMockAuthToken(updateUserId, updateEmail);

            await learnCard.invoke.storeAuthShare(
                updateToken,
                'firebase',
                {
                    encryptedData: 'initial-lc',
                    encryptedDek: 'initial-dek-lc',
                    iv: 'initial-iv-lc',
                },
                vpDid
            );

            await learnCard.invoke.storeAuthShare(
                updateToken,
                'firebase',
                {
                    encryptedData: 'updated-lc',
                    encryptedDek: 'updated-dek-lc',
                    iv: 'updated-iv-lc',
                },
                vpDid
            );

            const result = await learnCard.invoke.getAuthShare(updateToken, 'firebase');

            expect(result?.authShare?.encryptedData).toBe('updated-lc');
            // Rotation preserves the authenticated owner.
            expect(result?.primaryDid).toBe(vpDid);
        });

        test('should return NOT_FOUND when deleting an already deleted record', async () => {
            const idempotentToken = createMockAuthToken(
                `lc-idempotent-${Date.now()}`,
                `lc-idempotent-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                idempotentToken,
                'firebase',
                {
                    encryptedData: 'idem-data',
                    encryptedDek: 'idem-dek',
                    iv: 'idem-iv',
                },
                vpDid
            );

            expect(
                await learnCard.invoke.deleteUserKey(
                    idempotentToken,
                    'firebase',
                    crypto.randomUUID()
                )
            ).toEqual({ success: true });

            await expect(
                learnCard.invoke.deleteUserKey(idempotentToken, 'firebase', crypto.randomUUID())
            ).rejects.toMatchObject({
                data: { code: 'NOT_FOUND' },
            });
        });

        test('should store and retrieve recovery share with salt', async () => {
            const saltUserId = `lc-salt-${Date.now()}`;
            const saltEmail = `lc-salt-${Date.now()}@example.com`;
            const saltToken = createMockAuthToken(saltUserId, saltEmail);

            await learnCard.invoke.storeAuthShare(
                saltToken,
                'firebase',
                {
                    encryptedData: 'salt-auth-data',
                    encryptedDek: 'salt-auth-dek',
                    iv: 'salt-auth-iv',
                },
                vpDid
            );

            const shareWithSalt = {
                encryptedData: 'salted-share-lc',
                iv: 'salted-iv-lc',
                salt: 'random-salt-abc123',
            };

            await learnCard.invoke.addRecoveryMethod(
                saltToken,
                'firebase',
                'phrase',
                shareWithSalt
            );
            await confirmRecoveryMethod(learnCard, saltToken, 'phrase');

            const result = await learnCard.invoke.getRecoveryShare(saltToken, 'firebase', 'phrase');

            expect(result?.encryptedShare?.encryptedData).toBe('salted-share-lc');
            expect(result?.encryptedShare?.salt).toBe('random-salt-abc123');
        });
    });

    describe('Security Levels via invoke', () => {
        test('should store with enhanced security level', async () => {
            const enhancedToken = createMockAuthToken(
                `lc-enhanced-${Date.now()}`,
                `lc-enhanced-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                enhancedToken,
                'firebase',
                {
                    encryptedData: 'enhanced-data',
                    encryptedDek: 'enhanced-dek',
                    iv: 'enhanced-iv',
                },
                vpDid,
                'enhanced'
            );

            const result = await learnCard.invoke.getAuthShare(enhancedToken, 'firebase');

            expect(result?.securityLevel).toBe('enhanced');
        });

        test('should store with advanced security level', async () => {
            const advancedToken = createMockAuthToken(
                `lc-advanced-${Date.now()}`,
                `lc-advanced-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                advancedToken,
                'firebase',
                {
                    encryptedData: 'advanced-data',
                    encryptedDek: 'advanced-dek',
                    iv: 'advanced-iv',
                },
                vpDid,
                'advanced'
            );

            const result = await learnCard.invoke.getAuthShare(advancedToken, 'firebase');

            expect(result?.securityLevel).toBe('advanced');
        });
    });

    describe('Multiple Passkeys via invoke', () => {
        const multiPasskeyUserId = `lc-multi-passkey-${Date.now()}`;
        const multiPasskeyEmail = `lc-multi-passkey-${Date.now()}@example.com`;
        let multiPasskeyToken: string;

        beforeAll(async () => {
            multiPasskeyToken = createMockAuthToken(multiPasskeyUserId, multiPasskeyEmail);

            await learnCard.invoke.storeAuthShare(
                multiPasskeyToken,
                'firebase',
                {
                    encryptedData: 'multi-passkey-auth',
                    encryptedDek: 'multi-passkey-dek',
                    iv: 'multi-passkey-iv',
                },
                vpDid
            );
        });

        test('should add multiple passkeys with different credentialIds', async () => {
            const passkey1 = {
                encryptedData: 'passkey-1-data',
                iv: 'passkey-1-iv',
            };

            const passkey2 = {
                encryptedData: 'passkey-2-data',
                iv: 'passkey-2-iv',
            };

            await learnCard.invoke.addRecoveryMethod(
                multiPasskeyToken,
                'firebase',
                'passkey',
                passkey1,
                'credential-id-1'
            );
            await confirmRecoveryMethod(learnCard, multiPasskeyToken, 'passkey', 'credential-id-1');

            await learnCard.invoke.addRecoveryMethod(
                multiPasskeyToken,
                'firebase',
                'passkey',
                passkey2,
                'credential-id-2'
            );
            await confirmRecoveryMethod(learnCard, multiPasskeyToken, 'passkey', 'credential-id-2');

            const result1 = await learnCard.invoke.getRecoveryShare(
                multiPasskeyToken,
                'firebase',
                'passkey',
                'credential-id-1'
            );

            const result2 = await learnCard.invoke.getRecoveryShare(
                multiPasskeyToken,
                'firebase',
                'passkey',
                'credential-id-2'
            );

            expect(result1?.encryptedShare?.encryptedData).toBe('passkey-1-data');
            expect(result2?.encryptedShare?.encryptedData).toBe('passkey-2-data');
        });

        test('should list all passkeys in recovery methods', async () => {
            const result = await learnCard.invoke.getAuthShare(multiPasskeyToken, 'firebase');

            const passkeys = result?.recoveryMethods.filter(m => m.type === 'passkey');

            expect(passkeys?.length).toBeGreaterThanOrEqual(2);

            const credentialIds = passkeys?.map(p => p.credentialId);
            expect(credentialIds).toContain('credential-id-1');
            expect(credentialIds).toContain('credential-id-2');
        });
    });

    describe('Backup Recovery Method via invoke', () => {
        test('should add and retrieve backup recovery method', async () => {
            const backupToken = createMockAuthToken(
                `lc-backup-${Date.now()}`,
                `lc-backup-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                backupToken,
                'firebase',
                {
                    encryptedData: 'backup-auth-data',
                    encryptedDek: 'backup-auth-dek',
                    iv: 'backup-auth-iv',
                },
                vpDid
            );

            const backupShare = {
                encryptedData: 'backup-recovery-share',
                iv: 'backup-recovery-iv',
            };

            await learnCard.invoke.addRecoveryMethod(
                backupToken,
                'firebase',
                'backup',
                backupShare
            );
            await confirmRecoveryMethod(learnCard, backupToken, 'backup');

            const result = await learnCard.invoke.getRecoveryShare(
                backupToken,
                'firebase',
                'backup'
            );

            expect(result?.encryptedShare?.encryptedData).toBe('backup-recovery-share');
        });
    });

    describe('Data Isolation via invoke', () => {
        test('should isolate data between different users', async () => {
            const otherLearnCard = await getLearnCard('2'.repeat(64));
            const user1Token = createMockAuthToken(
                `lc-isolation-1-${Date.now()}`,
                `lc-isolation-1-${Date.now()}@example.com`
            );

            const user2Token = createMockAuthToken(
                `lc-isolation-2-${Date.now()}`,
                `lc-isolation-2-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                user1Token,
                'firebase',
                {
                    encryptedData: 'user1-secret',
                    encryptedDek: 'user1-dek',
                    iv: 'user1-iv',
                },
                vpDid
            );

            await otherLearnCard.invoke.storeAuthShare(
                user2Token,
                'firebase',
                {
                    encryptedData: 'user2-secret',
                    encryptedDek: 'user2-dek',
                    iv: 'user2-iv',
                },
                otherLearnCard.id.did()
            );

            const result1 = await learnCard.invoke.getAuthShare(user1Token, 'firebase');
            const result2 = await otherLearnCard.invoke.getAuthShare(user2Token, 'firebase');

            expect(result1?.authShare?.encryptedData).toBe('user1-secret');
            expect(result2?.authShare?.encryptedData).toBe('user2-secret');
            expect(result1?.primaryDid).toBe(vpDid);
            expect(result2?.primaryDid).toBe(otherLearnCard.id.did());

            expect(result1?.authShare?.encryptedData).not.toBe(result2?.authShare?.encryptedData);
        });
    });

    describe('Error Handling via invoke', () => {
        test('should fail to add recovery method without auth share setup', async () => {
            const noSetupToken = createMockAuthToken(
                `lc-no-setup-${Date.now()}`,
                `lc-no-setup-${Date.now()}@example.com`
            );

            await expect(
                learnCard.invoke.addRecoveryMethod(noSetupToken, 'firebase', 'phrase', {
                    encryptedData: 'test',
                    iv: 'test',
                })
            ).rejects.toMatchObject({ data: { code: 'NOT_FOUND' } });
        });
    });

    describe('DID Update via invoke', () => {
        test('should update auth share data while preserving VP DID', async () => {
            const didUpdateToken = createMockAuthToken(
                `lc-did-update-${Date.now()}`,
                `lc-did-update-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                didUpdateToken,
                'firebase',
                {
                    encryptedData: 'original',
                    encryptedDek: 'original-dek',
                    iv: 'original-iv',
                },
                vpDid
            );

            const original = await learnCard.invoke.getAuthShare(didUpdateToken, 'firebase');
            expect(original?.primaryDid).toBe(vpDid);
            expect(original?.authShare?.encryptedData).toBe('original');

            await learnCard.invoke.storeAuthShare(
                didUpdateToken,
                'firebase',
                {
                    encryptedData: 'rotated',
                    encryptedDek: 'rotated-dek',
                    iv: 'rotated-iv',
                },
                vpDid
            );

            const rotated = await learnCard.invoke.getAuthShare(didUpdateToken, 'firebase');
            expect(rotated?.primaryDid).toBe(vpDid);
            expect(rotated?.authShare?.encryptedData).toBe('rotated');
        });
    });

    describe('Recovery Methods Persistence via invoke', () => {
        test('should preserve recovery methods when updating auth share', async () => {
            const persistToken = createMockAuthToken(
                `lc-persist-${Date.now()}`,
                `lc-persist-${Date.now()}@example.com`
            );

            await learnCard.invoke.storeAuthShare(
                persistToken,
                'firebase',
                {
                    encryptedData: 'initial',
                    encryptedDek: 'initial-dek',
                    iv: 'initial-iv',
                },
                vpDid
            );

            await learnCard.invoke.addRecoveryMethod(persistToken, 'firebase', 'phrase', {
                encryptedData: 'phrase-share',
                iv: 'phrase-iv',
            });
            await confirmRecoveryMethod(learnCard, persistToken, 'phrase');

            await learnCard.invoke.storeAuthShare(
                persistToken,
                'firebase',
                {
                    encryptedData: 'updated',
                    encryptedDek: 'updated-dek',
                    iv: 'updated-iv',
                },
                vpDid
            );

            const result = await learnCard.invoke.getAuthShare(persistToken, 'firebase');

            expect(result?.authShare?.encryptedData).toBe('updated');
            expect(result?.shareVersion).toBe(2);

            const phraseRecovery = await learnCard.invoke.getRecoveryShare(
                persistToken,
                'firebase',
                'phrase'
            );

            expect(phraseRecovery?.encryptedShare?.encryptedData).toBe('phrase-share');
            expect(phraseRecovery?.shareVersion).toBe(1);
        });
    });
});
