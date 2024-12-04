import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getUser } from './helpers/getClient';
import { adminRole } from './helpers/permissions';
import { testUnsignedBoost } from './helpers/send';
import { Profile, Boost, Credential, Role } from '@models';
import { getBoostByUri } from '@accesslayer/boost/read';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Internal', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('setDefaultClaimedRole', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Role.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Role.delete({ detach: true, where: {} });
        });

        it('should not create two roles when claiming a boost with default permissions', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                claimPermissions: adminRole,
            });

            const boostInstance = (await getBoostByUri(uri))!;

            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri,
                profileId: 'userb',
            });

            const relationships = await boostInstance.findRelationships({
                alias: 'hasRole',
                where: { relationship: {}, target: { profileId: 'userb' } },
            });

            expect(relationships).toHaveLength(1);

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            const sentUri = await userA.clients.fullAuth.boost.sendBoost({
                credential,
                profileId: 'userb',
                uri,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ uri: sentUri });

            const newRelationships = await boostInstance.findRelationships({
                alias: 'hasRole',
                where: { relationship: {}, target: { profileId: 'userb' } },
            });

            expect(newRelationships).toHaveLength(1);
        });
    });
});
