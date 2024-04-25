import { vi, describe, beforeAll, beforeEach, it, expect } from 'vitest';
import {
    promiscuousTerms,
    minimalContract,
    minimalTerms,
    noTerms,
    predatoryContract,
} from './helpers/contract';
import { getClient, getUser } from './helpers/getClient';
import { Profile, ConsentFlowContract, ConsentFlowTransaction, ConsentFlowTerms } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Consent Flow Contracts', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('createConsentFlowContract', () => {
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

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
            await userB.clients.fullAuth.contracts.consentToContract({
                contractUri: uri,
                terms: minimalTerms,
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
                noAuthClient.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to get data for contracts you own', async () => {
            await expect(
                userA.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            ).resolves.not.toThrow();

            const data = await userA.clients.fullAuth.contracts.getConsentedDataForContract({
                uri,
            });

            expect(data.records).toHaveLength(1);
            expect(data.records[0]!.personal.name).toEqual('Name lol');
            expect(data.records[0]!.credentials.categories).toEqual({});
        });

        it("should not allow you to get data for someone else's contracts", async () => {
            await expect(
                userB.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('consentToContract', () => {
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

            const termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri: uri,
            });

            const newContracts = await userB.clients.fullAuth.contracts.getConsentedContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.uri).toEqual(termsUri);
            expect(newContracts.records[0]!.contract.owner.did).toEqual(
                (await userA.clients.fullAuth.profile.getProfile()).did
            );
            expect(newContracts.records[0]!.terms).toEqual(minimalTerms);
        });

        it("should not return other user's contracts", async () => {
            const termsUri = await userB.clients.fullAuth.contracts.consentToContract({
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

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });
            termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });
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

            const promiscuousTermsUri = await userB.clients.fullAuth.contracts.consentToContract({
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
            termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });
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
            termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });
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
            termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });
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
                { contract: minimalContract, name: 'b' }
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
});
