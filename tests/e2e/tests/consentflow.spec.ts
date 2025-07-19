import { describe, it, expect } from 'vitest';
import { getLearnCardForUser, getLearnCard, LearnCard, USERS } from './helpers/learncard.helpers';
import crypto from 'crypto';
import { testUnsignedBoost } from './helpers/credential.helpers';

import {
    minimalContract,
    normalFullTerms,
    normalContract,
    normalNoTerms,
    contractWithDefaults,
} from './helpers/contract.helpers';
import { VC } from '@learncard/types';

let a: LearnCard;
let b: LearnCard;
let c: LearnCard;
let d: LearnCard;

describe('ConsentFlow E2E Tests', () => {
    beforeEach(async () => {
        // Initialize LearnCards for four different users
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        c = await getLearnCardForUser('c');
        d = await getLearnCardForUser('d');
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

        it('should allow creating and retrieving a contract with defaultEnabled fields', async () => {
            const contractName = `Default Enabled Contract ${Date.now()}`;
            const contractUri = await a.invoke.createContract({
                contract: contractWithDefaults,
                name: contractName,
                description: 'A contract for testing defaultEnabled fields',
            });

            expect(contractUri).toBeDefined();
            expect(typeof contractUri).toBe('string');

            // Retrieve the contract and verify defaultEnabled fields are preserved
            const contract = await a.invoke.getContract(contractUri);

            expect(contract).toBeDefined();
            expect(contract.name).toBe(contractName);
            expect(contract.description).toBe('A contract for testing defaultEnabled fields');

            // Verify read section defaultEnabled fields
            expect(contract.contract.read.personal.name?.defaultEnabled).toBe(true);
            expect(contract.contract.read.personal.email?.defaultEnabled).toBe(false);
            expect(contract.contract.read.personal.phone?.defaultEnabled).toBe(true);
            expect(contract.contract.read.credentials.categories.Achievement?.defaultEnabled).toBe(true);
            expect(contract.contract.read.credentials.categories.ID?.defaultEnabled).toBe(false);
            expect(contract.contract.read.credentials.categories.Certificate?.defaultEnabled).toBe(false);

            // Verify write section defaultEnabled fields
            expect(contract.contract.write.personal.name?.defaultEnabled).toBe(true);
            expect(contract.contract.write.personal.email?.defaultEnabled).toBe(false);
            expect(contract.contract.write.credentials.categories.Achievement?.defaultEnabled).toBe(false);
            expect(contract.contract.write.credentials.categories.Badge?.defaultEnabled).toBe(true);

            // Verify required fields are still preserved alongside defaultEnabled
            expect(contract.contract.read.personal.name?.required).toBe(false);
            expect(contract.contract.read.personal.email?.required).toBe(true);
            expect(contract.contract.read.credentials.categories.Achievement?.required).toBe(false);
            expect(contract.contract.read.credentials.categories.Certificate?.required).toBe(true);
            expect(contract.contract.write.credentials.categories.Achievement?.required).toBe(true);
            expect(contract.contract.write.credentials.categories.Badge?.required).toBe(false);
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
            const sa = await a.invoke.createSigningAuthority('test-sa');
            expect(sa).toBeDefined();
            await a.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);
            const saResult = await a.invoke.getRegisteredSigningAuthority(sa.endpoint, sa.name);
            expect(saResult).toBeDefined();
            const signingAuthority = {
                endpoint: saResult.signingAuthority.endpoint,
                name: saResult.relationship.name,
            };

            const grantId = await a.invoke.addAuthGrant({
                status: 'active',
                id: 'test',
                name: 'test',
                challenge: 'auth-grant:test-challenge',
                createdAt: new Date().toISOString(),
                scope: 'contracts-data:write',
            });
            const token = await a.invoke.getAPITokenForAuthGrant(grantId);

            const newBoostUri = await a.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Test Achievement',
            });

            const payload = {
                boostUri: newBoostUri,
                signingAuthority,
                did: b.id.did(),
                contractUri,
            };
            const response = await fetch(
                `http://localhost:4000/api/consent-flow-contract/write/via-signing-authority`,
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

    describe('Auto-Boosts with Denied Writers', () => {
        it('should handle re-consenting to a contract, filtering auto-issued boosts based on new deniedWriters', async () => {
            // Setup: User A (owner) and User C (writer) can issue boosts
            // User A's SA
            const saA_name = 'test-sa';
            const saA_created = await a.invoke.createSigningAuthority(saA_name);

            if (!saA_created) throw new Error('Could not create SA for User A');

            await a.invoke.registerSigningAuthority(
                saA_created.endpoint!,
                saA_created.name,
                saA_created.did!
            );
            const saA_Details = {
                endpoint: saA_created.endpoint!,
                name: saA_created.name,
            };

            // User C's SA
            const saC_name = 'test-sa2';
            const saC_created = await c.invoke.createSigningAuthority(saC_name);

            if (!saC_created) throw new Error('Could not create SA for User C');

            await c.invoke.registerSigningAuthority(
                saC_created.endpoint!,
                saC_created.name,
                saC_created.did!
            );
            const saC_Details = {
                endpoint: saC_created.endpoint!,
                name: saC_created.name,
            };

            // Boosts
            const boostA_id = `boost:e2e-reconsentA-${crypto.randomUUID()}`;
            const boostA_Uri = await a.invoke.createBoost(
                { ...testUnsignedBoost, id: boostA_id },
                {
                    category: 'Achievement',
                    name: 'Boost from A for Reconsent E2E',
                }
            );
            const boostC_id = `boost:e2e-reconsentC-${crypto.randomUUID()}`;
            const boostC_Uri = await c.invoke.createBoost(
                { ...testUnsignedBoost, id: boostC_id },
                {
                    category: 'Achievement',
                    name: 'Boost from C for Reconsent E2E',
                }
            );

            // Contract by User A, User C is a writer
            const contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: `Reconsent Auto Boost Contract E2E ${crypto.randomUUID()}`,
                writers: [USERS.c.profileId],
                autoboosts: [
                    {
                        boostUri: boostA_Uri,
                        signingAuthority: saA_Details,
                    },
                ],
            });
            await c.invoke.addAutoBoostsToContract(contractUri, [
                {
                    boostUri: boostC_Uri,
                    signingAuthority: saC_Details,
                },
            ]);

            // 1. Initial consent by User B (no denied writers)
            const initialTermsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms, // No deniedWriters
            });
            let credentialsAfterInitialConsent = await b.invoke.getCredentialsForContract(
                initialTermsUri
            );
            // Should have boosts from both A and C
            expect(credentialsAfterInitialConsent.records).toHaveLength(2);
            expect(
                credentialsAfterInitialConsent.records.some(cred =>
                    cred.boostUri?.includes(boostA_Uri.split(':').pop()!)
                )
            ).toBeTruthy();
            expect(
                credentialsAfterInitialConsent.records.some(cred =>
                    cred.boostUri?.includes(boostC_Uri.split(':').pop()!)
                )
            ).toBeTruthy();

            await b.invoke.withdrawConsent(initialTermsUri);

            // 2. Re-consent by User B, denying User C
            const reconsentTermsUri = await b.invoke.consentToContract(contractUri, {
                terms: { ...normalFullTerms, deniedWriters: [USERS.c.profileId] }, // Deny User C
            });

            const credentialsAfterReconsent = await b.invoke.getCredentialsForContract(
                reconsentTermsUri
            );

            expect(credentialsAfterReconsent.records).toHaveLength(3); // Only User A's boost for this new terms instance
            expect(
                credentialsAfterReconsent.records.filter(cred =>
                    cred.boostUri?.includes(boostA_Uri.split(':').pop()!)
                ).length
            ).toBe(2);
            expect(
                credentialsAfterReconsent.records.filter(cred =>
                    cred.boostUri?.includes(boostC_Uri.split(':').pop()!)
                ).length
            ).toBe(1);
        });

        it('should handle updating terms for a contract, filtering auto-issued boosts based on new deniedWriters', async () => {
            // User A's SA
            const saA_name = 'test-sa';
            const saA_created = await a.invoke.createSigningAuthority(saA_name);

            if (!saA_created) throw new Error('Could not create SA for User A');

            await a.invoke.registerSigningAuthority(
                saA_created.endpoint!,
                saA_created.name,
                saA_created.did!
            );
            const saA_Details = {
                endpoint: saA_created.endpoint!,
                name: saA_created.name,
            };

            // User C's SA
            const saC_name = 'test-sa2';
            const saC_created = await c.invoke.createSigningAuthority(saC_name);

            if (!saC_created) throw new Error('Could not create SA for User C');

            await c.invoke.registerSigningAuthority(
                saC_created.endpoint!,
                saC_created.name,
                saC_created.did!
            );
            const saC_Details = {
                endpoint: saC_created.endpoint!,
                name: saC_created.name,
            };

            // Boosts
            const boostA_id = `boost:e2e-updateTermsA-${crypto.randomUUID()}`;
            const boostA_Uri = await a.invoke.createBoost(
                { ...testUnsignedBoost, id: boostA_id },
                {
                    category: 'Achievement',
                    name: 'Boost from A for Update Terms E2E',
                }
            );
            const boostC_id = `boost:e2e-updateTermsC-${crypto.randomUUID()}`;
            const boostC_Uri = await c.invoke.createBoost(
                { ...testUnsignedBoost, id: boostC_id },
                {
                    category: 'Achievement',
                    name: 'Boost from C for Update Terms E2E',
                }
            );

            const contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: `Update Terms Auto Boost Contract E2E ${crypto.randomUUID()}`,
                writers: [USERS.c.profileId],
                autoboosts: [
                    {
                        boostUri: boostA_Uri,
                        signingAuthority: saA_Details,
                    },
                ],
            });
            await c.invoke.addAutoBoostsToContract(contractUri, [
                {
                    boostUri: boostC_Uri,
                    signingAuthority: saC_Details,
                },
            ]);

            // 1. Initial consent by User B (no denied writers)
            const termsUri = await b.invoke.consentToContract(contractUri, {
                terms: normalFullTerms, // No deniedWriters
            });
            let credentialsAfterInitialConsent = await b.invoke.getCredentialsForContract(termsUri);
            expect(credentialsAfterInitialConsent.records).toHaveLength(2);

            // 2. Update terms by User B, denying User C
            await b.invoke.updateContractTerms(termsUri, {
                terms: { ...normalFullTerms, deniedWriters: [USERS.c.profileId] }, // Deny User C
            });

            const credentialsAfterUpdate = await b.invoke.getCredentialsForContract(termsUri);

            // After update, existing credentials for these terms are re-evaluated.
            // Boost from C should be revoked/not re-issued, boost from A remains/re-issued.
            expect(credentialsAfterUpdate.records).toHaveLength(3);
            expect(
                credentialsAfterUpdate.records.filter(cred =>
                    cred.boostUri?.includes(boostA_Uri.split(':').pop()!)
                ).length
            ).toBe(2);
            expect(
                credentialsAfterUpdate.records.filter(cred =>
                    cred.boostUri?.includes(boostC_Uri.split(':').pop()!)
                ).length
            ).toBe(1);
        });
    }); // End of 'Auto-Boosts with Denied Writers'

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

    describe('Contract Writer Permissions', () => {
        it('should allow credential writing by approved writers', async () => {
            const writerContractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Approved Writer Contract',
                writers: [USERS.c.profileId],
            });

            // User B consents to the contract
            const termsUri = await b.invoke.consentToContract(writerContractUri, {
                terms: normalFullTerms,
            });

            // User C (approved writer) issues a boost and credential
            const boostUri = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Approved Writer Boost',
            });

            const credential = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await c.invoke.writeCredentialToContract(
                b.id.did(),
                writerContractUri,
                credential,
                boostUri
            );

            expect(credentialUri).toBeDefined();
            expect(typeof credentialUri).toBe('string');

            // Verify User B can retrieve the credential
            const credentials = await b.invoke.getCredentialsForContract(termsUri);
            expect(credentials.records.length).toBeGreaterThan(0);
            const record = credentials.records[0];
            expect(record.category).toBe('Achievement');
        });

        it('should reject credential writing by non-writers', async () => {
            const contractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'No Writer Contract',
            });

            // User B consents
            await b.invoke.consentToContract(contractUri, { terms: normalFullTerms });

            // User D (not a writer) attempts to write
            const boostUri = await d.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Non-writer Boost',
            });

            const credential = await d.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: d.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                d.invoke.writeCredentialToContract(b.id.did(), contractUri, credential, boostUri)
            ).rejects.toThrow();
        });

        it('should reject credential writing by writers listed in deniedWriters', async () => {
            const deniedContractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Denied Writer Contract',
                writers: [USERS.c.profileId],
            });

            // User B consents and explicitly denies User C
            await b.invoke.consentToContract(deniedContractUri, {
                terms: { ...normalFullTerms, deniedWriters: [USERS.c.profileId] },
            });

            // User C attempts to write
            const boostUri = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Denied Writer Boost',
            });

            const credential = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                c.invoke.writeCredentialToContract(
                    b.id.did(),
                    deniedContractUri,
                    credential,
                    boostUri
                )
            ).rejects.toThrow();
        });

        it('should allow credential writing by multiple approved writers', async () => {
            const multiWriterContractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Multi Writer Contract',
                writers: [USERS.c.profileId, USERS.d.profileId],
            });

            // User B consents to the contract
            const termsUri = await b.invoke.consentToContract(multiWriterContractUri, {
                terms: normalFullTerms,
            });

            /* -------------------- Writer C -------------------- */
            const boostUriC = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Multi Writer Boost C',
            });

            const credentialC = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriC,
            });

            const credentialUriC = await c.invoke.writeCredentialToContract(
                b.id.did(),
                multiWriterContractUri,
                credentialC,
                boostUriC
            );

            expect(credentialUriC).toBeDefined();

            /* -------------------- Writer D -------------------- */
            const boostUriD = await d.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Multi Writer Boost D',
            });

            const credentialD = await d.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: d.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriD,
            });

            const credentialUriD = await d.invoke.writeCredentialToContract(
                b.id.did(),
                multiWriterContractUri,
                credentialD,
                boostUriD
            );

            expect(credentialUriD).toBeDefined();

            // Verify that User B received at least 2 credentials for the contract
            const credentials = await b.invoke.getCredentialsForContract(termsUri);
            expect(credentials.records.length).toBeGreaterThanOrEqual(2);
        });

        it('should reject credential writing by multiple denied writers', async () => {
            const multiDeniedContractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Multi Denied Writer Contract',
                writers: [USERS.c.profileId, USERS.d.profileId],
            });

            // User B consents and denies both writers
            await b.invoke.consentToContract(multiDeniedContractUri, {
                terms: {
                    ...normalFullTerms,
                    deniedWriters: [USERS.c.profileId, USERS.d.profileId],
                },
            });

            /* -------------------- Writer C Attempt -------------------- */
            const boostUriC = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Denied Writer Boost C',
            });

            const credentialC = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriC,
            });

            await expect(
                c.invoke.writeCredentialToContract(
                    b.id.did(),
                    multiDeniedContractUri,
                    credentialC,
                    boostUriC
                )
            ).rejects.toThrow();

            /* -------------------- Writer D Attempt -------------------- */
            const boostUriD = await d.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Denied Writer Boost D',
            });

            const credentialD = await d.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: d.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriD,
            });

            await expect(
                d.invoke.writeCredentialToContract(
                    b.id.did(),
                    multiDeniedContractUri,
                    credentialD,
                    boostUriD
                )
            ).rejects.toThrow();
        });

        it('should enforce deniedWriters after terms are updated', async () => {
            const updateDeniedContractUri = await a.invoke.createContract({
                contract: normalContract,
                name: 'Update Denied Writer Contract',
                writers: [USERS.c.profileId, USERS.d.profileId],
            });

            // User B consents without denied writers
            const termsUri = await b.invoke.consentToContract(updateDeniedContractUri, {
                terms: normalFullTerms,
            });

            /* --------- Writer C initially allowed --------- */
            const initialBoostUri = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Initial Writer Boost C',
            });

            const initialCredential = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: initialBoostUri,
            });

            const initialCredentialUri = await c.invoke.writeCredentialToContract(
                b.id.did(),
                updateDeniedContractUri,
                initialCredential,
                initialBoostUri
            );
            expect(initialCredentialUri).toBeDefined();

            /* --------- Update terms to deny Writer C --------- */
            await b.invoke.updateContractTerms(termsUri, {
                terms: { ...normalFullTerms, deniedWriters: [USERS.c.profileId] },
            });

            // Writer C should now be rejected
            const deniedBoostUri = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Post Deny Boost C',
            });

            const deniedCredential = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: deniedBoostUri,
            });

            await expect(
                c.invoke.writeCredentialToContract(
                    b.id.did(),
                    updateDeniedContractUri,
                    deniedCredential,
                    deniedBoostUri
                )
            ).rejects.toThrow();

            /* --------- Writer D should still be allowed --------- */
            const boostUriD = await d.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Allowed Writer Boost D',
            });

            const credentialD = await d.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: d.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriD,
            });

            const credentialUriD = await d.invoke.writeCredentialToContract(
                b.id.did(),
                updateDeniedContractUri,
                credentialD,
                boostUriD
            );
            expect(credentialUriD).toBeDefined();

            /* --------- Remove denied writers --------- */
            await b.invoke.updateContractTerms(termsUri, {
                terms: { ...normalFullTerms, deniedWriters: [] },
            });

            const boostUriC2 = await c.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
                name: 'Post Undeny Boost C',
            });

            const credentialC2 = await c.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: c.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: b.id.did(),
                },
                boostId: boostUriC2,
            });

            const contracts = await b.invoke.getConsentedContracts();
            const updatedTerms = contracts.records.find(record => record.uri === termsUri);

            const credentialUriC2 = await c.invoke.writeCredentialToContract(
                b.id.did(),
                updateDeniedContractUri,
                credentialC2,
                boostUriC2
            );
            expect(credentialUriC2).toBeDefined();
        });
    });
});
