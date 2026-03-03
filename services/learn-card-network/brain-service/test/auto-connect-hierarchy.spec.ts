import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

import { Profile, Boost, Credential } from '@models';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Auto-connect via parent boost with children', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
    });

    it('connects recipients of different child boosts when parent has autoConnectRecipients', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });

        const childUri1 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        const childUri2 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            childUri1,
            true
        );

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userc', user: userC },
            childUri2,
            true
        );

        const bConnections = await userB.clients.fullAuth.profile.paginatedConnections();
        const cConnections = await userC.clients.fullAuth.profile.paginatedConnections();

        expect(bConnections.records.map(r => r.profileId)).toContain('userc');
        expect(cConnections.records.map(r => r.profileId)).toContain('userb');
    });

    it('disconnects those recipients when the parent autoConnectRecipients flag is toggled off', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });

        const childUri1 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        const childUri2 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            childUri1,
            true
        );

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userc', user: userC },
            childUri2,
            true
        );

        const beforeDeleteBConnections = await userB.clients.fullAuth.profile.paginatedConnections();
        const beforeDeleteCConnections = await userC.clients.fullAuth.profile.paginatedConnections();

        expect(beforeDeleteBConnections.records.map(r => r.profileId)).toContain('userc');
        expect(beforeDeleteCConnections.records.map(r => r.profileId)).toContain('userb');

        await userA.clients.fullAuth.boost.updateBoost({
            uri: parentUri,
            updates: { autoConnectRecipients: false, meta: { toggled: true } },
        });

        const afterDeleteBConnections = await userB.clients.fullAuth.profile.paginatedConnections();
        const afterDeleteCConnections = await userC.clients.fullAuth.profile.paginatedConnections();

        expect(afterDeleteBConnections.records.map(r => r.profileId)).not.toContain('userc');
        expect(afterDeleteCConnections.records.map(r => r.profileId)).not.toContain('userb');
    });
});
