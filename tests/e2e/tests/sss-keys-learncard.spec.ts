import { describe, test, expect, beforeAll } from 'vitest';

import { getLearnCardWithLCA, LearnCardWithLCA } from './helpers/learncard.helpers';

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
    let learnCard: LearnCardWithLCA;

    const testUserId = `lc-invoke-user-${Date.now()}`;
    const testEmail = `lc-invoke-${Date.now()}@example.com`;
    const testDid = `did:key:z6MkLcInvoke${Date.now()}`;

    let mockAuthToken: string;

    beforeAll(async () => {
        learnCard = await getLearnCardWithLCA('a'.repeat(64));
        mockAuthToken = createMockAuthToken(testUserId, testEmail);
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
                testDid
            );

            expect(result.success).toBe(true);
        });

        test('should retrieve auth share using invoke.getAuthShare', async () => {
            const result = await learnCard.invoke.getAuthShare(mockAuthToken, 'firebase');

            expect(result).not.toBeNull();
            expect(result?.authShare?.encryptedData).toBe(authShare.encryptedData);
            expect(result?.primaryDid).toBe(testDid);
            expect(result?.keyProvider).toBe('sss');
            expect(result?.securityLevel).toBe('basic');
        });
    });

    describe('Recovery Methods via invoke', () => {
        const passwordShare = {
            encryptedData: 'lc-password-share-' + Date.now(),
            iv: 'lc-password-iv-' + Date.now(),
        };

        const passkeyShare = {
            encryptedData: 'lc-passkey-share-' + Date.now(),
            iv: 'lc-passkey-iv-' + Date.now(),
        };

        test('should add password recovery method using invoke.addRecoveryMethod', async () => {
            const result = await learnCard.invoke.addRecoveryMethod(
                mockAuthToken,
                'firebase',
                'password',
                passwordShare
            );

            expect(result.success).toBe(true);
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
        });

        test('should retrieve password recovery share using invoke.getRecoveryShare', async () => {
            const result = await learnCard.invoke.getRecoveryShare(
                mockAuthToken,
                'firebase',
                'password'
            );

            expect(result).not.toBeNull();
            expect(result?.encryptedShare?.encryptedData).toBe(passwordShare.encryptedData);
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

            const hasPassword = result?.recoveryMethods.some(m => m.type === 'password');
            const hasPasskey = result?.recoveryMethods.some(m => m.type === 'passkey');

            expect(hasPassword).toBe(true);
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
                'did:key:z6MkMigrationLC'
            );
        });

        test('should mark user as migrated using invoke.markMigrated', async () => {
            const result = await learnCard.invoke.markMigrated(migrationToken, 'firebase');

            expect(result.success).toBe(true);
        });

        test('should confirm migration via getAuthShare', async () => {
            const result = await learnCard.invoke.getAuthShare(migrationToken, 'firebase');

            expect(result).not.toBeNull();
            expect(result?.keyProvider).toBe('sss');
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
                'did:key:z6MkDeleteLC'
            );
        });

        test('should delete user key using invoke.deleteUserKey', async () => {
            const result = await learnCard.invoke.deleteUserKey(deleteToken, 'firebase');

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
                'password'
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
                'did:key:z6MkInitialLC'
            );

            await learnCard.invoke.storeAuthShare(
                updateToken,
                'firebase',
                {
                    encryptedData: 'updated-lc',
                    encryptedDek: 'updated-dek-lc',
                    iv: 'updated-iv-lc',
                },
                'did:key:z6MkUpdatedLC'
            );

            const result = await learnCard.invoke.getAuthShare(updateToken, 'firebase');

            expect(result?.authShare?.encryptedData).toBe('updated-lc');
            expect(result?.primaryDid).toBe('did:key:z6MkUpdatedLC');
        });

        test('should handle idempotent delete gracefully', async () => {
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
                'did:key:z6MkIdempotentLC'
            );

            await learnCard.invoke.deleteUserKey(idempotentToken, 'firebase');

            const secondDelete = await learnCard.invoke.deleteUserKey(idempotentToken, 'firebase');
            expect(secondDelete.success).toBe(true);
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
                'did:key:z6MkSaltLC'
            );

            const shareWithSalt = {
                encryptedData: 'salted-share-lc',
                iv: 'salted-iv-lc',
                salt: 'random-salt-abc123',
            };

            await learnCard.invoke.addRecoveryMethod(
                saltToken,
                'firebase',
                'password',
                shareWithSalt
            );

            const result = await learnCard.invoke.getRecoveryShare(
                saltToken,
                'firebase',
                'password'
            );

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
                'did:key:z6MkEnhancedLC',
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
                'did:key:z6MkAdvancedLC',
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
                'did:key:z6MkMultiPasskeyLC'
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

            await learnCard.invoke.addRecoveryMethod(
                multiPasskeyToken,
                'firebase',
                'passkey',
                passkey2,
                'credential-id-2'
            );

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
                'did:key:z6MkBackupLC'
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
                'did:key:z6MkUser1LC'
            );

            await learnCard.invoke.storeAuthShare(
                user2Token,
                'firebase',
                {
                    encryptedData: 'user2-secret',
                    encryptedDek: 'user2-dek',
                    iv: 'user2-iv',
                },
                'did:key:z6MkUser2LC'
            );

            const result1 = await learnCard.invoke.getAuthShare(user1Token, 'firebase');
            const result2 = await learnCard.invoke.getAuthShare(user2Token, 'firebase');

            expect(result1?.authShare?.encryptedData).toBe('user1-secret');
            expect(result2?.authShare?.encryptedData).toBe('user2-secret');

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
                learnCard.invoke.addRecoveryMethod(
                    noSetupToken,
                    'firebase',
                    'password',
                    { encryptedData: 'test', iv: 'test' }
                )
            ).rejects.toThrow();
        });
    });

    describe('DID Update via invoke', () => {
        test('should update primaryDid when storing new auth share', async () => {
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
                'did:key:z6MkOriginalDid'
            );

            const original = await learnCard.invoke.getAuthShare(didUpdateToken, 'firebase');
            expect(original?.primaryDid).toBe('did:key:z6MkOriginalDid');

            await learnCard.invoke.storeAuthShare(
                didUpdateToken,
                'firebase',
                {
                    encryptedData: 'rotated',
                    encryptedDek: 'rotated-dek',
                    iv: 'rotated-iv',
                },
                'did:key:z6MkRotatedDid'
            );

            const rotated = await learnCard.invoke.getAuthShare(didUpdateToken, 'firebase');
            expect(rotated?.primaryDid).toBe('did:key:z6MkRotatedDid');
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
                'did:key:z6MkPersistInitial'
            );

            await learnCard.invoke.addRecoveryMethod(
                persistToken,
                'firebase',
                'password',
                { encryptedData: 'password-share', iv: 'password-iv' }
            );

            await learnCard.invoke.storeAuthShare(
                persistToken,
                'firebase',
                {
                    encryptedData: 'updated',
                    encryptedDek: 'updated-dek',
                    iv: 'updated-iv',
                },
                'did:key:z6MkPersistUpdated'
            );

            const result = await learnCard.invoke.getAuthShare(persistToken, 'firebase');

            expect(result?.authShare?.encryptedData).toBe('updated');

            const passwordRecovery = await learnCard.invoke.getRecoveryShare(
                persistToken,
                'firebase',
                'password'
            );

            expect(passwordRecovery?.encryptedShare?.encryptedData).toBe('password-share');
        });
    });
});
