import { testContract } from './helpers/contract';
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
            await Credential.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a contract without full auth', async () => {
            await expect(
                noAuthClient.contracts.createConsentFlowContract({ contract: testContract })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contracts.createConsentFlowContract({
                    contract: testContract,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a contract', async () => {
            await expect(
                userA.clients.fullAuth.contracts.createConsentFlowContract({
                    contract: testContract,
                })
            ).resolves.not.toThrow();
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
            await Credential.delete({ detach: true, where: {} });
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

            expect(contracts).toHaveLength(0);

            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: testContract,
            });

            const newContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(newContracts).toHaveLength(1);
            expect(newContracts[0]).toEqual(testContract);
        });

        it("should not return other user's contracts", async () => {
            await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: testContract,
            });

            const userAContracts = await userA.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userAContracts).toHaveLength(1);
            expect(userAContracts[0]).toEqual(testContract);

            const userBContracts = await userB.clients.fullAuth.contracts.getConsentFlowContracts();

            expect(userBContracts).toHaveLength(0);
        });
    });
});
