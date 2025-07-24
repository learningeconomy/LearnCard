import { describe, test, expect } from 'vitest';

import { getLearnCardForUser } from './helpers/learncard.helpers';
import { UnsignedVC } from '@learncard/types';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

describe('Credentials', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can issue credentials that others can verify', async () => {
        const c = await getLearnCardForUser('c');

        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const verification = await c.invoke.verifyCredential(vc);

        expect(verification.warnings).toHaveLength(0);
        expect(verification.errors).toHaveLength(0);
    });

    test('Users can issue VC 2.0 credentials that others can verify', async () => {
        const c = await getLearnCardForUser('c');

        const unsignedVc: UnsignedVC = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: 'http://university.example/credentials/3732',
            type: ['VerifiableCredential', 'ExampleDegreeCredential'],
            issuer: a.id.did(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 3_600_000).toISOString(),
            credentialSubject: { id: b.id.did() },
        };
        const vc = await a.invoke.issueCredential(unsignedVc);

        const verification = await c.invoke.verifyCredential(vc);

        expect(verification.warnings).toHaveLength(0);
        expect(verification.errors).toHaveLength(0);
    });

    test('Users can send/receive credentials via LCN', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.invoke.sendCredential('testb', vc);

        const incomingCreds = await b.invoke.getIncomingCredentials();

        expect(incomingCreds).toHaveLength(1);
        expect(incomingCreds[0].uri).toEqual(uri);

        const resolvedVc = await b.read.get(incomingCreds[0].uri);

        expect(resolvedVc).toEqual(vc);

        await b.invoke.acceptCredential(uri);

        expect(await a.invoke.getSentCredentials()).toHaveLength(1);
        expect(await b.invoke.getReceivedCredentials()).toHaveLength(1);
        expect(await b.invoke.getIncomingCredentials()).toHaveLength(0);
    });

    test('Users can store and recall credentials', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
        await a.index.LearnCloud.add({ id: 'test', uri });

        const records = await a.index.LearnCloud.get();

        expect(records).toHaveLength(1);
        expect(records[0].uri).toEqual(uri);
        expect(await a.read.get(uri)).toEqual(vc);

        // Make sure it's bespoke per user
        const bRecords = await b.index.LearnCloud.get();
        expect(bRecords).toHaveLength(0);
        expect(await b.read.get(uri)).toBeUndefined();
    });

    test('Users cannot accept the same credential twice', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.invoke.sendCredential('testb', vc);

        // First acceptance should succeed
        await expect(b.invoke.acceptCredential(uri)).resolves.not.toThrow();

        // Verify the credential is now in received credentials
        const receivedCreds = await b.invoke.getReceivedCredentials();
        expect(receivedCreds).toHaveLength(1);

        // Second acceptance should fail
        await expect(b.invoke.acceptCredential(uri)).rejects.toThrow(/already been received/);

        // Verify that received credentials count hasn't changed
        const receivedCredsAfter = await b.invoke.getReceivedCredentials();
        expect(receivedCredsAfter).toHaveLength(1);
    });

    describe('DataIntegrity Proofs', () => {
        test('Users can issue credentials with DataIntegrity proof', async () => {
            const c = await getLearnCardForUser('c');

            // Create an unsigned credential
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://www.w3.org/ns/credentials/examples/v2',
                ],
                id: 'http://university.example/credentials/data-integrity-test',
                type: ['VerifiableCredential', 'ExampleDegreeCredential'],
                issuer: a.id.did(),
                validFrom: new Date().toISOString(),
                validUntil: new Date(Date.now() + 3_600_000).toISOString(),
                credentialSubject: {
                    id: b.id.did(),
                    degree: {
                        type: 'BachelorDegree',
                        name: 'Bachelor of Science and Arts',
                    },
                },
            };

            // Issue credential with DataIntegrity proof options
            const dataIntegrityOptions = {
                type: 'DataIntegrityProof',
                proofPurpose: 'assertionMethod',
            };

            const vc = await a.invoke.issueCredential(unsignedVc, dataIntegrityOptions);

            // Verify the credential has the expected DataIntegrity proof structure
            expect(vc.proof).toBeDefined();
            expect(vc.proof.type).toBe('DataIntegrityProof');
            expect(vc.proof.cryptosuite).toBeDefined(); // Should be auto-determined (e.g., 'eddsa-2022' for Ed25519)
            expect(vc.proof.proofPurpose).toBe('assertionMethod');
            expect(vc.proof.verificationMethod).toBeDefined();
            expect(vc.proof.created).toBeDefined();
            expect(vc.proof.proofValue).toBeDefined();

            // Verify that another user can verify the DataIntegrity credential
            const verification = await c.invoke.verifyCredential(vc);

            expect(verification.warnings).toHaveLength(0);
            expect(verification.errors).toHaveLength(0);
            expect(verification.checks).toContain('proof');
        });

        test('Users can issue VC 2.0 credentials with DataIntegrity proof and send via LCN', async () => {
            // Create an unsigned VC 2.0 credential
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://www.w3.org/ns/credentials/examples/v2',
                ],
                id: 'http://university.example/credentials/data-integrity-lcn-test',
                type: ['VerifiableCredential', 'ExampleAlumniCredential'],
                issuer: {
                    id: a.id.did(),
                    name: 'Example University',
                },
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    id: b.id.did(),
                    alumniOf: {
                        id: 'did:example:c276e12ec21ebfeb1f712ebc6f1',
                        name: 'Example University',
                    },
                },
            };

            // Issue credential with DataIntegrity proof
            const dataIntegrityOptions = {
                type: 'DataIntegrityProof',
                proofPurpose: 'assertionMethod',
            };

            const vc = await a.invoke.issueCredential(unsignedVc, dataIntegrityOptions);

            // Verify DataIntegrity proof structure
            expect(vc.proof).toBeDefined();
            expect(vc.proof.type).toBe('DataIntegrityProof');
            expect(vc.proof.cryptosuite).toBeDefined(); // Should be auto-determined

            // Send the DataIntegrity credential via LCN
            const uri = await a.invoke.sendCredential('testb', vc);

            const incomingCreds = await b.invoke.getIncomingCredentials();
            expect(incomingCreds).toHaveLength(1);
            expect(incomingCreds[0].uri).toEqual(uri);

            const resolvedVc = await b.read.get(incomingCreds[0].uri);
            expect(resolvedVc).toEqual(vc);

            // Verify the received DataIntegrity credential maintains its proof structure
            expect(resolvedVc.proof.type).toBe('DataIntegrityProof');
            expect(resolvedVc.proof.cryptosuite).toBeDefined(); // Should be auto-determined

            await b.invoke.acceptCredential(uri);

            expect(await a.invoke.getSentCredentials()).toHaveLength(1);
            expect(await b.invoke.getReceivedCredentials()).toHaveLength(1);
            expect(await b.invoke.getIncomingCredentials()).toHaveLength(0);
        });

        test('DataIntegrity credentials can be stored and retrieved from LearnCloud', async () => {
            // Create and issue a DataIntegrity credential
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://www.w3.org/ns/credentials/examples/v2',
                ],
                id: 'http://university.example/credentials/data-integrity-storage-test',
                type: ['VerifiableCredential', 'ExampleCredential'],
                issuer: a.id.did(),
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    id: b.id.did(),
                    achievement: {
                        type: 'Achievement',
                        name: 'DataIntegrity Test Achievement',
                    },
                },
            };

            const dataIntegrityOptions = {
                type: 'DataIntegrityProof',
                proofPurpose: 'assertionMethod',
            };

            const vc = await a.invoke.issueCredential(unsignedVc, dataIntegrityOptions);

            // Store the DataIntegrity credential
            const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
            await a.index.LearnCloud.add({ id: 'data-integrity-test', uri });

            const records = await a.index.LearnCloud.get();
            expect(records).toHaveLength(1);
            expect(records[0].uri).toEqual(uri);

            // Retrieve and verify the stored DataIntegrity credential
            const retrievedVc = await a.read.get(uri);
            expect(retrievedVc).toEqual(vc);
            expect(retrievedVc.proof.type).toBe('DataIntegrityProof');
            expect(retrievedVc.proof.cryptosuite).toBeDefined(); // Should be auto-determined

            // Ensure privacy: other users cannot access the stored credential
            const bRecords = await b.index.LearnCloud.get();
            expect(bRecords).toHaveLength(0);
            expect(await b.read.get(uri)).toBeUndefined();
        });

        test('DataIntegrity proof verification fails for tampered credentials', async () => {
            const c = await getLearnCardForUser('c');

            // Create and issue a DataIntegrity credential
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://www.w3.org/ns/credentials/examples/v2',
                ],
                id: 'http://university.example/credentials/data-integrity-tamper-test',
                type: ['VerifiableCredential', 'ExampleCredential'],
                issuer: a.id.did(),
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    id: b.id.did(),
                    originalValue: 'authentic data',
                },
            };

            const dataIntegrityOptions = {
                type: 'DataIntegrityProof',
                proofPurpose: 'assertionMethod',
            };

            const vc = await a.invoke.issueCredential(unsignedVc, dataIntegrityOptions);

            // Verify the original credential is valid
            const originalVerification = await c.invoke.verifyCredential(vc);
            expect(originalVerification.errors).toHaveLength(0);

            // Tamper with the credential data
            const tamperedVc = {
                ...vc,
                credentialSubject: {
                    ...vc.credentialSubject,
                    originalValue: 'tampered data',
                },
            };

            // Verify that the tampered credential fails verification
            const tamperedVerification = await c.invoke.verifyCredential(tamperedVc);
            expect(tamperedVerification.errors.length).toBeGreaterThan(0);
        });

        test('DataIntegrity proof includes proper context and follows W3C spec', async () => {
            // Create a credential that follows W3C VC 2.0 spec closely
            const unsignedVc: UnsignedVC = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://www.w3.org/ns/credentials/examples/v2',
                ],
                id: 'http://university.example/credentials/data-integrity-spec-test',
                type: ['VerifiableCredential', 'UniversityDegreeCredential'],
                issuer: {
                    id: a.id.did(),
                    name: 'Example University',
                    description: 'A university for testing DataIntegrity proofs',
                },
                validFrom: new Date().toISOString(),
                validUntil: new Date(Date.now() + 86400000).toISOString(), // 24 hours
                credentialSubject: {
                    id: b.id.did(),
                    degree: {
                        type: 'BachelorDegree',
                        name: 'Bachelor of Science in Computer Science',
                        degreeSchool: 'School of Engineering',
                    },
                },
            };

            const dataIntegrityOptions = {
                type: 'DataIntegrityProof',
                proofPurpose: 'assertionMethod',
            };

            const vc = await a.invoke.issueCredential(unsignedVc, dataIntegrityOptions);

            // Verify W3C DataIntegrity spec compliance
            expect(vc['@context']).toContain('https://www.w3.org/ns/credentials/v2');
            expect(vc.type).toContain('VerifiableCredential');
            expect(vc.issuer).toBeDefined();
            expect(vc.validFrom).toBeDefined();
            expect(vc.credentialSubject).toBeDefined();

            // Verify DataIntegrity proof follows W3C spec
            expect(vc.proof).toBeDefined();
            expect(vc.proof.type).toBe('DataIntegrityProof');
            expect(vc.proof.cryptosuite).toBeDefined(); // Should be auto-determined (e.g., 'eddsa-2022' for Ed25519)
            expect(vc.proof.proofPurpose).toBe('assertionMethod');
            expect(vc.proof.verificationMethod).toMatch(/^did:/); // Should be a DID URL
            expect(vc.proof.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO 8601 format
            expect(vc.proof.proofValue).toBeDefined();
            expect(typeof vc.proof.proofValue).toBe('string');

            // Verify the credential can be verified by a third party
            const c = await getLearnCardForUser('c');
            const verification = await c.invoke.verifyCredential(vc);
            expect(verification.warnings).toHaveLength(0);
            expect(verification.errors).toHaveLength(0);
        });
    });
});
