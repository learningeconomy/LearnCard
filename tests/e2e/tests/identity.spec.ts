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

    test('Admins of boosts with children profile managers can query for them', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.addBoostAdmin(uri, USERS.b.profileId);

        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        await a.invoke.createChildProfileManager(uri, {
            displayName: 'Something different!',
        });

        const managers = await b.invoke.getBoostChildrenProfileManagers(uri);

        expect(managers.records).toHaveLength(2);

        const queriedManagers = await b.invoke.getBoostChildrenProfileManagers(uri, {
            query: { displayName: { $regex: /manager test/i } },
        });

        expect(queriedManagers.records).toHaveLength(1);
        expect(queriedManagers.records[0]?.displayName).toEqual('Manager Test!');
        expect(queriedManagers.records[0]?.did).toEqual(managerDid);
    });

    test('Admins of boosts with children profiles can query for them', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.addBoostAdmin(uri, USERS.b.profileId);

        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        const managerLc = await getManagedLearnCardForUser('b', managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });
        await managerLc.invoke.createManagedProfile({
            profileId: 'other',
            displayName: 'Other Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        const profiles = await managerLc.invoke.getManagedProfiles();

        expect(profiles.records).toHaveLength(2);

        const queriedProfiles = await managerLc.invoke.getManagedProfiles({
            query: { profileId: { $regex: /manag/i } },
        });

        expect(queriedProfiles.records).toHaveLength(1);
        expect(queriedProfiles.records[0]?.did).toEqual(managedDid);
    });

    test('Profiles can query for what profiles are available to them', async () => {
        const uri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.addBoostAdmin(uri, USERS.b.profileId);

        const managerDid = await a.invoke.createChildProfileManager(uri, {
            displayName: 'Manager Test!',
        });

        const managerLc = await getManagedLearnCardForUser('b', managerDid);

        const managedDid = await managerLc.invoke.createManagedProfile({
            profileId: 'managed',
            displayName: 'Managed Profile Test!',
            bio: '',
            shortBio: '',
        });
        await managerLc.invoke.createManagedProfile({
            profileId: 'other',
            displayName: 'Other Managed Profile Test!',
            bio: '',
            shortBio: '',
        });

        const profiles = await a.invoke.getAvailableProfiles();

        expect(profiles.records).toHaveLength(2);

        const queriedProfiles = await a.invoke.getAvailableProfiles({
            query: { profileId: { $regex: /manag/i } },
        });

        expect(queriedProfiles.records).toHaveLength(1);
        expect(queriedProfiles.records[0]?.did).toEqual(managedDid);
    });

    test('Profile Managers can update themselves', async () => {
        const managerDid = await a.invoke.createProfileManager({ displayName: 'Manager Test!' });

        const managerLc = await getManagedLearnCardForUser('a', managerDid);

        const managerProfile = await managerLc.invoke.getProfileManagerProfile();

        expect(managerProfile?.displayName).toEqual('Manager Test!');

        await managerLc.invoke.updateProfileManagerProfile({ displayName: 'Nice!' });

        const updatedManagerProfile = await managerLc.invoke.getProfileManagerProfile();

        expect(updatedManagerProfile?.displayName).toEqual('Nice!');
    });
});
