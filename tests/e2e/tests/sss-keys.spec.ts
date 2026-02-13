import { describe, test, expect, beforeAll } from 'vitest';

const LCA_API_URL = 'http://localhost:5200';

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

describe('SSS Key Management API', () => {
    const testUserId = `test-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;
    const testDid = `did:key:z6Mk${Date.now()}`;

    let mockAuthToken: string;

    beforeAll(() => {
        mockAuthToken = createMockAuthToken(testUserId, testEmail);
    });

    describe('Health Check', () => {
        test('LCA API should be healthy', async () => {
            const result = await fetch(`${LCA_API_URL}/api/health-check`);

            expect(result.status).toEqual(200);
        });
    });

    describe('Store and Retrieve Auth Share', () => {
        const authShare = {
            encryptedData: 'encrypted-auth-share-data-' + Date.now(),
            encryptedDek: 'encrypted-dek-' + Date.now(),
            iv: 'initialization-vector-' + Date.now(),
        };

        test('should store an auth share', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: mockAuthToken,
                    providerType: 'firebase',
                    authShare,
                    primaryDid: testDid,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('should retrieve the stored auth share', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: mockAuthToken,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.authShare).toBeDefined();
            expect(data.authShare?.encryptedData).toBe(authShare.encryptedData);
            expect(data.primaryDid).toBe(testDid);
            expect(data.keyProvider).toBe('sss');
        });
    });

    describe('Add and Retrieve Recovery Method', () => {
        const encryptedShare = {
            encryptedData: 'encrypted-recovery-share-' + Date.now(),
            iv: 'recovery-iv-' + Date.now(),
        };

        test('should add a passkey recovery method', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: mockAuthToken,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('should retrieve the stored recovery share', async () => {
            const params = new URLSearchParams({
                authToken: mockAuthToken,
                providerType: 'firebase',
                type: 'passkey',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.encryptedData).toBe(encryptedShare.encryptedData);
        });
    });

    describe('Multiple Recovery Methods', () => {
        const passkeyShare = {
            encryptedData: 'encrypted-passkey-share-' + Date.now(),
            iv: 'passkey-iv-' + Date.now(),
        };

        test('should add a passkey recovery method', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: mockAuthToken,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: passkeyShare,
                    credentialId: 'passkey-credential-123',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('should list all recovery methods via getAuthShare', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: mockAuthToken,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            const methods = data.recoveryMethods;
            expect(methods).toBeDefined();
            expect(Array.isArray(methods)).toBe(true);
            expect(methods.some((m: { type: string }) => m.type === 'password')).toBe(true);
            expect(methods.some((m: { type: string }) => m.type === 'passkey')).toBe(true);
        });
    });

    describe('Migration Support', () => {
        const migrationUserId = `migration-user-${Date.now()}`;
        const migrationEmail = `migration-${Date.now()}@example.com`;
        const migrationDid = `did:key:z6MkMigration${Date.now()}`;

        test('should mark user as migrated from web3auth', async () => {
            const migrationToken = createMockAuthToken(migrationUserId, migrationEmail);

            const storeResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: migrationToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'migrated-share',
                        encryptedDek: 'migrated-dek',
                        iv: 'migrated-iv',
                    },
                    primaryDid: migrationDid,
                }),
            });

            expect(storeResponse.status).toEqual(200);

            const markMigratedResponse = await fetch(`${LCA_API_URL}/api/keys/migrate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: migrationToken,
                    providerType: 'firebase',
                }),
            });

            expect(markMigratedResponse.status).toEqual(200);

            const markData = await markMigratedResponse.json();
            expect(markData.success).toBe(true);
        });
    });

    describe('Delete User Key', () => {
        const deleteUserId = `delete-user-${Date.now()}`;
        const deleteEmail = `delete-${Date.now()}@example.com`;

        test('should delete user key and all associated data', async () => {
            const deleteToken = createMockAuthToken(deleteUserId, deleteEmail);

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: deleteToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'to-delete-share',
                        encryptedDek: 'to-delete-dek',
                        iv: 'to-delete-iv',
                    },
                    primaryDid: `did:key:z6MkDelete${Date.now()}`,
                }),
            });

            const deleteResponse = await fetch(`${LCA_API_URL}/api/keys/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: deleteToken,
                    providerType: 'firebase',
                }),
            });

            expect(deleteResponse.status).toEqual(200);

            const deleteData = await deleteResponse.json();
            expect(deleteData.success).toBe(true);

            const getResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authToken: deleteToken,
                    providerType: 'firebase',
                }),
            });

            const getData = await getResponse.json();
            expect(getData).toBeNull();
        });
    });

    describe('Edge Cases - Non-existent User', () => {
        test('should return null for non-existent user getAuthShare', async () => {
            const nonExistentToken = createMockAuthToken(
                `non-existent-${Date.now()}`,
                `nonexistent-${Date.now()}@example.com`
            );

            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: nonExistentToken,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data).toBeNull();
        });

        test('should return null for non-existent recovery method', async () => {
            const params = new URLSearchParams({
                authToken: createMockAuthToken(
                    `no-recovery-${Date.now()}`,
                    `norecovery-${Date.now()}@example.com`
                ),
                providerType: 'firebase',
                type: 'passkey',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data).toBeNull();
        });
    });

    describe('Edge Cases - Auth Share Updates', () => {
        const updateUserId = `update-user-${Date.now()}`;
        const updateEmail = `update-${Date.now()}@example.com`;
        let updateToken: string;

        beforeAll(() => {
            updateToken = createMockAuthToken(updateUserId, updateEmail);
        });

        test('should allow updating an existing auth share', async () => {
            const initialShare = {
                encryptedData: 'initial-data',
                encryptedDek: 'initial-dek',
                iv: 'initial-iv',
            };

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: updateToken,
                    providerType: 'firebase',
                    authShare: initialShare,
                    primaryDid: 'did:key:z6MkInitial',
                }),
            });

            const updatedShare = {
                encryptedData: 'updated-data',
                encryptedDek: 'updated-dek',
                iv: 'updated-iv',
            };

            const updateResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: updateToken,
                    providerType: 'firebase',
                    authShare: updatedShare,
                    primaryDid: 'did:key:z6MkUpdated',
                }),
            });

            expect(updateResponse.status).toEqual(200);

            const getResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: updateToken,
                    providerType: 'firebase',
                }),
            });

            const data = await getResponse.json();
            expect(data.authShare.encryptedData).toBe('updated-data');
            expect(data.primaryDid).toBe('did:key:z6MkUpdated');
        });
    });

    describe('Edge Cases - Recovery Method Retrieval', () => {
        const recoveryUserId = `recovery-edge-${Date.now()}`;
        const recoveryEmail = `recoveryedge-${Date.now()}@example.com`;
        let recoveryToken: string;

        beforeAll(async () => {
            recoveryToken = createMockAuthToken(recoveryUserId, recoveryEmail);

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: recoveryToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'recovery-edge-data',
                        encryptedDek: 'recovery-edge-dek',
                        iv: 'recovery-edge-iv',
                    },
                    primaryDid: 'did:key:z6MkRecoveryEdge',
                }),
            });
        });

        test('should add backup recovery method', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: recoveryToken,
                    providerType: 'firebase',
                    type: 'backup',
                    encryptedShare: {
                        encryptedData: 'backup-codes-encrypted',
                        iv: 'backup-iv',
                    },
                }),
            });

            expect(response.status).toEqual(200);
        });

        test('should retrieve specific passkey by credentialId', async () => {
            const credentialId1 = 'passkey-cred-1';
            const credentialId2 = 'passkey-cred-2';

            await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: recoveryToken,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: { encryptedData: 'passkey-1-data', iv: 'pk1-iv' },
                    credentialId: credentialId1,
                }),
            });

            await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: recoveryToken,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: { encryptedData: 'passkey-2-data', iv: 'pk2-iv' },
                    credentialId: credentialId2,
                }),
            });

            const params = new URLSearchParams({
                authToken: recoveryToken,
                providerType: 'firebase',
                type: 'passkey',
                credentialId: credentialId2,
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.encryptedData).toBe('passkey-2-data');
        });

        test('should return first passkey when no credentialId specified', async () => {
            const params = new URLSearchParams({
                authToken: recoveryToken,
                providerType: 'firebase',
                type: 'passkey',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.encryptedData).toBe('passkey-1-data');
        });

        test('should include all recovery methods with createdAt dates', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: recoveryToken,
                    providerType: 'firebase',
                }),
            });

            const data = await response.json();

            expect(data.recoveryMethods.length).toBeGreaterThanOrEqual(3);

            data.recoveryMethods.forEach((method: { type: string; createdAt: string }) => {
                expect(['password', 'passkey', 'backup']).toContain(method.type);
                expect(method.createdAt).toBeDefined();
                expect(new Date(method.createdAt).getTime()).toBeGreaterThan(0);
            });
        });
    });

    describe('Edge Cases - Security Level', () => {
        test('should return default security level for new user', async () => {
            const securityToken = createMockAuthToken(
                `security-${Date.now()}`,
                `security-${Date.now()}@example.com`
            );

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: securityToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'sec-data',
                        encryptedDek: 'sec-dek',
                        iv: 'sec-iv',
                    },
                    primaryDid: 'did:key:z6MkSecurity',
                }),
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: securityToken,
                    providerType: 'firebase',
                }),
            });

            const data = await response.json();
            expect(data.securityLevel).toBe('basic');
        });
    });

    describe('Edge Cases - Multiple Auth Providers', () => {
        test('should support same user with different provider types', async () => {
            const multiProviderEmail = `multiprovider-${Date.now()}@example.com`;

            const firebaseToken = createMockAuthToken(`firebase-${Date.now()}`, multiProviderEmail);

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: firebaseToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'multi-provider-data',
                        encryptedDek: 'multi-provider-dek',
                        iv: 'multi-provider-iv',
                    },
                    primaryDid: 'did:key:z6MkMultiProvider',
                }),
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: firebaseToken,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.authShare).toBeDefined();
        });
    });

    describe('Edge Cases - Idempotency', () => {
        test('should handle delete on already deleted user gracefully', async () => {
            const idempotentToken = createMockAuthToken(
                `idempotent-${Date.now()}`,
                `idempotent-${Date.now()}@example.com`
            );

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: idempotentToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'idempotent-data',
                        encryptedDek: 'idempotent-dek',
                        iv: 'idempotent-iv',
                    },
                    primaryDid: 'did:key:z6MkIdempotent',
                }),
            });

            await fetch(`${LCA_API_URL}/api/keys/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: idempotentToken,
                    providerType: 'firebase',
                }),
            });

            const secondDeleteResponse = await fetch(`${LCA_API_URL}/api/keys/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: idempotentToken,
                    providerType: 'firebase',
                }),
            });

            expect(secondDeleteResponse.status).toEqual(200);
        });

        test('should handle migrate on non-existent user', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/migrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: createMockAuthToken(
                        `no-migrate-${Date.now()}`,
                        `nomigrate-${Date.now()}@example.com`
                    ),
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);
        });
    });

    describe('Edge Cases - Recovery Method with Salt', () => {
        test('should store and retrieve recovery share with salt', async () => {
            const saltToken = createMockAuthToken(
                `salt-user-${Date.now()}`,
                `salt-${Date.now()}@example.com`
            );

            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: saltToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'salt-data',
                        encryptedDek: 'salt-dek',
                        iv: 'salt-iv',
                    },
                    primaryDid: 'did:key:z6MkSalt',
                }),
            });

            const shareWithSalt = {
                encryptedData: 'salted-share',
                iv: 'salted-iv',
                salt: 'random-salt-value-abc123',
            };

            await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: saltToken,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: shareWithSalt,
                }),
            });

            const params = new URLSearchParams({
                authToken: saltToken,
                providerType: 'firebase',
                type: 'passkey',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.encryptedData).toBe('salted-share');
            expect(data.salt).toBe('random-salt-value-abc123');
        });
    });

    describe('Orphaned Recovery Method Pruning', () => {
        const userId = `prune-user-${Date.now()}`;
        const email = `prune-${Date.now()}@example.com`;
        let token: string;

        beforeAll(() => {
            token = createMockAuthToken(userId, email);
        });

        test('prunes recovery method whose auth share version was evicted from history', async () => {
            // Step 1: Create user with initial auth share (version 1)
            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: { encryptedData: 'share-v1', encryptedDek: 'dek-v1', iv: 'iv-v1' },
                    primaryDid: 'did:key:z6MkPrune',
                }),
            });

            // Step 2: Update auth share → version becomes 2
            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: { encryptedData: 'share-v2', encryptedDek: 'dek-v2', iv: 'iv-v2' },
                    primaryDid: 'did:key:z6MkPrune',
                }),
            });

            // Step 3: Add a passkey recovery method (tied to current version = 2)
            await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: { encryptedData: 'passkey-share-v2', iv: 'passkey-iv-v2' },
                    shareVersion: 2,
                }),
            });

            // Step 4: Verify recovery method exists
            let status = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            }).then(r => r.json());

            expect(status.recoveryMethods).toHaveLength(1);
            expect(status.recoveryMethods[0].type).toBe('passkey');

            // Step 5: Rotate auth share 6 more times (v3 through v8).
            // After 6 rotations: current = v8, previousAuthShares = [v3, v4, v5, v6, v7].
            // Version 2 (where the passkey was created) has been evicted.
            for (let v = 3; v <= 8; v++) {
                await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        authToken: token,
                        providerType: 'firebase',
                        authShare: { encryptedData: `share-v${v}`, encryptedDek: `dek-v${v}`, iv: `iv-v${v}` },
                        primaryDid: 'did:key:z6MkPrune',
                    }),
                });
            }

            // Step 6: Verify the passkey recovery method has been pruned
            status = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            }).then(r => r.json());

            expect(status.recoveryMethods).toHaveLength(0);
            expect(status.shareVersion).toBe(8);
        });

        test('does NOT prune recovery method whose auth share version is still in history', async () => {
            // Continuing from the previous test: current = v8, previous = [v3..v7]

            // Add a phrase recovery method (tied to current version = 8)
            await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'phrase',
                    encryptedShare: { encryptedData: 'phrase-share-v8', iv: 'phrase-iv-v8' },
                    shareVersion: 8,
                }),
            });

            // Rotate once more → v9, previous = [v4..v8]
            // Version 8 is still in history, so phrase method should survive
            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: { encryptedData: 'share-v9', encryptedDek: 'dek-v9', iv: 'iv-v9' },
                    primaryDid: 'did:key:z6MkPrune',
                }),
            });

            const status = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            }).then(r => r.json());

            // The phrase recovery method from v8 should still exist
            expect(status.recoveryMethods).toHaveLength(1);
            expect(status.recoveryMethods[0].type).toBe('phrase');
            expect(status.shareVersion).toBe(9);
        });
    });

    describe('Full Migration Lifecycle', () => {
        const userId = `full-migration-${Date.now()}`;
        const email = `full-migration-${Date.now()}@example.com`;
        const legacyDid = `did:key:z6MkLegacy${Date.now()}`;
        const newDid = `did:key:z6MkNewSSS${Date.now()}`;

        let token: string;

        beforeAll(() => {
            token = createMockAuthToken(userId, email);
        });

        test('step 1: new user has no server record', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data).toBeNull();
        });

        test('step 2: store auth share with legacy DID (simulates pre-migration state)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'legacy-auth-share',
                        encryptedDek: 'legacy-dek',
                        iv: 'legacy-iv',
                    },
                    primaryDid: legacyDid,
                    keyProvider: 'web3auth',
                }),
            });

            expect(response.status).toEqual(200);
        });

        test('step 3: server reports needsMigration for web3auth user', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data).toBeDefined();
            expect(data.primaryDid).toBe(legacyDid);

            // Server should indicate this user needs migration (keyProvider is web3auth)
            expect(data.keyProvider).toBe('web3auth');
        });

        test('step 4: store new SSS auth share (migration — re-split with new strategy)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'new-sss-auth-share',
                        encryptedDek: 'new-sss-dek',
                        iv: 'new-sss-iv',
                    },
                    primaryDid: newDid,
                    keyProvider: 'sss',
                }),
            });

            expect(response.status).toEqual(200);
        });

        test('step 5: mark user as migrated', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/migrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('step 6: post-migration — server returns SSS share, no longer needs migration', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data).toBeDefined();
            expect(data.primaryDid).toBe(newDid);
            expect(data.keyProvider).toBe('sss');
            expect(data.authShare?.encryptedData).toBe('new-sss-auth-share');
        });

        test('step 7: add recovery method after migration', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'passkey',
                    encryptedShare: {
                        encryptedData: 'post-migration-recovery-share',
                        iv: 'post-migration-iv',
                    },
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('step 8: verify recovery method is accessible post-migration', async () => {
            const params = new URLSearchParams({
                authToken: token,
                providerType: 'firebase',
                type: 'passkey',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.encryptedData).toBe('post-migration-recovery-share');
        });
    });

    describe('Recovery Email Verification', () => {
        const userId = `recovery-email-user-${Date.now()}`;
        const primaryEmail = `primary-${Date.now()}@example.com`;
        const recoveryEmail = `recovery-${Date.now()}@personal.com`;
        const did = `did:key:z6MkRecovery${Date.now()}`;

        let token: string;

        beforeAll(async () => {
            token = createMockAuthToken(userId, primaryEmail);

            // Create user key first
            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'recovery-email-test-auth-share',
                        encryptedDek: 'recovery-email-test-dek',
                        iv: 'recovery-email-test-iv',
                    },
                    primaryDid: did,
                }),
            });
        });

        test('addRecoveryEmail requires DID auth (rejects without VP)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    email: recoveryEmail,
                }),
            });

            // didRoute — requires a DID-signed VP in Authorization header
            expect(response.status).toEqual(401);
        });

        test('verifyRecoveryEmail requires DID auth (rejects without VP)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    code: '123456',
                }),
            });

            // didRoute — requires a DID-signed VP in Authorization header
            expect(response.status).toEqual(401);
        });

        test('getAuthShare should not have maskedRecoveryEmail before verification', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.maskedRecoveryEmail).toBeNull();
        });

        test('should register email recovery method after verification', async () => {
            // Register the email recovery method type (simulates what setupRecoveryMethod does)
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    shareVersion: 1,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('email recovery method should appear in getAuthShare', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            const emailMethod = data.recoveryMethods.find((m: { type: string }) => m.type === 'email');

            expect(emailMethod).toBeDefined();
            expect(emailMethod.shareVersion).toBe(1);
        });

        test('sendEmailBackup should reject when no email or useRecoveryEmail flag', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    emailShare: 'test-share-data',
                }),
            });

            expect(response.status).toEqual(400);
        });

        test('sendEmailBackup with useRecoveryEmail should fail without verified recovery email', async () => {
            // This user hasn't completed verification (the code test above used wrong code)
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: token,
                    providerType: 'firebase',
                    emailShare: 'test-share-data',
                    useRecoveryEmail: true,
                }),
            });

            expect(response.status).toEqual(400);
        });
    });
});
