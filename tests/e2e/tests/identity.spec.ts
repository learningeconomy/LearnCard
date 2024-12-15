import { describe, test, expect } from 'vitest';

import { NetworkLearnCardFromSeed } from '@learncard/init';

import { getLearnCardForUser, getManagedLearnCardForUser } from './helpers/learncard.helpers';

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
});
