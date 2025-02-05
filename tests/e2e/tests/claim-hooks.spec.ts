import { describe, test, expect } from 'vitest';

import { NetworkLearnCardFromSeed } from '@learncard/init';

import { getLearnCardForUser, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];
let c: NetworkLearnCardFromSeed['returnValue'];

describe('Claim Hooks', () => {
    let claimUri: string;
    let targetUri: string;

    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        c = await getLearnCardForUser('c');

        claimUri = await a.invoke.createBoost(testUnsignedBoost);
        targetUri = await a.invoke.createBoost(testUnsignedBoost);
    });

    test('Users can create claim hooks that automatically update permissions for different boosts', async () => {
        await a.invoke.createClaimHook({
            type: 'GRANT_PERMISSIONS',
            data: {
                claimUri,
                targetUri,
                permissions: { canIssue: true },
            },
        });

        const oldPermissions = await b.invoke.getBoostPermissions(targetUri);

        expect(oldPermissions.canIssue).toBeFalsy();

        const sentUri = await a.invoke.sendBoost(USERS.b.profileId, claimUri);
        await b.invoke.acceptCredential(sentUri);

        const newPermissions = await b.invoke.getBoostPermissions(targetUri);

        expect(newPermissions.canIssue).toBeTruthy();
    });

    test("Claim Hooks stop updating permissions after they're deleted", async () => {
        const claimHookUri = await a.invoke.createClaimHook({
            type: 'GRANT_PERMISSIONS',
            data: {
                claimUri,
                targetUri,
                permissions: { canIssue: true },
            },
        });

        const oldPermissions = await b.invoke.getBoostPermissions(targetUri);

        expect(oldPermissions.canIssue).toBeFalsy();

        await a.invoke.deleteClaimHook(claimHookUri);

        const sentUri = await a.invoke.sendBoost(USERS.b.profileId, claimUri);
        await b.invoke.acceptCredential(sentUri);

        const newPermissions = await b.invoke.getBoostPermissions(targetUri);

        expect(newPermissions.canIssue).toBeFalsy();
    });
});
