import { getClient, getUser } from './helpers/getClient';
import { client } from '@mongo';

const noAuthClient = getClient();
let user: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Utilities', () => {
    beforeAll(async () => {
        user = await getUser();
    });

    describe('healthCheck', () => {
        it('should work with no auth', async () => {
            const response = await noAuthClient.utilities.healthCheck();
            expect(response).toBeTruthy();
        });

        it('should work with simple auth', async () => {
            const response = await user.clients.partialAuth.utilities.healthCheck();
            expect(response).toBeTruthy();
        });

        it('should work with full auth', async () => {
            const response = await user.clients.fullAuth.utilities.healthCheck();
            expect(response).toBeTruthy();
        });
    });

    describe('getChallenges', () => {
        it('should not work with no auth', async () => {
            await expect(noAuthClient.utilities.getChallenges({})).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should work with simple auth', async () => {
            await expect(
                user.clients.partialAuth.utilities.getChallenges({})
            ).resolves.not.toThrow();
        });

        it('should work with full auth', async () => {
            await expect(user.clients.fullAuth.utilities.getChallenges({})).resolves.not.toThrow();
        });

        it('should default to 100 challenges', async () => {
            const challenges = await user.clients.partialAuth.utilities.getChallenges();
            expect(challenges).toHaveLength(100);
        });

        it('should allow requesting fewer than 100 challenges', async () => {
            const tenChallenges = await user.clients.partialAuth.utilities.getChallenges({
                amount: 10,
            });
            const twentyChallenges = await user.clients.partialAuth.utilities.getChallenges({
                amount: 20,
            });
            expect(tenChallenges).toHaveLength(10);
            expect(twentyChallenges).toHaveLength(20);
        });

        it('should not allow requesting more than 100 challenges', async () => {
            await expect(
                noAuthClient.utilities.getChallenges({ amount: 101 })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should not allow requesting negative or non-integer challenges', async () => {
            await expect(
                user.clients.partialAuth.utilities.getChallenges({ amount: -1 })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
            await expect(
                user.clients.partialAuth.utilities.getChallenges({ amount: 10.5 })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });
});
