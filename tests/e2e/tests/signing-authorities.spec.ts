import { describe, test, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

import { getLearnCardForUser, getLearnCard, LearnCard, USERS } from './helpers/learncard.helpers';

let a: LearnCard;

describe('Signing Authorities', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
    });

    describe('Name Validation', () => {
        test('Should reject signing authority names longer than 15 characters via SDK', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'testuser',
                displayName: 'Test User',
                bio: '',
                shortBio: '',
            });

            const sa = await learnCard.invoke.createSigningAuthority('test-sa');
            expect(sa).toBeDefined();

            await expect(
                learnCard.invoke.registerSigningAuthority(
                    sa.endpoint,
                    'this-name-is-too-long-to-be-valid',
                    sa.did
                )
            ).rejects.toThrow();
        });

        test('Should reject signing authority names with uppercase letters via SDK', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'testuser2',
                displayName: 'Test User 2',
                bio: '',
                shortBio: '',
            });

            const sa = await learnCard.invoke.createSigningAuthority('test-sa-2');
            expect(sa).toBeDefined();

            await expect(
                learnCard.invoke.registerSigningAuthority(sa.endpoint, 'MySignAuth', sa.did)
            ).rejects.toThrow();
        });

        test('Should reject signing authority names with special characters via SDK', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'testuser3',
                displayName: 'Test User 3',
                bio: '',
                shortBio: '',
            });

            const sa = await learnCard.invoke.createSigningAuthority('test-sa-3');
            expect(sa).toBeDefined();

            // Test underscore
            await expect(
                learnCard.invoke.registerSigningAuthority(sa.endpoint, 'my_sign_auth', sa.did)
            ).rejects.toThrow();

            // Test period
            await expect(
                learnCard.invoke.registerSigningAuthority(sa.endpoint, 'my.sign.auth', sa.did)
            ).rejects.toThrow();

            // Test space
            await expect(
                learnCard.invoke.registerSigningAuthority(sa.endpoint, 'my sign auth', sa.did)
            ).rejects.toThrow();
        });

        test('Should accept valid signing authority names via SDK', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'testuser4',
                displayName: 'Test User 4',
                bio: '',
                shortBio: '',
            });

            const sa = await learnCard.invoke.createSigningAuthority('test-sa-4');
            expect(sa).toBeDefined();

            // Test valid names
            await expect(
                learnCard.invoke.registerSigningAuthority(sa.endpoint, 'valid-name-123', sa.did)
            ).resolves.not.toThrow();

            // Create another SA for the next test
            const sa2 = await learnCard.invoke.createSigningAuthority('test-sa-5');
            await expect(
                learnCard.invoke.registerSigningAuthority(sa2.endpoint, 'short', sa2.did)
            ).resolves.not.toThrow();

            // Test exactly 15 characters
            const sa3 = await learnCard.invoke.createSigningAuthority('test-sa-6');
            await expect(
                learnCard.invoke.registerSigningAuthority(sa3.endpoint, 'exactly15chars1', sa3.did)
            ).resolves.not.toThrow();
        });

        test('Should reject invalid signing authority names via HTTP route', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'httptest',
                displayName: 'HTTP Test User',
                bio: '',
                shortBio: '',
            });

            const grantId = await learnCard.invoke.addAuthGrant({
                status: 'active',
                id: 'test-sa-validation',
                name: 'test-sa-validation',
                challenge: 'auth-grant:test-sa-validation-challenge',
                createdAt: new Date().toISOString(),
                scope: 'signingAuthorities:write',
            });

            const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

            // Test name too long
            const response1 = await fetch(
                'http://localhost:4000/api/profile/signing-authority/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        endpoint: 'http://localhost:5000',
                        name: 'this-name-is-too-long-to-be-valid',
                        did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                    }),
                }
            );
            expect(response1.status).toBe(400);

            // Test uppercase letters
            const response2 = await fetch(
                'http://localhost:4000/api/profile/signing-authority/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        endpoint: 'http://localhost:5001',
                        name: 'MySignAuth',
                        did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                    }),
                }
            );
            expect(response2.status).toBe(400);

            // Test special characters
            const response3 = await fetch(
                'http://localhost:4000/api/profile/signing-authority/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        endpoint: 'http://localhost:5002',
                        name: 'my_sign_auth',
                        did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                    }),
                }
            );
            expect(response3.status).toBe(400);
        });

        test('Should accept valid signing authority names via HTTP route', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'httptest2',
                displayName: 'HTTP Test User 2',
                bio: '',
                shortBio: '',
            });

            const grantId = await learnCard.invoke.addAuthGrant({
                status: 'active',
                id: 'test-sa-validation-valid',
                name: 'test-sa-validation-valid',
                challenge: 'auth-grant:test-sa-validation-valid-challenge',
                createdAt: new Date().toISOString(),
                scope: 'signingAuthorities:write',
            });

            const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

            // Test valid name
            const response = await fetch(
                'http://localhost:4000/api/profile/signing-authority/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        endpoint: 'http://localhost:6000',
                        name: 'valid-name-123',
                        did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                    }),
                }
            );
            expect(response.status).toBe(200);
            const result = await response.json();
            expect(result).toBe(true);
        });
    });
});
