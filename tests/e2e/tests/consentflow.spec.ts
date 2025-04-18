import { describe, it, expect } from 'vitest';
import { getLearnCardForUser, getLearnCard, LearnCard, USERS } from './helpers/learncard.helpers';
import crypto from 'crypto';
import { testUnsignedBoost } from './helpers/credential.helpers';

import {
    minimalContract,
    normalFullTerms,
    normalContract,
    normalNoTerms,
} from './helpers/contract.helpers';
import { VC } from '@learncard/types';

let a: LearnCard;
let b: LearnCard;
let c: LearnCard;

describe('ConsentFlow E2E Tests', () => {
    beforeEach(async () => {
        // Initialize LearnCards for three different users
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        c = await getLearnCardForUser('c');
    });

    describe('Contract Creation and Management', () => {
        it('should allow creating a contract', async () => {
            const contractUri = await a.invoke.createContract({
                contract: minimalContract,
                name: 'Test Contract',
                description: 'A test contract created for E2E testing',
            });

            expect(contractUri).toBeDefined();
            expect(typeof contractUri).toBe('string');
        });

        it('should allow retrieving created contracts', async () => {
            // Create a unique contract
            const contractName = `Test Contract ${Date.now()}`;
            const contractUri = await a.invoke.createContract({
                contract: minimalContract,
                name: contractName,
            });

            // Get all contracts
            const contracts = await a.invoke.getContracts();

            expect(contracts).toBeDefined();
            expect(contracts.records.length).toBeGreaterThan(0);

            // Find our specific contract
            const createdContract = contracts.records.find(record => record.name === contractName);
            expect(createdContract).toBeDefined();
            expect(createdContract!.uri).toBe(contractUri);
        });

        it('should allow getting a single contract by URI', async () => {
            const contractName = `Single Contract Test ${Date.now()}`;
            const contractUri = await a.invoke.createContract({
                contract: minimalContract,
                name: contractName,
                description: 'A contract for single retrieval testing',
            });

            const contract = await a.invoke.getContract(contractUri);

            expect(contract).toBeDefined();
            expect(contract.name).toBe(contractName);
            expect(contract.description).toBe('A contract for single retrieval testing');
        });

        it('should allow deleting a contract', async () => {
            const contractUri = await a.invoke.createContract({
                contract: minimalContract,
                name: 'Contract To Delete',
            });

            // Verify contract was created
            const createdContract = await a.invoke.getContract(contractUri);
            expect(createdContract).toBeDefined();

            // Delete the contract
            const deleteResult = await a.invoke.deleteContract(contractUri);
            expect(deleteResult).toBe(true);

            // Try to get the deleted contract (should fail or return null/undefined)
            try {
                await a.invoke.getContract(contractUri);
                // If we don't get an error, fail the test
                expect(false).toBe(true); // This should never execute
            } catch (error) {
                // Expected to fail
                expect(error).toBeDefined();
            }
        });
    });

    describe('Contract Consent Flow', () => {
        let contractUri: string;

        beforeEach(async () => {
            // Create a contract to use in consent tests
            contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Consent Test Contract',
                description: 'A contract for testing consent flows',
            });
        });

        it('should allow a user to consent to a contract', async () => {
            const termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            expect(termsUri).toBeDefined();
            expect(typeof termsUri).toBe('string');
        });

        it('should allow retrieving consented contracts', async () => {
            await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            const consentedContracts = await b.invoke.getConsentedContracts();

            expect(consentedContracts).toBeDefined();
            expect(consentedContracts.records).toHaveLength(1);

            // Find the specific contract we consented to
            const foundContract = consentedContracts.records.find(
                record => record.contract.uri === contractUri
            );

            expect(foundContract).toBeDefined();
            expect(foundContract!.contract.name).toBe('Consent Test Contract');
        });

        it('should allow updating consented contract terms', async () => {
            await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            // Get the terms URI from consented contracts
            const consentedContracts = await b.invoke.getConsentedContracts();
            const termsRecord = consentedContracts.records.find(
                record => record.contract.uri === contractUri
            );

            const termsUri = termsRecord!.uri;

            // Update the terms
            const updatedTerms = {
                ...normalFullTerms,
                read: {
                    ...normalFullTerms.read,
                    personal: {
                        ...normalFullTerms.read.personal,
                        name: 'Updated Name',
                    },
                },
            };

            const updateResult = await b.invoke.updateContractTerms(termsUri, {
                terms: updatedTerms,
            });

            expect(updateResult).toBe(true);

            // Verify the update
            const updatedContracts = await b.invoke.getConsentedContracts();
            const updatedTermsRecord = updatedContracts.records.find(
                record => record.uri === termsUri
            );

            expect(updatedTermsRecord!.terms.read.personal.name).toBe('Updated Name');
        });

        it('should allow withdrawing consent', async () => {
            await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            // Get the terms URI from consented contracts
            const consentedContracts = await b.invoke.getConsentedContracts();
            const termsRecord = consentedContracts.records.find(
                record => record.contract.uri === contractUri
            );

            const termsUri = termsRecord!.uri;

            // Withdraw consent
            const withdrawResult = await b.invoke.withdrawConsent(termsUri);
            expect(withdrawResult).toBe(true);

            // Verify withdrawal status in consented contracts
            const updatedContracts = await b.invoke.getConsentedContracts();
            const withdrawnTermsRecord = updatedContracts.records.find(
                record => record.uri === termsUri
            );

            expect(withdrawnTermsRecord!.status).toBe('withdrawn');
        });
    });

    describe('Contract Data Access', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            // Create a contract with data access requirements
            contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Data Access Contract',
                description: 'A contract for testing data access',
            });

            // User B consents to the contract
            termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });
        });

        it('should allow contract owner to get data from consented users', async () => {
            const consentedData = await a.invoke.getConsentFlowData(contractUri);

            expect(consentedData).toBeDefined();
            expect(consentedData.records.length).toBeGreaterThan(0);

            const userBData = consentedData.records[0];

            expect(userBData).toBeDefined();
            expect(userBData.personal.name).toBe('Full Fullerson');
        });

        it('should allow getting consented data for a specific DID', async () => {
            const userBDid = b.id.did();

            const didData = await a.invoke.getConsentFlowDataForDid(userBDid);

            expect(didData).toBeDefined();
            expect(didData.records.length).toBeGreaterThan(0);

            // Find our contract's data
            const contractData = didData.records.find(record => record.contractUri === contractUri);

            expect(contractData).toBeDefined();
            expect(contractData!.personal.name).toBe('Full Fullerson');
        });

        it('should return transaction history for terms', async () => {
            const transactions = await b.invoke.getConsentFlowTransactions(termsUri);

            expect(transactions).toBeDefined();
            expect(transactions.records.length).toBeGreaterThan(0);

            // First transaction should be consent
            expect(transactions.records[0].action).toBe('consent');
        });

        it('should verify consent status', async () => {
            const isConsented = await a.invoke.verifyConsent(contractUri, USERS.b.profileId);
            expect(isConsented).toBe(true);

            // User C has not consented
            const notConsented = await a.invoke.verifyConsent(contractUri, USERS.c.profileId);
            expect(notConsented).toBe(false);
        });
    });

    describe('Contract Credential Issuance', () => {
        let contractUri: string;
        let termsUri: string;
        let boostUri: string;
        let credential: VC;

        beforeEach(async () => {
            // Create a boost first
            boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Test Achievement',
            });

            // Create a contract that allows writing credentials
            contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Credential Test Contract',
                description: 'A contract for testing credential issuance',
            });

            // User B consents to the contract
            termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            // User A issues a credential
            const unsignedCredential = {
                ...testUnsignedBoost,
                issuer: a.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUri,
            };

            credential = await a.invoke.issueCredential(unsignedCredential);
        });

        it('should allow writing a credential to a contract', async () => {
            const credentialUri = await a.invoke.writeCredentialToContract(
                b.id.did(),
                contractUri,
                credential,
                boostUri
            );

            expect(credentialUri).toBeDefined();
            expect(typeof credentialUri).toBe('string');
        });

        it('should allow retrieving credentials for a contract', async () => {
            await a.invoke.writeCredentialToContract(b.id.did(), contractUri, credential, boostUri);

            const credentials = await b.invoke.getCredentialsForContract(termsUri);

            expect(credentials).toBeDefined();
            expect(credentials.records.length).toBeGreaterThan(0);

            // Verify the credential details
            const credentialRecord = credentials.records[0];
            expect(credentialRecord.category).toBe('Achievement');
            expect(credentialRecord.boostUri).toContain(boostUri.split(':').pop());
        });

        it('should allow retrieving all credentials for a user', async () => {
            await a.invoke.writeCredentialToContract(b.id.did(), contractUri, credential, boostUri);

            const allCredentials = await b.invoke.getConsentFlowCredentials();

            expect(allCredentials).toBeDefined();
            expect(allCredentials.records.length).toBeGreaterThan(0);

            // Should include our contract credential
            const contractCredential = allCredentials.records.find(
                record => record.termsUri === termsUri
            );

            expect(contractCredential).toBeDefined();
        });

        it('should allow writing a credential via signing authority HTTP route', async () => {
            const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
            await learnCard.invoke.createServiceProfile({
                profileId: 'rando',
                displayName: 'Random User',
                bio: '',
                shortBio: '',
            });
            const sa = await learnCard.invoke.createSigningAuthority('test-sa');
            expect(sa).toBeDefined();
            await learnCard.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);
            const saResult = await learnCard.invoke.getRegisteredSigningAuthority(
                sa.endpoint,
                sa.name
            );
            expect(saResult).toBeDefined();
            const signingAuthority = {
                endpoint: saResult.signingAuthority.endpoint,
                name: saResult.relationship.name,
            };

            const grantId = await learnCard.invoke.addAuthGrant({
                status: 'active',
                id: 'test',
                name: 'test',
                challenge: 'auth-grant:test-challenge',
                createdAt: new Date().toISOString(),
                scope: 'contracts:write',
            });
            const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

            const newBoostUri = await learnCard.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Test Achievement',
            });

            const payload = { boostUri: newBoostUri, signingAuthority };
            const response = await fetch(
                `http://localhost:4000/api/consent-flow-contract/write/via-signing-authority/${contractUri.replace(
                    '/',
                    '%2F'
                )}/${b.id.did()}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const credentialUri = await response.json();
            expect(typeof credentialUri).toBe('string');
            expect(credentialUri.length).toBeGreaterThan(0);

            // Check that user B received the credential
            const consentFlowCredentials = await b.invoke.getConsentFlowCredentials();
            expect(consentFlowCredentials.records.length).toBeGreaterThan(0);
            const credentialRecord = consentFlowCredentials.records[0];
            expect(credentialRecord.termsUri).toBe(termsUri);
            expect(credentialRecord.category).toBe('Achievement');
            expect(credentialRecord.credentialUri).toBe(credentialUri);
        });
    });

    describe('Auto-Boosts', () => {
        let boostUri: string;
        let signingAuthority: { endpoint: string; name: string };

        beforeEach(async () => {
            // Create a boost for auto-issuing
            boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Auto-Boost Test',
            });

            const sa = await a.invoke.createSigningAuthority('autoboost');

            if (!sa) throw new Error('Could not create Signing Authority');

            // Register a signing authority for userA
            await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);

            // Get the signing authority
            const saResult = await a.invoke.getRegisteredSigningAuthority(sa.endpoint!, sa.name);

            await a.invoke.clearDidWebCache();

            signingAuthority = {
                endpoint: saResult!.signingAuthority.endpoint,
                name: saResult!.relationship.name,
            };
        });

        it('should auto-issue credentials when consenting to a contract with auto-boosts', async () => {
            // Create a contract with an auto-boost
            const contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Auto-Boost Contract',
                description: 'A contract that auto-issues boosts on consent',
                autoboosts: [{ boostUri, signingAuthority }],
            });

            // User B consents to the contract
            const termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms,
            });

            // Check if a credential was automatically issued
            const credentials = await b.invoke.getCredentialsForContract(termsUri);

            expect(credentials).toBeDefined();
            expect(credentials.records.length).toBeGreaterThan(0);

            // Verify it's our auto-boost
            const autoBoost = credentials.records[0];
            expect(autoBoost.boostUri).toContain(boostUri.split(':').pop());

            // Check transactions to verify auto-boost was recorded
            const transactions = await b.invoke.getConsentFlowTransactions(termsUri);

            expect(transactions.records.length).toBeGreaterThanOrEqual(2); // consent + auto-boost

            // At least one transaction should be a write action (auto-boost)
            const hasWriteAction = transactions.records.some(tx => tx.action === 'write');
            expect(hasWriteAction).toBe(true);
        });
    });

    describe('Credential Syncing', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            // Create a contract with Achievement and ID categories
            contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Sync Test Contract',
                description: 'A contract for testing credential syncing',
            });

            // User B consents to the contract with no shared credentials initially
            termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalNoTerms,
            });
        });

        it('should allow syncing credentials to a contract in a single category', async () => {
            const testCredentials = ['credential:abc123', 'credential:def456'];

            // Sync credentials to the Achievement category
            const syncResult = await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: testCredentials,
            });

            expect(syncResult).toBe(true);

            // Verify the credentials were synced by checking the terms
            const contracts = await b.invoke.getConsentedContracts();
            const updatedTerms = contracts.records.find(record => record.uri === termsUri)!;

            // Check that the Achievement category contains our synced credentials
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toEqual(
                expect.arrayContaining(testCredentials)
            );
        });

        it('should allow syncing credentials to a contract in multiple categories', async () => {
            const achievementCredentials = ['credential:abc123', 'credential:def456'];
            const idCredentials = ['credential:id789', 'credential:id012'];

            // Sync credentials to multiple categories
            const syncResult = await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: achievementCredentials,
                ID: idCredentials,
            });

            expect(syncResult).toBe(true);

            // Verify the credentials were synced by checking the terms
            const contracts = await b.invoke.getConsentedContracts();
            const updatedTerms = contracts.records.find(record => record.uri === termsUri)!;

            // Check that both categories contain our synced credentials
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toEqual(
                expect.arrayContaining(achievementCredentials)
            );
            expect(updatedTerms.terms.read.credentials.categories.ID?.shared).toEqual(
                expect.arrayContaining(idCredentials)
            );
        });

        it('should add new synced credentials to existing shared credentials', async () => {
            // First sync some credentials
            const initialCredentials = ['credential:initial1', 'credential:initial2'];
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: initialCredentials,
            });

            // Then sync additional credentials
            const additionalCredentials = ['credential:additional1', 'credential:additional2'];
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: additionalCredentials,
            });

            // Verify all credentials were combined
            const contracts = await b.invoke.getConsentedContracts();
            const updatedTerms = contracts.records.find(record => record.uri === termsUri)!;

            // Should contain both initial and additional credentials
            const expectedCombined = [...initialCredentials, ...additionalCredentials];
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toHaveLength(
                expectedCombined.length
            );
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toEqual(
                expect.arrayContaining(expectedCombined)
            );
        });

        it('should create transactions with the correct action and terms data', async () => {
            const achievementCredentials = ['credential:ach1', 'credential:ach2'];
            const idCredentials = ['credential:id1', 'credential:id2'];

            // Sync credentials to multiple categories
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: achievementCredentials,
                ID: idCredentials,
            });

            // Check transaction history
            const transactions = await b.invoke.getConsentFlowTransactions(termsUri);

            // Should have at least 2 transactions (consent + sync)
            expect(transactions.records.length).toBeGreaterThanOrEqual(2);

            // Find the sync transaction
            const syncTransaction = transactions.records.find(tx => tx.action === 'sync');
            expect(syncTransaction).toBeDefined();

            // Verify sync transaction has the correct structure
            expect(syncTransaction?.terms?.read?.credentials?.categories).toBeDefined();

            // Check achievement category
            const achievementCategory =
                syncTransaction?.terms?.read?.credentials?.categories?.Achievement;
            expect(achievementCategory).toBeDefined();
            expect(achievementCategory?.shared).toEqual(
                expect.arrayContaining(achievementCredentials)
            );

            // Check ID category
            const idCategory = syncTransaction?.terms?.read?.credentials?.categories?.ID;
            expect(idCategory).toBeDefined();
            expect(idCategory?.shared).toEqual(expect.arrayContaining(idCredentials));
        });

        it('should reject sync requests for categories not in the contract', async () => {
            // Try to sync to a non-existent category
            await expect(
                b.invoke.syncCredentialsToContract(termsUri, {
                    NonExistentCategory: ['credential:123'],
                })
            ).rejects.toThrow();
        });

        it('should reject sync requests for terms that do not belong to the user', async () => {
            // User C tries to sync credentials to User B's terms
            await expect(
                c.invoke.syncCredentialsToContract(termsUri, {
                    Achievement: ['credential:123'],
                })
            ).rejects.toThrow();
        });

        it('should reject sync requests for withdrawn terms', async () => {
            // Withdraw consent
            await b.invoke.withdrawConsent(termsUri);

            // Try to sync to withdrawn terms
            await expect(
                b.invoke.syncCredentialsToContract(termsUri, {
                    Achievement: ['credential:123'],
                })
            ).rejects.toThrow();
        });

        it('should deduplicate credentials when syncing', async () => {
            const credentials = ['credential:123', 'credential:456', 'credential:123']; // Duplicate intentional

            // Sync credentials with a duplicate
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: credentials,
            });

            // Verify deduplication
            const contracts = await b.invoke.getConsentedContracts();
            const updatedTerms = contracts.records.find(record => record.uri === termsUri)!;

            // Should only have 2 unique credentials
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toHaveLength(
                2
            );
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toContain(
                'credential:123'
            );
            expect(updatedTerms.terms.read.credentials.categories.Achievement?.shared).toContain(
                'credential:456'
            );
        });

        it('should allow contract owner to access synced credentials', async () => {
            const testCredentials = ['credential:abc123', 'credential:def456'];

            // User B syncs credentials
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: testCredentials,
            });

            // User A (contract owner) fetches consented data
            const consentedData = await a.invoke.getConsentFlowDataForDid(b.id.did(), {
                query: { id: contractUri.split(':').at(-1) },
            });

            // Should have data from User B
            expect(consentedData.records.length).toEqual(1);

            const userBData = consentedData.records[0]!;

            // Verify the credentials are accessible to the contract owner
            expect(
                testCredentials.every(uri => userBData.credentials.find(cred => cred.uri === uri))
            ).toBeTruthy();
        });

        it('should update consent data when syncing additional credentials', async () => {
            // First sync
            const firstBatch = ['credential:first1', 'credential:first2'];
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: firstBatch,
            });

            // User A checks consented data
            let consentedData = await a.invoke.getConsentFlowData(contractUri);
            let userBData = consentedData.records[0]!;

            expect(userBData.credentials.categories.Achievement).toEqual(
                expect.arrayContaining(firstBatch)
            );

            // Second sync
            const secondBatch = ['credential:second1', 'credential:second2'];
            await b.invoke.syncCredentialsToContract(termsUri, {
                Achievement: secondBatch,
            });

            // User A checks updated consented data
            consentedData = await a.invoke.getConsentFlowData(contractUri);
            userBData = consentedData.records[0]!;

            // Should contain both batches of credentials
            const allCredentials = [...firstBatch, ...secondBatch];
            expect(userBData.credentials.categories.Achievement).toEqual(
                expect.arrayContaining(allCredentials)
            );
        });
    });
});
