import { vi, describe, beforeAll, beforeEach, afterEach, it, expect } from 'vitest';
import {
    promiscuousTerms,
    minimalContract,
    minimalTerms,
    noTerms,
    predatoryContract,
    normalContract,
    normalFullTerms,
    normalAchievementOnlyTerms,
    normalIDOnlyTerms,
    normalNoTerms,
} from './helpers/contract';
import { getClient, getUser } from './helpers/getClient';
import {
    Profile,
    ConsentFlowContract,
    ConsentFlowTransaction,
    ConsentFlowTerms,
    Boost,
    Credential,
    SigningAuthority,
} from '@models';
import { testUnsignedBoost } from './helpers/send';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let userD: Awaited<ReturnType<typeof getUser>>;

describe('Consent Flow Contracts', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        userD = await getUser('d'.repeat(64));
    });

    describe('createConsentFlowContract', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a contract without full auth', async () => {
            await expect(
                noAuthClient.contracts.createConsentFlowContract({
                    contract: minimalContract,
                    name: 'a',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.createConsentFlowContract({
                    contract: minimalContract,
                    name: 'a',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a contract', async () => {
            await expect(
                userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: minimalContract,
                    name: 'a',
                })
            ).resolves.not.toThrow();
        });

        it('should allow creating a contract with an auto-boost', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost first
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto Boost Test',
            });

            // Create a contract with a single auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Auto Boost Contract',
                autoboosts: [
                    {
                        boostUri,
                        signingAuthority,
                    },
                ],
            });

            expect(contractUri).toBeDefined();

            // Verify the contract was created
            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract).toBeDefined();
            expect(contract.name).toEqual('Auto Boost Contract');
        });

        it('should become resolveable after creation', async () => {
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });

            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            const contract = await userA.clients.fullAuth.storage.resolve({
                uri: contracts.records[0]?.uri ?? '',
            });

            expect(contract).toEqual(minimalContract);
        });

        it('should allow setting and retrieving the name and subtitle fields for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                subtitle: 'A brief description',
                contract: minimalContract,
            };

            // Simulating contract creation
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            // Fetching the created contract
            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            // Verifying the name and subtitle fields
            expect(contract.name).toEqual(contractData.name);
            expect(contract.subtitle).toEqual(contractData.subtitle);
        });

        it('should allow setting and retrieving the description field for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                description: 'This is for testing lol',
                contract: minimalContract,
            };

            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract.description).toEqual(contractData.description);
        });

        it('should allow setting and retrieving the needsGuardianConsent flag for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                description: 'This is for testing lol',
                needsGuardianConsent: true,
                contract: minimalContract,
            };

            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract.needsGuardianConsent).toEqual(contractData.needsGuardianConsent);
        });

        it('should allow setting and retrieving the redirectUrl field for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                description: 'This is for testing lol',
                redirectUrl: 'https://redirectMe.com',
                contract: minimalContract,
            };

            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract.redirectUrl).toEqual(contractData.redirectUrl);
        });

        it('should allow setting and retrieving the frontDoorBoostUri field for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                description: 'This is for testing lol',
                frontDoorBoostUri: 'abc123',
                contract: minimalContract,
            };

            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract.frontDoorBoostUri).toEqual(contractData.frontDoorBoostUri);
        });

        it('should allow setting and retrieving the reason for accessing for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                reasonForAccessing: 'This is for testing lol',
                contract: minimalContract,
            };

            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            expect(contract.reasonForAccessing).toEqual(contractData.reasonForAccessing);
        });

        it('should allow setting and retrieving the image field for a contract', async () => {
            const contractData = {
                name: 'Test Contract',
                image: 'https://example.com/image.png',
                contract: minimalContract,
            };

            // Simulating contract creation
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                contractData
            );

            // Fetching the created contract
            const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                uri: contractUri,
            });

            // Verifying the image field
            expect(contract.image).toEqual(contractData.image);
        });
    });

    describe('getConsentFlowContracts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
        });

        it('should not allow you to get contracts without full auth', async () => {
            await expect(noAuthClient.contracts.getConsentFlowContracts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.getConsentFlowContracts()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to get contracts', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getConsentFlowContracts()
            ).resolves.not.toThrow();

            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(contracts.records).toHaveLength(0);

            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract).toEqual(minimalContract);
        });

        it("should not return other user's contracts", async () => {
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });

            const userAContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userAContracts.records).toHaveLength(1);
            expect(userAContracts.records[0]!.contract).toEqual(minimalContract);

            const userBContracts = await userB.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userBContracts.records).toHaveLength(0);
        });

        it('should allow you to query for certain contracts', async () => {
            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(contracts.records).toHaveLength(0);

            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: predatoryContract,
                name: 'b',
            });

            const allContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();
            expect(allContracts.records).toHaveLength(2);

            const filteredContracts =
                await userA.clients.fullAuth.contracts.getConsentFlowContracts({
                    query: { read: { personal: { email: { required: true } } } },
                });
            expect(filteredContracts.records).toHaveLength(1);
            expect(filteredContracts.records[0]!.contract).toEqual(predatoryContract);
        });

        it('should paginate', async () => {
            for (let index = 0; index < 10; index += 1) {
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: minimalContract,
                    name: `a${index}`,
                });
            }

            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts({
                limit: 20,
            });

            expect(contracts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.contracts.getConsentFlowContracts({
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.contracts.getConsentFlowContracts({
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(contracts.records);
        });

        it('should include auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Auto Boost Contract',
                autoboosts: [{ boostUri, signingAuthority }],
            });

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract).toEqual(minimalContract);
            expect(newContracts.records[0]!.autoBoosts).toBeTruthy();
            expect(newContracts.records[0]!.autoBoosts).toHaveLength(1);
            expect(newContracts.records[0]!.autoBoosts![0]).toEqual(boostUri);
        });

        it('should include all auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri1 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });
            const boostUri2 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });
            const boostUri3 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Auto Boost Contract',
                autoboosts: [
                    { boostUri: boostUri1, signingAuthority },
                    { boostUri: boostUri2, signingAuthority },
                    { boostUri: boostUri3, signingAuthority },
                ],
            });

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract).toEqual(minimalContract);
            expect(newContracts.records[0]!.autoBoosts).toBeTruthy();
            expect(newContracts.records[0]!.autoBoosts).toHaveLength(3);
            expect(
                [boostUri1, boostUri2, boostUri3].every(uri =>
                    newContracts.records[0]!.autoBoosts!.includes(uri)
                )
            ).toBeTruthy();
        });
    });

    describe('deleteConsentFlowContract', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
        });

        it('should not allow you to delete contracts without full auth', async () => {
            await expect(
                noAuthClient.contracts.deleteConsentFlowContract({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.deleteConsentFlowContract({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to delete contracts', async () => {
            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(contracts.records).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.contracts.deleteConsentFlowContract({ uri })
            ).resolves.not.toThrow();

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts.records).toHaveLength(0);
        });

        it('should remove contract from profiles that have consented to it', async () => {
            await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri: uri,
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(contracts.records).toHaveLength(1);

            await userA.clients.fullAuth.contracts.deleteConsentFlowContract({ uri });

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(0);
        });
    });

    describe('getConsentedDataForContract', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'a',
            });
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: uri,
                terms: normalFullTerms,
            });

            await Promise.all(
                Array(12)
                    .fill(0)
                    .map(async (_, index) => {
                        const client = getClient({
                            did: `did:test:${index + 1}`,
                            isChallengeValid: true,
                            scope: '*:*',
                        });
                        await client.profile.createProfile({
                            profileId: `user${index}`,
                        });

                        let terms = normalFullTerms;
                        if (index % 4 === 0) terms = normalAchievementOnlyTerms;
                        else if (index % 4 === 1) terms = normalIDOnlyTerms;
                        else if (index % 4 === 2) terms = normalNoTerms;

                        await client.contracts.consentToContract({
                            contractUri: uri,
                            terms,
                        });
                    })
            );
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to get data without full auth', async () => {
            await expect(
                noAuthClient.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to get data for contracts you own', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            ).resolves.not.toThrow();

            const data = await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                uri,
            });

            expect(data.records).toHaveLength(13);
        });

        it("should not allow you to get data for someone else's contracts", async () => {
            await expect(
                userB.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        describe('should allow you to query the data', () => {
            it('should get all data with empty query', async () => {
                const allData = await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                    uri,
                });

                expect(allData.records).toHaveLength(13);
            });

            it('should allow inclusive queries', async () => {
                const achievementsData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { Achievement: true } } },
                    });

                expect(achievementsData.records).toHaveLength(7);
                expect(
                    achievementsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();

                const idsData = await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                    uri,
                    query: { credentials: { categories: { ID: true } } },
                });

                expect(idsData.records).toHaveLength(7);
                expect(
                    idsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining inclusive queries', async () => {
                const achievementsAndIdsData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { Achievement: true, ID: true } } },
                    });

                expect(achievementsAndIdsData.records).toHaveLength(4);
                expect(
                    achievementsAndIdsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    achievementsAndIdsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
            });

            it('should allow exclusive queries', async () => {
                const noAchievementsData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { Achievement: false } } },
                    });

                expect(noAchievementsData.records).toHaveLength(6);
                expect(
                    noAchievementsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();

                const noIdsData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { ID: false } } },
                    });

                expect(noIdsData.records).toHaveLength(6);
                expect(
                    noIdsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining exclusive queries', async () => {
                const noData = await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                    uri,
                    query: { credentials: { categories: { ID: false, Achievement: false } } },
                });

                expect(noData.records).toHaveLength(3);
                expect(
                    noData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();
                expect(
                    noData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining inclusive/exclusive queries', async () => {
                const achievementsOnlyData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { ID: false, Achievement: true } } },
                    });

                expect(achievementsOnlyData.records).toHaveLength(3);
                expect(
                    achievementsOnlyData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    achievementsOnlyData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();

                const idsOnlyData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                        query: { credentials: { categories: { ID: true, Achievement: false } } },
                    });

                expect(idsOnlyData.records).toHaveLength(3);
                expect(
                    idsOnlyData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    idsOnlyData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });
        });
    });

    describe('getConsentedDataForDid', () => {
        let contractUri: string;
        let userBDid: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const userBProfile = await userB.clients.fullAuth.profile.getProfile();
            userBDid = userBProfile!.did;

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Test Contract',
            });

            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });

            await userC.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalAchievementOnlyTerms,
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to get data without full auth', async () => {
            await expect(
                noAuthClient.contracts.getConsentedDataForDid({ did: userBDid })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });

            await expect(
                userA.clients.partialAuth.contracts.getConsentedDataForDid({ did: userBDid })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow fetching consented data for a specific did', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getConsentedDataForDid({ did: userBDid })
            ).resolves.not.toThrow();

            const data = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                did: userBDid,
            });

            expect(data.records).toHaveLength(1);
            expect(data.records[0]?.credentials).toHaveLength(4);
            expect(data.records[0]?.personal).toEqual(normalFullTerms.read.personal);
            expect(data.records[0]?.contractUri).toEqual(contractUri);
        });

        it('should error for non-existent did', async () => {
            const nonExistentDid = 'did:test:nonexistent';

            await expect(
                userA.clients.fullAuth.contracts.getConsentedDataForDid({ did: nonExistentDid })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should allow pagination', async () => {
            const additionalContracts = await Promise.all(
                Array(5)
                    .fill(0)
                    .map(async (_, index) =>
                        userA.clients.fullAuth.contracts.createConsentFlowContract({
                            contract: normalContract,
                            name: `Pagination Test Contract ${index}`,
                        })
                    )
            );

            for (const contractUri of additionalContracts) {
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalFullTerms,
                });
            }

            const firstPage = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                did: userBDid,
                limit: 3,
            });

            expect(firstPage.records).toHaveLength(3);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                did: userBDid,
                limit: 3,
                cursor: firstPage.cursor,
            });

            expect(secondPage.records).toHaveLength(3);
            expect(secondPage.hasMore).toBeFalsy();

            const allData = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                did: userBDid,
                limit: 10,
            });

            expect(allData.records).toHaveLength(6);
            expect([...firstPage.records, ...secondPage.records]).toEqual(allData.records);
        });

        describe('query filtering', () => {
            beforeEach(async () => {
                await ConsentFlowContract.delete({ detach: true, where: {} });
                await ConsentFlowTerms.delete({ detach: true, where: {} });

                contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Query Test Contract',
                });

                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalFullTerms,
                });

                const idOnlyContractUri =
                    await userA.clients.fullAuth.contracts.createConsentFlowContract({
                        contract: normalContract,
                        name: 'ID Only Contract',
                    });

                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: idOnlyContractUri,
                    terms: normalIDOnlyTerms,
                });

                const achievementOnlyContractUri =
                    await userA.clients.fullAuth.contracts.createConsentFlowContract({
                        contract: normalContract,
                        name: 'Achievement Only Contract',
                    });

                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: achievementOnlyContractUri,
                    terms: normalAchievementOnlyTerms,
                });
            });

            it('should allow filtering by credential categories', async () => {
                const idData = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                    did: userBDid,
                    query: { credentials: { categories: { ID: true } } },
                });

                expect(idData.records.length).toEqual(2);
                expect(
                    idData.records.every(record =>
                        record.credentials.every(cred => cred.category === 'ID')
                    )
                ).toBeTruthy();

                const achievementData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                        did: userBDid,
                        query: { credentials: { categories: { Achievement: true } } },
                    });

                expect(achievementData.records.length).toEqual(2);
                expect(
                    achievementData.records.every(record =>
                        record.credentials.every(cred => cred.category === 'Achievement')
                    )
                ).toBeTruthy();
            });

            it('should allow filtering by combined credential categories', async () => {
                const combinedData = await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                    did: userBDid,
                    query: { credentials: { categories: { ID: true, Achievement: true } } },
                });

                // Should only return the data from the contract with full terms
                expect(combinedData.records.length).toBe(1);
            });

            it('should allow negation filters for credential categories', async () => {
                const noAchievementData =
                    await userA.clients.fullAuth.contracts.getConsentedDataForDid({
                        did: userBDid,
                        query: { credentials: { categories: { Achievement: false } } },
                    });

                // Should include ID-only contract
                expect(noAchievementData.records.length).toEqual(1);
                expect(
                    noAchievementData.records.every(
                        record => !record.credentials.some(cred => cred.category === 'Achievement')
                    )
                ).toBeTruthy();
            });
        });
    });

    describe('getConsentedData', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'a',
            });
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: uri,
                terms: normalFullTerms,
            });

            await Promise.all(
                Array(12)
                    .fill(0)
                    .map(async (_, index) => {
                        const client = await getClient({
                            did: `did:test:${index + 1}`,
                            isChallengeValid: true,
                            scope: '*:*',
                        });
                        await client.profile.createProfile({
                            profileId: `user${index}`,
                        });

                        let terms = normalFullTerms;
                        if (index % 4 === 0) terms = normalAchievementOnlyTerms;
                        else if (index % 4 === 1) terms = normalIDOnlyTerms;
                        else if (index % 4 === 2) terms = normalNoTerms;

                        await client.contracts.consentToContract({
                            contractUri: uri,
                            terms,
                        });
                    })
            );
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to get data without full auth', async () => {
            await expect(noAuthClient.contracts.getConsentedData()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.getConsentedData()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to get data for contracts you own', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getConsentedData()
            ).resolves.not.toThrow();

            const data = await userA.clients.fullAuth.contracts.getConsentedData();

            expect(data.records).toHaveLength(13);
        });

        it("should not get data for someone else's contracts", async () => {
            const data = await userB.clients.fullAuth.contracts.getConsentedData();

            expect(data.records).toHaveLength(0);
        });

        describe('should allow you to query the data', () => {
            it('should get all data with empty query', async () => {
                const allData = await userA.clients.fullAuth.contracts.getConsentedData();

                expect(allData.records).toHaveLength(13);
            });

            it('should allow inclusive queries', async () => {
                const achievementsData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { Achievement: true } } },
                });

                expect(achievementsData.records).toHaveLength(7);
                expect(
                    achievementsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();

                const idsData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { ID: true } } },
                });

                expect(idsData.records).toHaveLength(7);
                expect(
                    idsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining inclusive queries', async () => {
                const achievementsAndIdsData =
                    await userA.clients.fullAuth.contracts.getConsentedData({
                        query: { credentials: { categories: { Achievement: true, ID: true } } },
                    });

                expect(achievementsAndIdsData.records).toHaveLength(4);
                expect(
                    achievementsAndIdsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    achievementsAndIdsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
            });

            it('should allow exclusive queries', async () => {
                const noAchievementsData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { Achievement: false } } },
                });

                expect(noAchievementsData.records).toHaveLength(6);
                expect(
                    noAchievementsData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();

                const noIdsData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { ID: false } } },
                });

                expect(noIdsData.records).toHaveLength(6);
                expect(
                    noIdsData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining exclusive queries', async () => {
                const noData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { ID: false, Achievement: false } } },
                });

                expect(noData.records).toHaveLength(3);
                expect(
                    noData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();
                expect(
                    noData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });

            it('should allow combining inclusive/exclusive queries', async () => {
                const achievementsOnlyData =
                    await userA.clients.fullAuth.contracts.getConsentedData({
                        query: { credentials: { categories: { ID: false, Achievement: true } } },
                    });

                expect(achievementsOnlyData.records).toHaveLength(3);
                expect(
                    achievementsOnlyData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    achievementsOnlyData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) === 0
                    )
                ).toBeTruthy();

                const idsOnlyData = await userA.clients.fullAuth.contracts.getConsentedData({
                    query: { credentials: { categories: { ID: true, Achievement: false } } },
                });

                expect(idsOnlyData.records).toHaveLength(3);
                expect(
                    idsOnlyData.records.every(
                        record => (record.credentials.categories.ID?.length ?? 0) > 0
                    )
                ).toBeTruthy();
                expect(
                    idsOnlyData.records.every(
                        record => (record.credentials.categories.Achievement?.length ?? 0) === 0
                    )
                ).toBeTruthy();
            });
        });
    });

    describe('consentToContract', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow you to consent to contracts without full auth', async () => {
            await expect(
                noAuthClient.contracts.consentToContract({ terms: minimalTerms, contractUri: uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.contracts.consentToContract({
                    terms: minimalTerms,
                    contractUri: uri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to consent to contracts', async () => {
            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: minimalTerms,
                    contractUri: uri,
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to consent to contracts with overly promicuous terms', async () => {
            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: promiscuousTerms,
                    contractUri: uri,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('should not allow you to consent to contracts without meeting the minimum requirements', async () => {
            const predatoryUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: predatoryContract,
                name: 'b',
            });

            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: minimalTerms,
                    contractUri: predatoryUri,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: promiscuousTerms,
                    contractUri: predatoryUri,
                })
            ).resolves.not.toThrow();
        });

        it("should not allow you to consent to contracts that you've already consented to", async () => {
            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: minimalTerms,
                    contractUri: uri,
                })
            ).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    terms: minimalTerms,
                    contractUri: uri,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('should auto-issue boosts when consenting to a contract with auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Auto Boost Contract',
                autoboosts: [
                    {
                        boostUri,
                        signingAuthority,
                    },
                ],
            });

            // Consent to the contract
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });

            // Check that a credential was automatically issued
            const result = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            // Should have one auto-issued credential
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.boostUri).toContain(boostUri.split(':').pop());

            // Check that the transaction history includes an auto-boost transaction
            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            // Should have at least 2 transactions (consent + auto-boost)
            expect(transactions.records.length).toBeGreaterThanOrEqual(2);

            // At least one transaction should be an auto-boost transaction
            const hasAutoBoostTx = transactions.records.some(tx => tx.action === 'write');
            expect(hasAutoBoostTx).toBeTruthy();
        });

        it('should auto-issue boosts when reconsenting to a contract with auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost for Reconsent',
            });

            // Create a contract without auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Contract for Reconsent Test',
            });

            // Consent to the contract
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });

            // Add auto-boost to the contract
            await userA.clients.fullAuth.contracts.deleteConsentFlowContract({ uri: contractUri });

            const newContractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: normalContract,
                    name: 'Contract for Reconsent Test',
                    autoboosts: [
                        {
                            boostUri,
                            signingAuthority,
                        },
                    ],
                }
            );

            // Reconsent to the contract
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: newContractUri,
                terms: normalFullTerms,
            });

            // Check the credentials for the new terms
            const consentedContracts =
                await userB.clients.fullAuth.contracts.getConsentedContracts();
            const newTermsUri = consentedContracts.records.find(
                r => r.contract.uri === newContractUri
            )?.uri;

            // Should have a new terms URI
            expect(newTermsUri).toBeDefined();

            if (newTermsUri) {
                const result = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri: newTermsUri,
                });

                // Should have one auto-issued credential
                expect(result.records).toHaveLength(1);
                expect(result.records[0]?.boostUri).toContain(boostUri.split(':').pop());
            }
        });

        it('should auto-issue boosts when updating terms for a contract with auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost for Update',
            });

            // Create a contract with auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Contract for Update Test',
                autoboosts: [{ boostUri, signingAuthority }],
            });

            // Consent to the contract
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });

            // Initial credentials
            const initialResult = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            const initialCount = initialResult.records.length;

            // Update the terms
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: {
                    ...normalFullTerms,
                    read: {
                        ...normalFullTerms.read,
                        personal: { name: 'Updated Name' },
                    },
                },
            });

            // Check that another credential was automatically issued
            const updatedResult = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            // Should have one more credential than before
            expect(updatedResult.records.length).toBeGreaterThan(initialCount);

            // The latest credential should be from the same boost
            expect(updatedResult.records[0]?.boostUri).toContain(boostUri.split(':').pop());

            // Check transaction history
            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            // Should have at least 3 transactions now (consent + auto-boost + update + auto-boost)
            expect(transactions.records.length).toBeGreaterThanOrEqual(4);

            // Should have at least two auto-boost transactions
            const autoBoostTxCount = transactions.records.filter(
                tx => tx.action === 'write'
            ).length;
            expect(autoBoostTxCount).toBeGreaterThanOrEqual(2);
        });

        it('should support multiple auto-boosts per contract', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create multiple boosts
            const boostUri1 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Multi-Boost Test 1',
            });

            const boostUri2 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'ID',
                name: 'Multi-Boost Test 2',
            });

            const boostUri3 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Multi-Boost Test 3',
            });

            // Create a contract with multiple auto-boosts
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Multi-AutoBoost Contract',
                autoboosts: [
                    { boostUri: boostUri1, signingAuthority },
                    { boostUri: boostUri2, signingAuthority },
                    { boostUri: boostUri3, signingAuthority },
                ],
            });

            // Consent to the contract
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });

            // Check that the credentials were automatically issued
            const result = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            // Should have three auto-issued credentials
            expect(result.records).toHaveLength(3);

            // Each boost should be represented in the credentials
            const boostIds = [boostUri1, boostUri2, boostUri3].map(uri => uri.split(':').pop());
            const credentialBoostIds = result.records.map(record => {
                const parts = record.boostUri.split(':');
                return parts[parts.length - 1];
            });

            for (const boostId of boostIds) {
                expect(credentialBoostIds).toContain(boostId);
            }

            // Check transaction history
            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            // Should have at least 4 transactions (1 consent + 3 auto-boosts)
            expect(transactions.records.length).toBeGreaterThanOrEqual(4);

            // Should have at least three auto-boost transactions
            const autoBoostTxCount = transactions.records.filter(
                tx => tx.action === 'write'
            ).length;
            expect(autoBoostTxCount).toBeGreaterThanOrEqual(3);
        });

        it('should allow specifying denied writers (profile IDs) during initial consent', async () => {
            const testContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Contract with Denied Writers',
                    writers: ['userc'],
                });

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: testContractUri,
                terms: { ...normalFullTerms, deniedWriters: ['userc'] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual(['userc']);
        });

        it('should allow specifying denied writers (DIDs) during initial consent and convert them', async () => {
            const testContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Contract with Denied Writers',
                    writers: ['userc'],
                });

            const userCDid = userC.learnCard.id.did();

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: testContractUri,
                terms: { ...normalFullTerms, deniedWriters: [userCDid] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual(['userc']);
        });

        it('should not allow specifying invalid denied writers during initial consent', async () => {
            const testContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Contract with Denied Writers',
                    writers: ['userc'],
                });

            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: testContractUri,
                    terms: { ...normalFullTerms, deniedWriters: ['nonexistent'] },
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });

            await expect(
                userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: testContractUri,
                    terms: { ...normalFullTerms, deniedWriters: ['userd'] },
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('should allow specifying denied writers during reconsent', async () => {
            const testContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Reconsent Denied Writers',
                    writers: ['userc'],
                });

            // Initial consent without denied writers
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: testContractUri,
                terms: normalIDOnlyTerms,
            });

            // Reconsent with denied writers
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: { ...normalFullTerms, deniedWriters: ['userc'] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual(['userc']);
        });

        it('should not auto-issue boosts from denied writers', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            await userC.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa2 = await userC.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority2 = {
                endpoint: sa2!.signingAuthority.endpoint,
                name: sa2!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            const boostUri2 = await userC.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Auto Boost Contract',
                writers: ['userc'],
                autoboosts: [{ boostUri, signingAuthority }],
            });

            await userC.clients.fullAuth.contracts.addAutoBoostsToContract({
                contractUri,
                autoboosts: [{ boostUri: boostUri2, signingAuthority: signingAuthority2 }],
            });

            // Consent to the contract
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: { ...normalFullTerms, deniedWriters: ['userc'] },
            });

            // Check that a credential was automatically issued
            const result = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            // Should have one auto-issued credential
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.boostUri).toContain(boostUri.split(':').pop());

            // Check that the transaction history includes an auto-boost transaction
            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            // Should have at least 2 transactions (consent + auto-boost)
            expect(transactions.records.length).toBeGreaterThanOrEqual(2);

            // At least one transaction should be an auto-boost transaction
            const hasAutoBoostTx = transactions.records.some(tx => tx.action === 'write');
            expect(hasAutoBoostTx).toBeTruthy();
        });

        it('should handle re-consenting to a contract, filtering auto-issued boosts based on new deniedWriters', async () => {
            // Setup: userA (owner) and userC (writer) can issue boosts
            // User A's SA
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api/reconsent-sa-a',
                name: 'reconsent-sa-a',
                did: userA.learnCard.id.did(),
            });
            const saA_Details = (await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api/reconsent-sa-a',
                name: 'reconsent-sa-a',
            }))!;

            // User C's SA
            await userC.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api/reconsent-sa-c',
                name: 'reconsent-sa-c',
                did: userC.learnCard.id.did(),
            });
            const saC_Details = (await userC.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api/reconsent-sa-c',
                name: 'reconsent-sa-c',
            }))!;

            // Boosts
            const boostA_Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:reconsentA' },
                category: 'Achievement',
                name: 'Boost from A for Reconsent',
            });
            const boostC_Uri = await userC.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:reconsentC' },
                category: 'Achievement',
                name: 'Boost from C for Reconsent',
            });

            // Contract by userA, userC is a writer
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Reconsent Auto Boost Contract',
                writers: ['userc'],
                autoboosts: [
                    {
                        boostUri: boostA_Uri,
                        signingAuthority: {
                            endpoint: saA_Details.signingAuthority.endpoint,
                            name: saA_Details.relationship.name,
                        },
                    },
                ],
            });
            await userC.clients.fullAuth.contracts.addAutoBoostsToContract({
                contractUri,
                autoboosts: [
                    {
                        boostUri: boostC_Uri,
                        signingAuthority: {
                            endpoint: saC_Details.signingAuthority.endpoint,
                            name: saC_Details.relationship.name,
                        },
                    },
                ],
            });

            // 1. Initial consent by userB (no denied writers)
            const { termsUri: initialTermsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalFullTerms, // No deniedWriters
                });
            let credentialsAfterInitialConsent =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri: initialTermsUri,
                });
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

            await userB.clients.fullAuth.contracts.withdrawConsent({ uri: initialTermsUri });

            // 2. Re-consent by userB, denying userC
            const { termsUri: reconsentTermsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri, // Re-consenting to the same contract
                    terms: { ...normalFullTerms, deniedWriters: ['userc'] }, // Deny userC
                });

            // Check credentials for the new (re-consented) terms
            const credentialsAfterReconsent =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri: reconsentTermsUri,
                });

            // Should now only have the boost from userA
            expect(credentialsAfterReconsent.records).toHaveLength(3);
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
            // Setup: userA (owner) and userC (writer) can issue boosts
            // User A's SA
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api/update-terms-sa-a',
                name: 'sa-a',
                did: userA.learnCard.id.did(),
            });
            const saA_Details = (await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api/update-terms-sa-a',
                name: 'sa-a',
            }))!;

            // User C's SA
            await userC.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api/update-terms-sa-c',
                name: 'sa-c',
                did: userC.learnCard.id.did(),
            });
            const saC_Details = (await userC.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api/update-terms-sa-c',
                name: 'sa-c',
            }))!;

            // Boosts
            const boostA_Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:updateTermsA' },
                category: 'Achievement',
                name: 'Boost from A for Update Terms',
            });
            const boostC_Uri = await userC.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:updateTermsC' },
                category: 'Achievement',
                name: 'Boost from C for Update Terms',
            });

            // Contract by userA, userC is a writer
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Update Terms Auto Boost Contract',
                writers: ['userc'],
                autoboosts: [
                    {
                        boostUri: boostA_Uri,
                        signingAuthority: {
                            endpoint: saA_Details.signingAuthority.endpoint,
                            name: saA_Details.relationship.name,
                        },
                    },
                ],
            });
            await userC.clients.fullAuth.contracts.addAutoBoostsToContract({
                contractUri,
                autoboosts: [
                    {
                        boostUri: boostC_Uri,
                        signingAuthority: {
                            endpoint: saC_Details.signingAuthority.endpoint,
                            name: saC_Details.relationship.name,
                        },
                    },
                ],
            });

            // 1. Initial consent by userB (no denied writers)
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms, // No deniedWriters
            });
            let credentialsAfterInitialConsent =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({ termsUri });
            // Should have boosts from both A and C
            expect(credentialsAfterInitialConsent.records).toHaveLength(2);

            // 2. Update terms by userB, denying userC
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri, // Updating the original terms
                terms: { ...normalFullTerms, deniedWriters: [userC.learnCard.id.did()] }, // Deny userC
            });

            // Check credentials for the updated terms
            // Assuming updateTerms re-evaluates auto-boosts based on the new terms.
            const credentialsAfterUpdate =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                });

            // Should now only have the boost from userA
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
    });

    describe('getConsentedContracts', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to get contracts without full auth', async () => {
            await expect(noAuthClient.contracts.getConsentedContracts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.contracts.getConsentedContracts()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it("should allow you to get contracts you've consented to", async () => {
            await expect(
                userB.clients.fullAuth.contracts.getConsentedContracts()
            ).resolves.not.toThrow();

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(contracts.records).toHaveLength(0);

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri: uri,
            });

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.uri).toEqual(termsUri);
            expect(newContracts.records[0]!.contract.owner.did).toEqual(
                (await userA.clients.fullAuth.profile.getProfile())?.did
            );
            expect(newContracts.records[0]!.terms).toEqual(minimalTerms);
        });

        it("should not return other user's contracts", async () => {
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri: uri,
            });

            const userAContracts = await userA.clients.fullAuth.contracts.getConsentedContracts();

            expect(userAContracts.records).toHaveLength(0);

            const userBContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(userBContracts.records).toHaveLength(1);
            expect(userBContracts.records[0]!.uri).toEqual(termsUri);
        });

        it('should allow you to query for certain contracts', async () => {
            const predatoryContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: predatoryContract,
                    name: 'b',
                });

            await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri: uri,
            });

            await userB.clients.fullAuth.contracts.consentToContract({
                terms: promiscuousTerms,
                contractUri: predatoryContractUri,
            });

            const allContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            expect(allContracts.records).toHaveLength(2);

            const filteredContracts = await userB.clients.fullAuth.contracts.getConsentedContracts({
                query: { read: { personal: { email: promiscuousTerms.read.personal.email! } } },
            });
            expect(filteredContracts.records).toHaveLength(1);
            expect(filteredContracts.records[0]!.contract.contract).toEqual(predatoryContract);
        });

        it('should paginate', async () => {
            const uris = await Promise.all(
                Array(10)
                    .fill(0)
                    .map(async (_, index) =>
                        userA.clients.fullAuth.contracts.createConsentFlowContract({
                            contract: minimalContract,
                            name: `a${index}`,
                        })
                    )
            );

            for (let contractUri of uris) {
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: minimalTerms,
                });
            }

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts({
                limit: 20,
            });

            expect(contracts.records).toHaveLength(10);

            const firstPage = await userB.clients.fullAuth.contracts.getConsentedContracts({
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userB.clients.fullAuth.contracts.getConsentedContracts({
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(contracts.records);
        });

        it('should include auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Auto Boost Contract',
                autoboosts: [{ boostUri, signingAuthority }],
            });

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri,
            });

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract.contract).toEqual(minimalContract);
            expect(newContracts.records[0]!.contract.autoBoosts).toBeTruthy();
            expect(newContracts.records[0]!.contract.autoBoosts).toHaveLength(1);
            expect(newContracts.records[0]!.contract.autoBoosts![0]).toEqual(boostUri);
        });

        it('should include all auto-boosts', async () => {
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });

            const signingAuthority = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            // Create a boost
            const boostUri1 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });
            const boostUri2 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });
            const boostUri3 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            // Create a contract with the auto-boost
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Auto Boost Contract',
                autoboosts: [
                    { boostUri: boostUri1, signingAuthority },
                    { boostUri: boostUri2, signingAuthority },
                    { boostUri: boostUri3, signingAuthority },
                ],
            });

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri,
            });

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract.contract).toEqual(minimalContract);
            expect(newContracts.records[0]!.contract.autoBoosts).toBeTruthy();
            expect(newContracts.records[0]!.contract.autoBoosts).toHaveLength(3);
            expect(
                [boostUri1, boostUri2, boostUri3].every(uri =>
                    newContracts.records[0]!.contract.autoBoosts!.includes(uri)
                )
            ).toBeTruthy();
        });
    });

    describe('updateConsentedContractTerms', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
            await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
                writers: ['userc', 'userd'],
            });
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: minimalTerms,
                });
            termsUri = _termsUri;
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
        });

        it('should not allow you to update terms without full auth', async () => {
            await expect(
                noAuthClient.contracts.updateConsentedContractTerms({
                    terms: noTerms,
                    uri: termsUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.contracts.updateConsentedContractTerms({
                    terms: noTerms,
                    uri: termsUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to update terms', async () => {
            await expect(
                userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                    terms: noTerms,
                    uri: termsUri,
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to terms with overly promicuous terms', async () => {
            await expect(
                userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                    terms: promiscuousTerms,
                    uri: termsUri,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('should not allow you to update terms without meeting the minimum requirements', async () => {
            const predatoryContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: predatoryContract,
                    name: 'b',
                });

            const { termsUri: promiscuousTermsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: predatoryContractUri,
                    terms: promiscuousTerms,
                });

            await expect(
                userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                    terms: minimalTerms,
                    uri: promiscuousTermsUri,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('should allow you to update terms by sharing more credentials', async () => {
            const normalContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'b',
                });

            const oldTerms = {
                ...normalFullTerms,
                read: {
                    ...normalFullTerms.read,
                    credentials: {
                        ...normalFullTerms.read.credentials,
                        categories: {
                            ...normalFullTerms.read.credentials.categories,
                            Achievement: {
                                ...normalFullTerms.read.credentials.categories.Achievement,
                                shared: [],
                            },
                        },
                    },
                },
            };

            const { termsUri: normalTermsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: normalContractUri,
                    terms: oldTerms,
                });

            const newTerms = {
                ...normalFullTerms,
                read: {
                    ...normalFullTerms.read,
                    credentials: {
                        ...normalFullTerms.read.credentials,
                        categories: {
                            ...normalFullTerms.read.credentials.categories,
                            Achievement: {
                                ...normalFullTerms.read.credentials.categories.Achievement,
                                shared: [
                                    ...normalFullTerms.read.credentials.categories.Achievement
                                        ?.shared!,
                                    'another!',
                                ],
                            },
                        },
                    },
                },
            };

            await expect(
                userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                    terms: newTerms,
                    uri: normalTermsUri,
                })
            ).resolves.not.toThrow();

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            const terms = contracts.records.find(
                record => record.contract.uri === normalContractUri
            )?.terms;

            expect(terms).toEqual(newTerms);
        });

        it('should allow updating terms to include denied writers', async () => {
            // Update terms to add deniedWriters
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: { ...minimalTerms, deniedWriters: ['userc'] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual(['userc']);
        });

        it('should allow updating terms to remove denied writers', async () => {
            // Update terms to remove deniedWriters by passing empty array
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: { ...minimalTerms, deniedWriters: [] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual([]);
        });

        it('should allow updating terms to modify denied writers', async () => {
            // Update terms to change deniedWriters
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: { ...minimalTerms, deniedWriters: ['userd'] },
            });

            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();
            const terms = contracts.records.find(c => c.uri === termsUri)!.terms;

            expect(terms.deniedWriters).toBeDefined();
            expect(terms.deniedWriters).toEqual(['userd']);
        });
    });

    describe('withdrawConsent', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: minimalTerms,
                });
            termsUri = _termsUri;
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
        });

        it('should not allow you to withdraw consent without full auth', async () => {
            await expect(
                noAuthClient.contracts.withdrawConsent({ uri: termsUri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.contracts.withdrawConsent({ uri: termsUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to withdraw consent', async () => {
            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(contracts.records).toHaveLength(1);

            await expect(
                userB.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri })
            ).resolves.not.toThrow();

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.status).toEqual('withdrawn');
        });
    });

    describe('getTermsTransactionHistory', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: minimalTerms,
                });
            termsUri = _termsUri;
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to get transactions without full auth', async () => {
            await expect(
                noAuthClient.contracts.getTermsTransactionHistory({ uri: termsUri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it("should allow you to get transactions for contracts you've consented to", async () => {
            await expect(
                userB.clients.fullAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
            ).resolves.not.toThrow();

            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            expect(transactions.records).toHaveLength(1);
            expect(transactions.records[0]!.action).toEqual('consent');
            expect(transactions.records[0]!.terms).toEqual(minimalTerms);
        });

        it('should include credential URI of write transactions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri,
                boostUri,
                credential,
            });

            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            expect(transactions.records).toHaveLength(2);
            expect(transactions.records[1]!.action).toEqual('consent');
            expect(transactions.records[1]!.terms).toEqual(minimalTerms);
            expect(transactions.records[0]!.action).toEqual('write');
            expect(transactions.records[0]!.uris).toEqual([credentialUri]);
        });

        it('should return withdraw events', async () => {
            await userB.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });

            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

            expect(transactions.records).toHaveLength(2);
            expect(transactions.records[0]!.action).toEqual('withdraw');
        });

        it('should not allow you to get transactions for contracts someone else consented to', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to query for certain transactions', async () => {
            await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                uri: termsUri,
                terms: noTerms,
            });

            const allTransactions =
                await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                    uri: termsUri,
                });
            expect(allTransactions.records).toHaveLength(2);

            const filteredTransactions =
                await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                    uri: termsUri,
                    query: { action: 'update' },
                });
            expect(filteredTransactions.records).toHaveLength(1);
            expect(filteredTransactions.records[0]!.action).toEqual('update');
        });

        it('should paginate', async () => {
            for (let i = 0; i < 9; i += 1) {
                await userB.clients.fullAuth.contracts.updateConsentedContractTerms({
                    uri: termsUri,
                    terms: i % 2 === 0 ? noTerms : minimalTerms,
                });
            }

            const history = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
                limit: 20,
            });

            expect(history.records).toHaveLength(10);

            const firstPage = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(history.records);
        });
    });

    describe('verifyConsent', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2024, 3, 21));

            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
                expiresAt: new Date(Date.UTC(2024, 3, 25)).toISOString(), // Set explicit expiration
            });
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: minimalTerms,
                });
            termsUri = _termsUri;
        });

        afterAll(async () => {
            vi.useRealTimers();
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
        });

        it('should not allow you to verify consent without full auth', async () => {
            await expect(
                noAuthClient.contracts.verifyConsent({ uri: contractUri, profileId: 'userb' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.partialAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'userb',
                })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'userb',
                })
            ).resolves.not.toThrow();
        });

        it('should actually verify consent', async () => {
            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'userb',
                })
            ).toBeTruthy();
            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'usera',
                })
            ).toBeFalsy();
        });

        it('should stop verifying when you withdraw consent', async () => {
            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'userb',
                })
            ).toBeTruthy();

            await userB.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });

            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: contractUri,
                    profileId: 'userb',
                })
            ).toBeFalsy();
        });

        it('should stop verifying when contract expires', async () => {
            const newContractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'b',
                    expiresAt: new Date(2024, 4, 19).toISOString(),
                }
            );

            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: newContractUri,
                terms: minimalTerms,
            });

            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: newContractUri,
                    profileId: 'userb',
                })
            ).toBeTruthy();

            vi.setSystemTime(new Date(2024, 5, 21));

            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: newContractUri,
                    profileId: 'userb',
                })
            ).toBeFalsy();
        });

        it('should stop verifying when terms expire', async () => {
            const newContractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'b',
                }
            );

            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: newContractUri,
                terms: minimalTerms,
                expiresAt: new Date(2024, 4, 19).toISOString(),
            });

            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: newContractUri,
                    profileId: 'userb',
                })
            ).toBeTruthy();

            vi.setSystemTime(new Date(2024, 5, 21));

            expect(
                await userA.clients.fullAuth.contracts.verifyConsent({
                    uri: newContractUri,
                    profileId: 'userb',
                })
            ).toBeFalsy();
        });
    });

    describe('writeCredentialToContract', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
            await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });

            // Create a contract that allows writing Achievement credentials
            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Credential Writing Test Contract',
                description: 'A contract that allows writing credentials',
            });

            // User B consents to the contract with terms that allow Achievement category
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalFullTerms,
                });
            termsUri = _termsUri;
        });

        afterEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow writing credentials without full auth', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                noAuthClient.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userA.clients.partialAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow writing a credential to a user who has consented to the contract', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri,
                boostUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
            expect(typeof credentialUri).toBe('string');
        });

        it('should not allow writing credentials with a category not allowed in the contract terms', async () => {
            // Create a new contract that only allows ID category credentials
            const idOnlyContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'ID Only Contract',
                });

            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: idOnlyContractUri,
                terms: normalIDOnlyTerms, // This only allows ID category
            });

            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            // Should fail because the boost is Achievement category but terms only allow ID
            await expect(
                userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri: idOnlyContractUri,
                    boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('should fail if user has not consented to contract', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            // Should fail because userC hasn't consented to the contract
            await expect(
                userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userC.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('should fail if user has withdrawn consent', async () => {
            // First withdraw consent
            await userB.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });

            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            // Should fail because userB has withdrawn consent
            await expect(
                userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('should allow credential writing by approved extra writers', async () => {
            // Create contract with userC as an extra writer
            const writerContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Extra Writer Contract',
                    writers: ['userc'],
                });

            // User B consents to contract
            const { termsUri: writerTermsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri: writerContractUri,
                    terms: normalFullTerms,
                });

            // userC creates a boost he can issue
            const writerBoostUri = await userC.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
            });

            const writerCredential = await userC.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userC.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: writerBoostUri,
            });

            const credentialUri = await userC.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri: writerContractUri,
                boostUri: writerBoostUri,
                credential: writerCredential,
            });

            expect(credentialUri).toBeDefined();
            expect(typeof credentialUri).toBe('string');

            const credentials = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri: writerTermsUri,
            });

            expect(credentials).toBeDefined();
            expect(Array.isArray(credentials.records)).toBe(true);
            expect(credentials.records.length).toBe(1);
            expect(credentials.records[0]?.category).toBe('Achievement');
            expect(credentials.records[0]?.credentialUri).toEqual(credentialUri);
        });

        it('should reject credential writing by profiles that are not approved writers', async () => {
            // Create contract with only userC as writer
            const writerContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Writer Restricted Contract',
                    writers: ['userc'],
                });

            // User B consents
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: writerContractUri,
                terms: normalFullTerms,
            });

            // userD creates boost
            const boostUri = await userD.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            const credential = await userD.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userD.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userD.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri: writerContractUri,
                    boostUri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should reject credential writing by writers listed in deniedWriters', async () => {
            const writerContractUri =
                await userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: normalContract,
                    name: 'Denied Writer Contract',
                    writers: ['userc'],
                });

            // User B consents but denies userC
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: writerContractUri,
                terms: { ...normalFullTerms, deniedWriters: ['userc'] },
            });

            const boostUri = await userC.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
            });

            const credential = await userC.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userC.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userC.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri: writerContractUri,
                    boostUri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });
    });

    describe('getCredentialsForContract', () => {
        let contractUri: string;
        let termsUri: string;
        let credentialUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            // Create a contract that allows writing Achievement credentials
            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Credential Writing Test Contract',
                description: 'A contract that allows writing credentials',
            });

            // User B consents to the contract with terms that allow Achievement category
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalFullTerms,
                });
            termsUri = _termsUri;

            // Create and issue one credential for the contract
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Auto-issued Boost',
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            credentialUri = await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri,
                boostUri,
                credential,
            });
        });

        afterEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow retrieving credentials without full auth', async () => {
            await expect(
                noAuthClient.contracts.getCredentialsForContract({
                    termsUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.partialAuth.contracts.getCredentialsForContract({
                    termsUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow retrieving credentials issued via a contract', async () => {
            const result = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
            });

            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.category).toBe('Achievement');
            expect(result.records[0]?.credentialUri).toBeDefined();
            expect(result.records[0]?.boostUri).toBeDefined();
        });

        it("should not allow accessing credentials from another user's contract", async () => {
            await expect(
                userA.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should support pagination', async () => {
            // Add multiple additional credentials
            for (let i = 0; i < 5; i++) {
                const boostUri = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                });

                const credential = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boostUri,
                });

                await userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                });
            }

            // Total of 6 credentials now (1 original + 5 new ones)
            const allResults = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 10,
            });
            expect(allResults.records).toHaveLength(6);

            // Test first page
            const firstPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
            });

            expect(firstPage.records).toHaveLength(3);
            expect(firstPage.hasMore).toBeTruthy();

            // Test second page
            const secondPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
                cursor: firstPage.cursor,
            });

            expect(secondPage.records).toHaveLength(3);
            expect(secondPage.hasMore).toBeFalsy();

            // Combined pages should equal all results
            expect([...firstPage.records, ...secondPage.records]).toEqual(allResults.records);
        });

        it('should respect the includeReceived parameter', async () => {
            // Accept the first credential
            await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });

            // Add another credential that won't be accepted
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri,
                boostUri,
                credential,
            });

            // Should find all credentials
            const allResults = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                includeReceived: true,
            });
            expect(allResults.records).toHaveLength(2);

            // Should only find credentials that haven't been received
            const nonReceivedResults =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                    includeReceived: false,
                });
            expect(nonReceivedResults.records).toHaveLength(1);
        });

        it('should support complex pagination with various page sizes', async () => {
            // Add many credentials with different metadata to test with
            const totalCredentials = 15;

            for (let i = 0; i < totalCredentials; i++) {
                const boostUri = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                    category: i % 3 === 0 ? 'Achievement' : 'ID', // Mix of categories
                    name: `Test Credential ${i}`,
                });

                const credential = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boostUri,
                });

                const credentialUri =
                    await userA.clients.fullAuth.contracts.writeCredentialToContract({
                        did: userB.learnCard.id.did(),
                        contractUri,
                        boostUri,
                        credential,
                    });

                // Accept some credentials to test filtering
                if (i % 2 === 0) {
                    await userB.clients.fullAuth.credential.acceptCredential({
                        uri: credentialUri,
                    });
                }
            }

            // Total of 16 credentials now (1 original + 15 new ones)
            const allResults = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 20,
            });
            expect(allResults.records).toHaveLength(totalCredentials + 1); // +1 for the original credential

            // Test different page sizes to ensure proper handling

            // Page size 4
            const firstPageSmall = await userB.clients.fullAuth.contracts.getCredentialsForContract(
                {
                    termsUri,
                    limit: 4,
                }
            );
            expect(firstPageSmall.records).toHaveLength(4);
            expect(firstPageSmall.hasMore).toBeTruthy();

            const secondPageSmall =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                    limit: 4,
                    cursor: firstPageSmall.cursor,
                });
            expect(secondPageSmall.hasMore).toBeTruthy();

            // Page size 7 (odd page size)
            const firstPageMedium =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                    limit: 7,
                });
            expect(firstPageMedium.records).toHaveLength(7);
            expect(firstPageMedium.hasMore).toBeTruthy();

            const secondPageMedium =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                    limit: 7,
                    cursor: firstPageMedium.cursor,
                });
            expect(secondPageMedium.hasMore).toBeTruthy();

            // Get the last page with remaining items (should be fewer than the page size)
            const thirdPageMedium =
                await userB.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri,
                    limit: 7,
                    cursor: secondPageMedium.cursor,
                });
            expect(thirdPageMedium.records).toHaveLength(totalCredentials + 1 - 14); // +1 original, -14 from previous pages
            expect(thirdPageMedium.hasMore).toBeFalsy();

            // Verify combined pages contain all records
            const combinedRecords = [
                ...firstPageMedium.records,
                ...secondPageMedium.records,
                ...thirdPageMedium.records,
            ];
            expect(combinedRecords.length).toEqual(allResults.records.length);
        });

        it('should handle edge cases with uneven page divisions', async () => {
            // Create 10 credentials for pagination testing
            for (let i = 0; i < 9; i++) {
                const boostUri = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                });

                const credential = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boostUri,
                });

                await userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                });
            }

            // Total of 10 credentials now (1 original + 9 new ones)
            // Test with page size 3, which doesn't divide evenly into 10
            const firstPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
            });

            expect(firstPage.records).toHaveLength(3);
            expect(firstPage.hasMore).toBeTruthy();

            const secondPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
                cursor: firstPage.cursor,
            });

            expect(secondPage.records).toHaveLength(3);
            expect(secondPage.hasMore).toBeTruthy();

            const thirdPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
                cursor: secondPage.cursor,
            });

            expect(thirdPage.records).toHaveLength(3);
            expect(thirdPage.hasMore).toBeTruthy();

            // Fourth page should have just 1 remaining item
            const fourthPage = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 3,
                cursor: thirdPage.cursor,
            });
            expect(fourthPage.records).toHaveLength(1);
            expect(fourthPage.hasMore).toBeFalsy();

            // All pages combined should equal the total
            expect(
                firstPage.records.length +
                    secondPage.records.length +
                    thirdPage.records.length +
                    fourthPage.records.length
            ).toBe(10);

            const all = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 11,
            });

            expect(all.records).toEqual([
                ...firstPage.records,
                ...secondPage.records,
                ...thirdPage.records,
                ...fourthPage.records,
            ]);
        });

        it('should maintain cursor consistency across requests', async () => {
            // Add a set of credentials
            for (let i = 0; i < 10; i++) {
                const boostUri = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                });

                const credential = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boostUri,
                });

                await userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri,
                    boostUri,
                    credential,
                });
            }

            // Get the first page twice with the same parameters
            const firstPageA = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 4,
            });

            const firstPageB = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 4,
            });

            // Cursors should be the same for identical queries
            expect(firstPageA.cursor).toEqual(firstPageB.cursor);

            // Records should be the same for identical queries
            expect(firstPageA.records).toEqual(firstPageB.records);

            // Get second pages using both cursors - they should return identical results
            const secondPageA = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 4,
                cursor: firstPageA.cursor,
            });

            const secondPageB = await userB.clients.fullAuth.contracts.getCredentialsForContract({
                termsUri,
                limit: 4,
                cursor: firstPageB.cursor,
            });

            // Results should be identical
            expect(secondPageA.records).toEqual(secondPageB.records);
            expect(secondPageA.cursor).toEqual(secondPageB.cursor);
        });
    });

    describe('syncCredentialsToContract', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            // Create profiles for testing
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            // Create a contract with Achievement and ID categories
            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Sync Test Contract',
            });

            // User B consents to the contract
            const { termsUri: _termsUri } =
                await userB.clients.fullAuth.contracts.consentToContract({
                    contractUri,
                    terms: normalNoTerms, // Start with no shared credentials
                });
            termsUri = _termsUri;
        });

        afterEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow syncing credentials without full auth', async () => {
            await expect(
                noAuthClient.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: ['credential:123'],
                    },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userB.clients.partialAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: ['credential:123'],
                    },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow syncing credentials to a contract in a single category', async () => {
            const testCredentials = ['credential:abc123', 'credential:def456'];

            await expect(
                userB.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: testCredentials,
                    },
                })
            ).resolves.toBeTruthy();

            // Verify the credentials were synced by checking the terms
            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            const updatedTerms = contracts.records.find(
                record => record.contract.uri === contractUri
            )?.terms;

            expect(updatedTerms).toBeDefined();
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toEqual(
                testCredentials
            );
        });

        it('should allow syncing credentials to a contract in multiple categories', async () => {
            const achievementCredentials = ['credential:abc123', 'credential:def456'];
            const idCredentials = ['credential:id789', 'credential:id012'];

            await expect(
                userB.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: achievementCredentials,
                        ID: idCredentials,
                    },
                })
            ).resolves.toBeTruthy();

            // Verify the credentials were synced by checking the terms
            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            const updatedTerms = contracts.records.find(
                record => record.contract.uri === contractUri
            )?.terms;

            expect(updatedTerms).toBeDefined();
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toEqual(
                achievementCredentials
            );
            expect(updatedTerms?.read?.credentials?.categories?.ID?.shared).toEqual(idCredentials);
        });

        it('should add new synced credentials to existing shared credentials', async () => {
            // First sync some credentials
            const initialCredentials = ['credential:initial1', 'credential:initial2'];
            await userB.clients.fullAuth.contracts.syncCredentialsToContract({
                termsUri,
                categories: {
                    Achievement: initialCredentials,
                },
            });

            // Then sync additional credentials
            const additionalCredentials = ['credential:additional1', 'credential:additional2'];
            await userB.clients.fullAuth.contracts.syncCredentialsToContract({
                termsUri,
                categories: {
                    Achievement: additionalCredentials,
                },
            });

            // Verify all credentials were combined
            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            const updatedTerms = contracts.records.find(
                record => record.contract.uri === contractUri
            )?.terms;

            // Should contain both initial and additional credentials
            const expectedCombined = [...initialCredentials, ...additionalCredentials];
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toHaveLength(
                expectedCombined.length
            );
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toEqual(
                expect.arrayContaining(expectedCombined)
            );
        });

        it('should create transactions with the correct action and terms data', async () => {
            const achievementCredentials = ['credential:ach1', 'credential:ach2'];
            const idCredentials = ['credential:id1', 'credential:id2'];

            await userB.clients.fullAuth.contracts.syncCredentialsToContract({
                termsUri,
                categories: {
                    Achievement: achievementCredentials,
                    ID: idCredentials,
                },
            });

            // Check transaction history
            const transactions = await userB.clients.fullAuth.contracts.getTermsTransactionHistory({
                uri: termsUri,
            });

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
            await expect(
                userB.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        NonExistentCategory: ['credential:123'],
                    },
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringContaining('NonExistentCategory'),
            });
        });

        it('should reject sync requests for terms that do not belong to the user', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await expect(
                userC.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: ['credential:123'],
                    },
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                message: expect.stringContaining('Profile does not own'),
            });
        });

        it('should reject sync requests for withdrawn terms', async () => {
            // Withdraw consent
            await userB.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });

            await expect(
                userB.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: {
                        Achievement: ['credential:123'],
                    },
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: expect.stringContaining('withdrawn'),
            });
        });

        it('should deduplicate credentials when syncing', async () => {
            const credentials = ['credential:123', 'credential:456', 'credential:123']; // Duplicate intentional

            await userB.clients.fullAuth.contracts.syncCredentialsToContract({
                termsUri,
                categories: {
                    Achievement: credentials,
                },
            });

            // Verify deduplication
            const contracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            const updatedTerms = contracts.records.find(
                record => record.contract.uri === contractUri
            )?.terms;

            // Should only have 2 unique credentials
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toHaveLength(
                2
            );
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toContain(
                'credential:123'
            );
            expect(updatedTerms?.read?.credentials?.categories?.Achievement?.shared).toContain(
                'credential:456'
            );
        });
    });

    describe('getAllCredentialsForTerms', () => {
        let contractUri1: string;
        let contractUri2: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            // Create first contract
            contractUri1 = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'First Contract',
                description: 'First contract for testing',
            });

            // Create second contract
            contractUri2 = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Second Contract',
                description: 'Second contract for testing',
            });

            // User B consents to both contracts
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: contractUri1,
                terms: normalFullTerms,
            });

            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: contractUri2,
                terms: normalFullTerms,
            });

            // Create and issue one credential for each contract
            const boost1 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'First Achievement',
            });

            const credential1 = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boost1,
            });

            await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri: contractUri1,
                boostUri: boost1,
                credential: credential1,
            });

            const boost2 = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'ID',
                name: 'First ID',
            });

            const credential2 = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boost2,
            });

            await userA.clients.fullAuth.contracts.writeCredentialToContract({
                did: userB.learnCard.id.did(),
                contractUri: contractUri2,
                boostUri: boost2,
                credential: credential2,
            });
        });

        afterEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow retrieving credentials without full auth', async () => {
            await expect(noAuthClient.contracts.getAllCredentialsForTerms()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });

            await expect(
                userB.clients.partialAuth.contracts.getAllCredentialsForTerms()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow retrieving all credentials written to a profile across all terms', async () => {
            const result = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms();

            expect(result.records).toHaveLength(2);
            expect(result.records.some(record => record.category === 'Achievement')).toBeTruthy();
            expect(result.records.some(record => record.category === 'ID')).toBeTruthy();

            // All records should include the term URI they came from
            expect(result.records.every(record => record.termsUri)).toBeTruthy();
            expect(result.records.every(record => record.date)).toBeTruthy();
        });

        it('should return empty array for profiles with no contract terms', async () => {
            // User C has no consented contracts
            const result = await userC.clients.fullAuth.contracts.getAllCredentialsForTerms();
            expect(result.records).toHaveLength(0);
        });

        it('should support pagination across multiple contracts', async () => {
            // Add more credentials to both contracts
            for (let i = 0; i < 5; i++) {
                // Add to first contract
                const boost1 = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                    category: 'Achievement',
                    name: `Achievement ${i}`,
                });

                const credential1 = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boost1,
                });

                await userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri: contractUri1,
                    boostUri: boost1,
                    credential: credential1,
                });

                // Add to second contract
                const boost2 = await userA.clients.fullAuth.boost.createBoost({
                    credential: testUnsignedBoost,
                    category: 'ID',
                    name: `ID ${i}`,
                });

                const credential2 = await userA.learnCard.invoke.issueCredential({
                    ...testUnsignedBoost,
                    issuer: userA.learnCard.id.did(),
                    credentialSubject: {
                        ...testUnsignedBoost.credentialSubject,
                        id: userB.learnCard.id.did(),
                    },
                    boostId: boost2,
                });

                await userA.clients.fullAuth.contracts.writeCredentialToContract({
                    did: userB.learnCard.id.did(),
                    contractUri: contractUri2,
                    boostUri: boost2,
                    credential: credential2,
                });
            }

            // Total of 12 credentials now (2 original + 10 new ones)
            const allResults = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                limit: 15,
            });
            expect(allResults.records).toHaveLength(12);

            // Test first page
            const firstPage = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();

            // Test second page
            const secondPage = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.records).toHaveLength(5);
            expect(secondPage.hasMore).toBeTruthy();

            // Test third page
            const thirdPage = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                limit: 5,
                cursor: secondPage.cursor,
            });

            expect(thirdPage.records).toHaveLength(2);
            expect(thirdPage.hasMore).toBeFalsy();

            // Combined pages should equal all results
            expect(
                [...firstPage.records, ...secondPage.records, ...thirdPage.records].length
            ).toEqual(allResults.records.length);
        });

        it('should respect the includeReceived parameter', async () => {
            // Get all credentials
            const allResults = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                includeReceived: true,
            });
            expect(allResults.records).toHaveLength(2);

            // Accept one credential
            await userB.clients.fullAuth.credential.acceptCredential({
                uri: allResults.records[0]!.credentialUri,
            });

            // Should get all credentials with includeReceived=true
            const withReceived = await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                includeReceived: true,
            });
            expect(withReceived.records).toHaveLength(2);

            // Should filter out received credentials with includeReceived=false
            const withoutReceived =
                await userB.clients.fullAuth.contracts.getAllCredentialsForTerms({
                    includeReceived: false,
                });
            expect(withoutReceived.records).toHaveLength(1);
        });
    });

    describe('Autoboost Management in Contracts', () => {
        let contractUri: string;
        let boost1Uri: string;
        let boost2Uri: string;
        let signingAuthorityDetails: { endpoint: string; name: string };

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            const saEndpoint = 'http://localhost:5000/sa-autoboost-man';
            const saName = 'autoboost-sa';
            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: saEndpoint,
                name: saName,
                did: userA.learnCard.id.did(), // Using User A's DID for their SA
            });
            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: saEndpoint,
                name: saName,
            });

            signingAuthorityDetails = {
                endpoint: sa!.signingAuthority.endpoint,
                name: sa!.relationship.name,
            };

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Autoboost Test Contract',
            });

            // User A creates a couple of boosts
            // Using more unique IDs for boosts to prevent potential collisions if not cleared properly
            boost1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:automan1' }, // Unique ID
                category: 'TestBoosts',
                name: 'Autoboost Management Target 1',
            });
            boost2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: { ...testUnsignedBoost, id: 'boost:automan2' }, // Unique ID
                category: 'TestBoosts',
                name: 'Autoboost Management Target 2',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        describe('addAutoBoostsToContract', () => {
            it('should allow an authorized user to add an autoboost to a contract', async () => {
                await expect(
                    userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                        contractUri,
                        autoboosts: [
                            {
                                boostUri: boost1Uri,
                                signingAuthority: signingAuthorityDetails,
                            },
                        ],
                    })
                ).resolves.toBe(true);

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts).toEqual(expect.arrayContaining([boost1Uri]));
            });

            it('should allow adding multiple autoboosts', async () => {
                await userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                    contractUri,
                    autoboosts: [
                        {
                            boostUri: boost1Uri,
                            signingAuthority: signingAuthorityDetails,
                        },
                        {
                            boostUri: boost2Uri,
                            signingAuthority: signingAuthorityDetails,
                        },
                    ],
                });

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts).toEqual(expect.arrayContaining([boost1Uri, boost2Uri]));
                expect(contract.autoBoosts?.length).toBe(2);
            });

            it('should not add a duplicate autoboost (same boost URI)', async () => {
                await userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                    contractUri,
                    autoboosts: [
                        { boostUri: boost1Uri, signingAuthority: signingAuthorityDetails },
                    ],
                });
                // Try adding the same boost again
                await userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                    contractUri,
                    autoboosts: [
                        { boostUri: boost1Uri, signingAuthority: signingAuthorityDetails },
                    ],
                });

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts?.length).toBe(1); // Should still be 1
            });

            it('should not allow an unauthorized user (not owner/writer) to add an autoboost', async () => {
                // User B is not an owner or writer of the contract created by User A
                await expect(
                    userB.clients.fullAuth.contracts.addAutoBoostsToContract({
                        contractUri,
                        autoboosts: [
                            { boostUri: boost1Uri, signingAuthority: signingAuthorityDetails },
                        ],
                    })
                ).rejects.toMatchObject({
                    message: expect.stringContaining('You do not have permission'),
                });
            });

            it('should fail if contract URI is invalid', async () => {
                await expect(
                    userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                        contractUri: 'contract:invalid-uri',
                        autoboosts: [
                            { boostUri: boost1Uri, signingAuthority: signingAuthorityDetails },
                        ],
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('should fail if boost URI is invalid/boost does not exist', async () => {
                // Test with a boost URI that is syntactically plausible but guaranteed not to exist
                await expect(
                    userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                        contractUri,
                        autoboosts: [
                            {
                                boostUri: 'urn:lc:boost:zNonExistentBoostUri12345',
                                signingAuthority: signingAuthorityDetails,
                            },
                        ],
                    })
                ).rejects.toThrow(); // Specific error can be 'Boost not found or invalid' or similar
            });

            it('should fail if signing authority is not registered to the acting user', async () => {
                // Create a new SA for user B, and try to use it while acting as user A
                const userB_SA_Endpoint = 'http://localhost:5000/sa-userb';
                const userB_SA_Name = 'userb-sa';
                await userB.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: userB_SA_Endpoint,
                    name: userB_SA_Name,
                    did: userB.learnCard.id.did(),
                });
                const userBsa = await userB.clients.fullAuth.profile.signingAuthority({
                    endpoint: userB_SA_Endpoint,
                    name: userB_SA_Name,
                });

                await expect(
                    userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                        contractUri,
                        autoboosts: [
                            {
                                boostUri: boost1Uri,
                                signingAuthority: {
                                    endpoint: userBsa!.signingAuthority.endpoint,
                                    name: userBsa!.relationship.name,
                                },
                            },
                        ],
                    })
                ).rejects.toMatchObject({ code: 'FORBIDDEN' });
            });
        });

        describe('removeAutoBoostsFromContract', () => {
            beforeEach(async () => {
                // Ensure contract has autoboosts before each removal test
                await userA.clients.fullAuth.contracts.addAutoBoostsToContract({
                    contractUri,
                    autoboosts: [
                        { boostUri: boost1Uri, signingAuthority: signingAuthorityDetails },
                        { boostUri: boost2Uri, signingAuthority: signingAuthorityDetails },
                    ],
                });
            });

            it('should allow an authorized user to remove an autoboost from a contract', async () => {
                await expect(
                    userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                        contractUri,
                        boostUris: [boost1Uri],
                    })
                ).resolves.toBe(true);

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts).not.toEqual(expect.arrayContaining([boost1Uri]));
                expect(contract.autoBoosts).toEqual(expect.arrayContaining([boost2Uri]));
                expect(contract.autoBoosts?.length).toBe(1);
            });

            it('should allow removing multiple autoboosts', async () => {
                await userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                    contractUri,
                    boostUris: [boost1Uri, boost2Uri],
                });

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts?.length).toBe(0);
            });

            it('should handle attempt to remove a non-existent/already removed autoboost gracefully', async () => {
                // First remove one
                await userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                    contractUri,
                    boostUris: [boost1Uri],
                });
                // Then try to remove it again (it's already gone)
                await expect(
                    userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                        contractUri,
                        boostUris: [boost1Uri], // Attempting to remove already removed boost
                    })
                ).resolves.toBe(true); // Should not throw, operation is idempotent for missing items

                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts?.length).toBe(1); // Still one (boost2Uri)
            });

            it('should not allow an unauthorized user (not owner/writer) to remove an autoboost', async () => {
                await expect(
                    userB.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                        contractUri,
                        boostUris: [boost1Uri],
                    })
                ).rejects.toMatchObject({
                    message: expect.stringContaining('You do not have permission'),
                });
            });

            it('should fail if contract URI is invalid for removal', async () => {
                await expect(
                    userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                        contractUri: 'contract:invalid-uri',
                        boostUris: [boost1Uri],
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('should handle empty boostUris array gracefully', async () => {
                await expect(
                    userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                        contractUri,
                        boostUris: [],
                    })
                ).resolves.toBe(true);
                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts?.length).toBe(2); // No change
            });

            it('should remove all specified autoboosts even if some in the list do not exist on the contract', async () => {
                await userA.clients.fullAuth.contracts.removeAutoBoostsFromContract({
                    contractUri,
                    boostUris: [boost1Uri, 'urn:lc:boost:zNonExistentBoostForRemoval'],
                });
                const contract = await userA.clients.fullAuth.contracts.getConsentFlowContract({
                    uri: contractUri,
                });
                expect(contract.autoBoosts?.length).toBe(1);
                expect(contract.autoBoosts).toEqual(expect.arrayContaining([boost2Uri]));
            });
        });
    });
});
