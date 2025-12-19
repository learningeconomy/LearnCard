import { describe, it, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';

let a: LearnCard;
let b: LearnCard;

const testContract: ConsentFlowContract = {
    read: {
        personal: {},
        credentials: { categories: {} },
        anonymize: false,
    },
    write: {
        personal: {},
        credentials: {
            categories: {
                Achievement: { required: false },
            },
        },
    },
};

const testTerms: ConsentFlowTerms = {
    read: {
        personal: {},
        credentials: { categories: {} },
        anonymize: false,
    },
    write: {
        personal: {},
        credentials: {
            categories: {
                Achievement: true,
            },
        },
    },
};

const setupSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

describe('Send E2E Tests', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');

        await setupSigningAuthority(a, 'ergonomic-sa');
    });

    describe('Basic Boost Sending', () => {
        it('should send a boost with an existing boostUri', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);

            const incoming = await b.invoke.getIncomingCredentials();
            const received = incoming.find((c: { uri: string }) => c.uri === result.credentialUri);
            expect(received).toBeDefined();
        });

        it('should send a boost by creating a new boost', async () => {
            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                template: {
                    credential: testUnsignedBoost,
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBeDefined();

            const boost = await a.invoke.getBoost(result.uri);
            expect(boost).toBeDefined();
        });

        it('should send a boost using did instead of profileId', async () => {
            const bProfile = await b.invoke.getProfile();
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: bProfile!.did,
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Contract Integration', () => {
        it('should send boost through contract when recipient has consented', async () => {
            const contractUri = await a.invoke.createContract({
                contract: testContract,
                name: `Ergonomic Test Contract ${Date.now()}`,
                writers: [USERS.a.profileId],
            });

            await b.invoke.consentToContract(contractUri, { terms: testTerms });

            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                category: 'Achievement',
            });

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                contractUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should fall back to normal send when recipient has not consented', async () => {
            const contractUri = await a.invoke.createContract({
                contract: testContract,
                name: `Ergonomic No Consent Contract ${Date.now()}`,
                writers: [USERS.a.profileId],
            });

            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                contractUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should create a new boost and link it to the contract', async () => {
            const contractUri = await a.invoke.createContract({
                contract: testContract,
                name: `Ergonomic New Boost Contract ${Date.now()}`,
                writers: [USERS.a.profileId],
            });

            await b.invoke.consentToContract(contractUri, { terms: testTerms });

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                contractUri,
                template: {
                    credential: testUnsignedBoost,
                    category: 'Achievement',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBeDefined();

            const newBoost = await a.invoke.getBoost(result.uri);
            expect(newBoost).toBeDefined();
        });

        it('should fall back when caller is not an authorized writer', async () => {
            const contractUri = await a.invoke.createContract({
                contract: testContract,
                name: `Ergonomic No Writer Contract ${Date.now()}`,
            });

            await b.invoke.consentToContract(contractUri, { terms: testTerms });

            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                contractUri,
            });

            expect(result.credentialUri).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should reject if boost does not exist', async () => {
            await expect(
                a.invoke.send({
                    type: 'boost',
                    recipient: USERS.b.profileId,
                    templateUri: 'urn:lc:boost:nonexistent',
                })
            ).rejects.toThrow();
        });

        it('should reject if target profile does not exist', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            await expect(
                a.invoke.send({
                    type: 'boost',
                    recipient: 'nonexistent-profile-id',
                    templateUri: boostUri,
                })
            ).rejects.toThrow();
        });

        it('should reject if contract does not exist', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            await expect(
                a.invoke.send({
                    type: 'boost',
                    recipient: USERS.b.profileId,
                    templateUri: boostUri,
                    contractUri: 'urn:lc:contract:nonexistent',
                })
            ).rejects.toThrow();
        });

        it('should reject sending a draft boost', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                status: 'DRAFT',
            });

            await expect(
                a.invoke.send({
                    type: 'boost',
                    recipient: USERS.b.profileId,
                    templateUri: boostUri,
                })
            ).rejects.toThrow();
        });
    });
});
