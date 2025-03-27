import { describe, it, expect } from 'vitest';
import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

import { minimalContract, normalFullTerms, normalContract } from './helpers/contract.helpers';
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
});
