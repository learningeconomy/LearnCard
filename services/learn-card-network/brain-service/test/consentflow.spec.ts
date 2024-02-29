import {
    promiscuousTerms,
    minimalContract,
    minimalTerms,
    noTerms,
    predatoryContract,
} from './helpers/contract';
import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential, ConsentFlowContract } from '@models';

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
                noAuthClient.contracts.createConsentFlowContract({ contract: minimalContract })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.createConsentFlowContract({
                    contract: minimalContract,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a contract', async () => {
            await expect(
                userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: minimalContract,
                })
            ).resolves.not.toThrow();
        });

        it('should become resolveable after creation', async () => {
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });

            const contracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            const contract = await userA.clients.fullAuth.storage.resolve({
                uri: contracts.records[0]?.uri ?? '',
            });

            expect(contract).toEqual(minimalContract);
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
            });

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts.records).toHaveLength(1);
            expect(newContracts.records[0]!.contract).toEqual(minimalContract);
        });

        it("should not return other user's contracts", async () => {
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });

            const userAContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userAContracts.records).toHaveLength(1);
            expect(userAContracts.records[0]!.contract).toEqual(minimalContract);

            const userBContracts = await userB.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userBContracts.records).toHaveLength(0);
        });

        it('should paginate', async () => {
            await Promise.all(
                Array(10)
                    .fill(0)
                    .map(async () =>
                        userA.clients.fullAuth.contracts.createConsentFlowContract({
                            contract: minimalContract,
                        })
                    )
            );

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

            expect(secondPage.records).toHaveLength(5);
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

    describe('consentToContract', () => {
        let uri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
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
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
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
            expect(newContracts.records[0]!.contractOwner.did).toEqual(
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

        it('should paginate', async () => {
            const uris = await Promise.all(
                Array(10)
                    .fill(0)
                    .map(async () =>
                        userA.clients.fullAuth.contracts.createConsentFlowContract({
                            contract: minimalContract,
                        })
                    )
            );

            await Promise.all(
                uris.map(async contractUri =>
                    userB.clients.fullAuth.contracts.consentToContract({
                        contractUri,
                        terms: minimalTerms,
                    })
                )
            );

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

            expect(secondPage.records).toHaveLength(5);
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
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
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
});
