import { describe, test, expect, beforeAll } from 'vitest';
import crypto from 'crypto';

import {
    getLearnCard,
    getLearnCardForUser,
    createApiTokenForUser,
    LearnCard,
} from './helpers/learncard.helpers';

describe('Credential Issuance and Verification via Signing Authority', () => {
    let issuerLearnCard: LearnCard;
    let signingAuthorityEndpoint: string;
    let signingAuthorityName: string;
    let signingAuthorityDid: string;

    beforeAll(async () => {
        issuerLearnCard = await getLearnCardForUser('a');

        const sa = await issuerLearnCard.invoke.createSigningAuthority('e2e-issue-sa');
        signingAuthorityEndpoint = sa.endpoint;
        signingAuthorityName = 'issue-sa';
        signingAuthorityDid = sa.did;

        await issuerLearnCard.invoke.registerSigningAuthority(
            signingAuthorityEndpoint,
            signingAuthorityName,
            signingAuthorityDid
        );
    });

    describe('issueCredential endpoint', () => {
        test('should issue a credential using the primary signing authority', async () => {
            const unsignedCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: '', // Will be set by the endpoint
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:recipient',
                    achievement: 'Test Achievement',
                },
            };

            const signedCredential = await issuerLearnCard.invoke.issueCredentialWithNetwork(
                unsignedCredential as any
            );

            expect(signedCredential).toBeDefined();
            expect(signedCredential.proof).toBeDefined();
            expect(signedCredential.issuer).toBe(signingAuthorityDid);
        });

        test('should issue a credential using a specific signing authority', async () => {
            const sa2 = await issuerLearnCard.invoke.createSigningAuthority('e2e-issue-sa-2');
            await issuerLearnCard.invoke.registerSigningAuthority(sa2.endpoint, 'issue-sa-2', sa2.did);

            const unsignedCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: '',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:recipient2',
                    skill: 'TypeScript',
                },
            };

            const signedCredential = await issuerLearnCard.invoke.issueCredentialWithNetwork(
                unsignedCredential as any,
                {
                    signingAuthority: {
                        endpoint: sa2.endpoint,
                        name: 'issue-sa-2',
                    },
                }
            );

            expect(signedCredential).toBeDefined();
            expect(signedCredential.proof).toBeDefined();
            expect(signedCredential.issuer).toBe(sa2.did);
        });

        test('should fail if no signing authority is registered', async () => {
            const newLearnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await newLearnCard.invoke.createServiceProfile({
                profileId: 'no-sa-test',
                displayName: 'No SA Test',
                bio: '',
                shortBio: '',
            });

            const unsignedCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: '',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:recipient3',
                },
            };

            await expect(
                newLearnCard.invoke.issueCredentialWithNetwork(unsignedCredential as any)
            ).rejects.toThrow();
        });

        test('should work with API key authentication', async () => {
            const { token } = await createApiTokenForUser(
                'a',
                ['credentials:write', 'signingAuthorities:read']
            );

            const response = await fetch('http://localhost:4000/api/credential/issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    credential: {
                        '@context': ['https://www.w3.org/2018/credentials/v1'],
                        type: ['VerifiableCredential'],
                        issuer: '',
                        issuanceDate: new Date().toISOString(),
                        credentialSubject: {
                            id: 'did:example:api-key-recipient',
                            badge: 'API Key Test Badge',
                        },
                    },
                }),
            });

            expect(response.status).toBe(200);

            const signedCredential = await response.json();

            expect(signedCredential).toBeDefined();
            expect(signedCredential.proof).toBeDefined();
        });
    });

    describe('verifyCredential endpoint', () => {
        test('should verify a valid credential', async () => {
            const unsignedCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: '',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:verify-test',
                    status: 'verified',
                },
            };

            const signedCredential = await issuerLearnCard.invoke.issueCredentialWithNetwork(
                unsignedCredential as any
            );

            const verificationResult = await issuerLearnCard.invoke.verifyCredentialWithNetwork(
                signedCredential as any
            );

            expect(verificationResult).toBeDefined();
            expect(verificationResult.checks).toContain('proof');
            expect(verificationResult.errors).toHaveLength(0);
        });

        test('should return errors for an invalid credential', async () => {
            const invalidCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: 'did:example:fake-issuer',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:invalid-test',
                },
                proof: {
                    type: 'Ed25519Signature2018',
                    created: new Date().toISOString(),
                    verificationMethod: 'did:example:fake-issuer#key-1',
                    proofPurpose: 'assertionMethod',
                    jws: 'invalid-signature',
                },
            };

            const verificationResult = await issuerLearnCard.invoke.verifyCredentialWithNetwork(
                invalidCredential as any
            );

            expect(verificationResult).toBeDefined();
            expect(verificationResult.errors.length).toBeGreaterThan(0);
        });

        test('should be accessible without authentication via HTTP', async () => {
            const unsignedCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: '',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:public-verify',
                },
            };

            const signedCredential = await issuerLearnCard.invoke.issueCredentialWithNetwork(
                unsignedCredential as any
            );

            const response = await fetch('http://localhost:4000/api/credential/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: signedCredential,
                }),
            });

            expect(response.status).toBe(200);

            const verificationResult = await response.json();

            expect(verificationResult).toBeDefined();
            expect(verificationResult.checks).toContain('proof');
            expect(verificationResult.errors).toHaveLength(0);
        });
    });
});
