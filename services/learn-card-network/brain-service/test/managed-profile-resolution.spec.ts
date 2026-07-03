import { beforeEach, describe, expect, it } from 'vitest';

import { getClient } from './helpers/getClient';
import { Profile } from '@models';
import { resolveProfileFromContextDid } from '@routes';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByDid } from '@accesslayer/profile/read';

getClient();

const BRAIN_DOMAIN = 'network.learncard.com';
const MANAGED_PROFILE_ID = 'eos-lef-abc123';
const MANAGED_DID = `did:web:console.lef.org:p:${MANAGED_PROFILE_ID}`;

describe('managed did:web profile resolution (console-bff integration)', () => {
    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
    });

    it('stores a managed profile under the console-served :p: DID and resolves it back', async () => {
        await createProfile({
            profileId: MANAGED_PROFILE_ID,
            did: MANAGED_DID,
            displayName: MANAGED_PROFILE_ID,
        } as Parameters<typeof createProfile>[0]);

        const byDid = await getProfileByDid(MANAGED_DID);
        expect(byDid?.profileId).toBe(MANAGED_PROFILE_ID);
        expect(byDid?.did).toBe(MANAGED_DID);

        const resolved = await resolveProfileFromContextDid(MANAGED_DID, BRAIN_DOMAIN);
        expect(resolved?.profileId).toBe(MANAGED_PROFILE_ID);
        expect(resolved?.did).toBe(MANAGED_DID);
    });

    it('returns null for an unknown managed DID', async () => {
        expect(
            await resolveProfileFromContextDid(`did:web:console.lef.org:p:ghost`, BRAIN_DOMAIN)
        ).toBeNull();
    });
});
