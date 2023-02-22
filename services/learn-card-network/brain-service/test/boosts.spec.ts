import { getClient, getUser } from './helpers/getClient';
import { sendCredential } from './helpers/send';
import { Profile, Credential, Boost } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Boosts', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('getBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boosts', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(noAuthClient.boost.getBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.boost.getBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boosts', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(userA.clients.fullAuth.boost.getBoosts()).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoosts();

            expect(boosts).toHaveLength(1);
        });
    });
});
