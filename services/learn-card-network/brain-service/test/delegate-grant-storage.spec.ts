import { v4 as uuid } from 'uuid';

import { AuthGrantStatusValidator } from '@learncard/types';

import { neogma } from '@instance';
import { Profile, AuthGrant, DelegateAuthGrant } from '@models';
import {
    getAuthGrantById,
    getAuthGrantsForProfile,
    isAuthGrantAssociatedWithProfile,
    isAuthGrantChallengeValidForDID,
} from '@accesslayer/auth-grant/read';
import { createDelegateAuthGrant } from '@accesslayer/delegate-auth-grant/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    DELEGATE_GRANT_CHALLENGE_PREFIX,
    type DelegateAuthGrant as DelegateAuthGrantRecord,
} from '@helpers/delegate-auth-grant.schema';
import { AUTH_GRANT_NO_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getUser } from './helpers/getClient';

const DAY_MS = 24 * 60 * 60 * 1000;
const DELEGATE_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const makeGrant = (overrides: Partial<DelegateAuthGrantRecord> = {}): DelegateAuthGrantRecord => {
    const createdAt = Date.now();

    return {
        id: uuid(),
        name: 'Issuer service',
        description: 'Issues credentials on behalf of usera',
        challenge: `${DELEGATE_GRANT_CHALLENGE_PREFIX}${uuid()}`,
        status: AuthGrantStatusValidator.enum.active,
        scope: 'inbox:write',
        createdAt: new Date(createdAt).toISOString(),
        expiresAt: new Date(createdAt + DAY_MS).toISOString(),
        delegateDid: DELEGATE_DID,
        ownerProfileId: 'usera',
        effectiveProfileId: 'usera',
        audience: 'https://network.example/trpc',
        createdBy: 'did:web:domain:users:usera',
        ...overrides,
    };
};

type StoredGrant = { grant: Record<string, unknown>; owners: string[]; links: string[] };

const storedGrants = async (): Promise<StoredGrant[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (grant:DelegateAuthGrant)
         RETURN properties(grant) AS grant,
                [(owner:Profile)-[:AUTHORIZES_DELEGATE_GRANT]->(grant) | owner.profileId] AS owners,
                [(grant)-[link]-() | type(link)] AS links
         ORDER BY grant.createdAt, grant.id`
    );

    return result.records.map(record => ({
        grant: record.get('grant'),
        owners: record.get('owners'),
        links: record.get('links'),
    }));
};

const linkedToUserA = (grant: DelegateAuthGrantRecord): StoredGrant => ({
    grant,
    owners: ['usera'],
    links: ['AUTHORIZES_DELEGATE_GRANT'],
});

const deleteEverything = async () => {
    await DelegateAuthGrant.delete({ detach: true, where: {} });
    await AuthGrant.delete({ detach: true, where: {} });
    await Profile.delete({ detach: true, where: {} });
};

describe('Delegate grant storage', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await deleteEverything();
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
    });

    afterEach(deleteEverything);
    afterAll(deleteEverything);

    describe('createDelegateAuthGrant', () => {
        it('creates the node and the owner link together', async () => {
            const grant = makeGrant();

            expect(await createDelegateAuthGrant(grant)).toEqual(grant);
            expect(await storedGrants()).toEqual([linkedToUserA(grant)]);
        });

        it('stores a grant without a description', async () => {
            const { description: _description, ...grant } = makeGrant();

            expect(await createDelegateAuthGrant(grant)).toEqual(grant);
            expect(await storedGrants()).toEqual([linkedToUserA(grant)]);
        });

        it('creates nothing and returns null when the owner profile does not exist', async () => {
            const grant = makeGrant({ ownerProfileId: 'nobody', effectiveProfileId: 'nobody' });

            expect(await createDelegateAuthGrant(grant)).toBeNull();
            expect(await storedGrants()).toEqual([]);
        });

        it('refuses a second grant with the same challenge', async () => {
            const first = makeGrant();
            await createDelegateAuthGrant(first);

            const second = makeGrant({
                challenge: first.challenge,
                name: 'Second service',
                ownerProfileId: 'userb',
                effectiveProfileId: 'userb',
            });

            expect(await createDelegateAuthGrant(second)).toBeNull();
            expect(await storedGrants()).toEqual([linkedToUserA(first)]);
        });

        it('refuses a second grant with the same id', async () => {
            const first = makeGrant();
            await createDelegateAuthGrant(first);

            expect(await createDelegateAuthGrant(makeGrant({ id: first.id }))).toBeNull();
            expect(await storedGrants()).toEqual([linkedToUserA(first)]);
        });

        it('throws and creates nothing for a record the schema refuses', async () => {
            const legacyLooking = makeGrant({ challenge: `auth-grant:${uuid()}` });
            const targetsAnother = makeGrant({ effectiveProfileId: 'userb' });

            await expect(createDelegateAuthGrant(legacyLooking)).rejects.toThrow();
            await expect(createDelegateAuthGrant(targetsAnother)).rejects.toThrow();
            expect(await storedGrants()).toEqual([]);
        });

        it('is invisible to the legacy grant functions', async () => {
            const grant = makeGrant();
            expect(await createDelegateAuthGrant(grant)).not.toBeNull();

            const owner = await getProfileByProfileId('usera');
            if (!owner) throw new Error('owner profile was not created');

            expect(await getAuthGrantById(grant.id)).toBeNull();
            expect(await getAuthGrantsForProfile(owner, { limit: 10 })).toEqual([]);
            expect(await isAuthGrantAssociatedWithProfile(grant.id, 'usera')).toBe(false);
            expect(
                await isAuthGrantChallengeValidForDID(grant.challenge, 'did:web:domain:users:usera')
            ).toEqual({
                isChallengeValid: false,
                scope: AUTH_GRANT_NO_ACCESS_SCOPE,
                actAs: undefined,
            });
        });
    });
});
