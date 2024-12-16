import { describe, test, expect } from 'vitest';

import { NetworkLearnCardFromSeed } from '@learncard/init';

import {
    getLearnCardForUser,
    getManagedLearnCardForUser,
    USERS,
} from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

describe('Identity', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can create managed profiles and assume their identity', async () => {
        const managerDid = await a.invoke.createProfileManager({ displayName: 'Manager Test!' });

        const managerLc = await getManagedLearnCardForUser('a', managerDid);

        expect(managerLc.id.did()).toEqual(managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        const managedLc = await getManagedLearnCardForUser('a', managedDid);

        expect(managedLc.id.did()).toEqual(managedDid);

        const managedProfile = await managedLc.invoke.getProfile();

        expect(managedProfile?.displayName).toEqual('Managed Profile Test!');
    });

    test('Users who do not administrate a Profile Manager can not assume the identity of profiles it manages', async () => {
        const managerDid = await a.invoke.createProfileManager({ displayName: 'Manager Test!' });

        const managerLc = await getManagedLearnCardForUser('a', managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        await expect(getManagedLearnCardForUser('b', managedDid)).rejects.toThrow();
    });

    test('Users can create Profile Managers that are children of boosts', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);
        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        const managerLc = await getManagedLearnCardForUser('a', managerDid);

        expect(managerLc.id.did()).toEqual(managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        const managedLc = await getManagedLearnCardForUser('a', managedDid);

        expect(managedLc.id.did()).toEqual(managedDid);

        const managedProfile = await managedLc.invoke.getProfile();

        expect(managedProfile?.displayName).toEqual('Managed Profile Test!');
    });

    test('Admins of boosts with children profile managers can assume their identites', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.addBoostAdmin(uri, USERS.b.profileId);

        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        const managerLc = await getManagedLearnCardForUser('b', managerDid);

        expect(managerLc.id.did()).toEqual(managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        const managedLc = await getManagedLearnCardForUser('b', managedDid);

        expect(managedLc.id.did()).toEqual(managedDid);

        const managedProfile = await managedLc.invoke.getProfile();

        expect(managedProfile?.displayName).toEqual('Managed Profile Test!');
    });

    test('Admins of boosts with children profile managers that have had their permissions removed can not assume their identites', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.addBoostAdmin(uri, USERS.b.profileId);

        await a.invoke.updateBoostPermissions(
            uri,
            { canManageChildrenProfiles: false },
            USERS.b.profileId
        );

        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        const managerLc = await getManagedLearnCardForUser('a', managerDid);

        expect(managerLc.id.did()).toEqual(managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        await expect(getManagedLearnCardForUser('b', managedDid)).rejects.toThrow();
    });
});
