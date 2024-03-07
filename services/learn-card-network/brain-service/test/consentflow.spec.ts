import {
    promiscuousTerms,
    minimalContract,
    minimalTerms,
    noTerms,
    predatoryContract,
} from './helpers/contract';
import { getClient, getUser } from './helpers/getClient';
import { Profile, ConsentFlowContract } from '@models';

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
            await Promise.all(
                Array(10)
                    .fill(0)
                    .map(async (_, index) =>
                        userA.clients.fullAuth.contracts.createConsentFlowContract({
                            contract: minimalContract,
                            name: `a${index}`,
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

    describe('consentToContract', () => {
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
                query: { read: { personal: { email: true } } },
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

            expect(newContracts.records).toHaveLength(0);
        });
    });

    describe('verifyConsent', () => {
        let contractUri: string;
        let termsUri: string;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
                expiresAt: new Date(Date.UTC(2024, 3, 19)).toISOString(), // Set explicit expiration
            });


            termsUri = await userB.clients.fullAuth.contracts.consentToContract({
                terms: minimalTerms,
                contractUri,
            });
        });

        afterAll(async () => {
            // Cleanup after all tests to ensure no state leaks between test runs
            await Profile.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
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
            jest.useFakeTimers();
            jest.setSystemTime(new Date(Date.UTC(2024, 2, 21)));

            // Verify consent before expiration.
            let verificationResult = await userA.clients.fullAuth.contracts.verifyConsent({
                uri: contractUri,
                profileId: 'userb',
            });
            expect(verificationResult).toBeTruthy();

            // Advance time to after the expiration date.
            jest.setSystemTime(new Date(Date.UTC(2024, 4, 21)));

            // Verify consent after expiration.
            verificationResult = await userA.clients.fullAuth.contracts.verifyConsent({
                uri: contractUri,
                profileId: 'userb',
            });

            expect(verificationResult).toBeFalsy();
        });

        it('should stop verifying when terms expire', async () => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(Date.UTC(2024, 2, 21)));

            // Verify consent before expiration.
            let verificationResult = await userA.clients.fullAuth.contracts.verifyConsent({
                uri: contractUri,
                profileId: 'userb',
            });

            expect(verificationResult).toBeTruthy();

            // Advance time to after the expiration date.
            jest.setSystemTime(new Date(Date.UTC(2024, 4, 21)));

            // Verify consent after expiration.
            verificationResult = await userA.clients.fullAuth.contracts.verifyConsent({
                uri: contractUri,
                profileId: 'userb',
            });

            expect(verificationResult).toBeFalsy();
        });
    });
});
