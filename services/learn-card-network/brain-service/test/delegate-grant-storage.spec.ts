import { v4 as uuid } from 'uuid';

import { AuthGrantStatusValidator } from '@learncard/types';

import { neogma } from '@instance';
import { Profile, AuthGrant, DelegateAuthGrant, DelegateGrantAudit } from '@models';
import {
    getAuthGrantById,
    getAuthGrantsForProfile,
    isAuthGrantAssociatedWithProfile,
    isAuthGrantChallengeValidForDID,
} from '@accesslayer/auth-grant/read';
import { createDelegateAuthGrant } from '@accesslayer/delegate-auth-grant/create';
import {
    getDelegateAuthGrantByChallenge,
    getDelegateAuthGrantForOwner,
    getDelegateAuthGrantsForOwner,
} from '@accesslayer/delegate-auth-grant/read';
import { revokeDelegateAuthGrant } from '@accesslayer/delegate-auth-grant/update';
import {
    completeDelegateGrantAudit,
    createDelegateGrantAudit,
} from '@accesslayer/delegate-grant-audit/create';
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

const auditBase = {
    route: 'inbox.issue',
    requiredScope: 'inbox:write',
    actorDid: DELEGATE_DID,
    grantId: uuid(),
    ownerProfileId: 'usera',
};

const storedAudits = async (): Promise<Record<string, unknown>[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (audit:DelegateGrantAudit)
         RETURN properties(audit) AS audit
         ORDER BY audit.timestamp, audit.id`
    );

    return result.records.map(record => record.get('audit'));
};

const deleteEverything = async () => {
    await DelegateGrantAudit.delete({ detach: true, where: {} });
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

    describe('getDelegateAuthGrantByChallenge', () => {
        it('by-challenge read returns the grant and the profile it is linked to', async () => {
            const grant = makeGrant();
            const other = makeGrant({ ownerProfileId: 'userb', effectiveProfileId: 'userb' });
            await createDelegateAuthGrant(grant);
            await createDelegateAuthGrant(other);

            const found = await getDelegateAuthGrantByChallenge(grant.challenge);

            expect(found?.grant).toEqual(grant);
            expect(found?.ownerProfile.profileId).toBe('usera');
            expect(found?.ownerProfile).toEqual(await getProfileByProfileId('usera'));
            expect(
                (await getDelegateAuthGrantByChallenge(other.challenge))?.ownerProfile.profileId
            ).toBe('userb');
            expect(
                await getDelegateAuthGrantByChallenge(`${DELEGATE_GRANT_CHALLENGE_PREFIX}${uuid()}`)
            ).toBeNull();
        });

        it('by-challenge read returns a revoked grant and an expired grant (no filtering)', async () => {
            const revoked = makeGrant({ status: AuthGrantStatusValidator.enum.revoked });
            const expired = makeGrant({
                createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
                expiresAt: new Date(Date.now() - DAY_MS).toISOString(),
            });
            await createDelegateAuthGrant(revoked);
            await createDelegateAuthGrant(expired);

            expect((await getDelegateAuthGrantByChallenge(revoked.challenge))?.grant).toEqual(
                revoked
            );
            expect((await getDelegateAuthGrantByChallenge(expired.challenge))?.grant).toEqual(
                expired
            );
        });

        it('by-challenge read does not return a node without an owner link', async () => {
            const orphan = makeGrant();
            await neogma.queryRunner.run('CREATE (grant:DelegateAuthGrant) SET grant = $orphan', {
                orphan,
            });

            expect(await storedGrants()).toEqual([{ grant: orphan, owners: [], links: [] }]);
            expect(await getDelegateAuthGrantByChallenge(orphan.challenge)).toBeNull();
        });
    });

    describe('owner reads', () => {
        it('owner read and owner list return nothing for another profile', async () => {
            const grant = makeGrant();
            await createDelegateAuthGrant(grant);

            expect(await getDelegateAuthGrantForOwner(grant.id, 'usera')).toEqual(grant);
            expect(await getDelegateAuthGrantsForOwner('usera', 10)).toEqual([grant]);

            expect(await getDelegateAuthGrantForOwner(grant.id, 'userb')).toBeNull();
            expect(await getDelegateAuthGrantsForOwner('userb', 10)).toEqual([]);
        });

        it('owner list is newest first and honours the limit', async () => {
            const hoursAgo = (hours: number) =>
                makeGrant({ createdAt: new Date(Date.now() - hours * 3_600_000).toISOString() });
            const [oldest, newest, middle] = [hoursAgo(3), hoursAgo(1), hoursAgo(2)];
            for (const grant of [oldest, newest, middle]) await createDelegateAuthGrant(grant);

            expect(await getDelegateAuthGrantsForOwner('usera', 10)).toEqual([
                newest,
                middle,
                oldest,
            ]);
            expect(await getDelegateAuthGrantsForOwner('usera', 2)).toEqual([newest, middle]);
        });
    });

    describe('revokeDelegateAuthGrant', () => {
        it('revoke by another profile returns false and changes nothing', async () => {
            const grant = makeGrant();
            await createDelegateAuthGrant(grant);

            expect(await revokeDelegateAuthGrant(grant.id, 'userb')).toBe(false);
            expect(await revokeDelegateAuthGrant(uuid(), 'usera')).toBe(false);
            expect(await storedGrants()).toEqual([linkedToUserA(grant)]);
        });

        it('revoke changes status and no other field, and a second revoke still returns true', async () => {
            const grant = makeGrant();
            const untouched = makeGrant({
                createdAt: new Date(Date.now() + 60_000).toISOString(),
            });
            await createDelegateAuthGrant(grant);
            await createDelegateAuthGrant(untouched);

            const afterRevoke = [
                linkedToUserA({ ...grant, status: AuthGrantStatusValidator.enum.revoked }),
                linkedToUserA(untouched),
            ];

            expect(await revokeDelegateAuthGrant(grant.id, 'usera')).toBe(true);
            expect(await storedGrants()).toEqual(afterRevoke);

            expect(await revokeDelegateAuthGrant(grant.id, 'usera')).toBe(true);
            expect(await storedGrants()).toEqual(afterRevoke);
        });
    });

    describe('delegate grant audit', () => {
        it('writes a denied record with its stage and no outcome', async () => {
            const id = await createDelegateGrantAudit({
                ...auditBase,
                decision: 'denied',
                stage: 'route',
            });

            const stored = await storedAudits();

            expect(stored).toEqual([
                {
                    ...auditBase,
                    decision: 'denied',
                    stage: 'route',
                    id,
                    timestamp: expect.any(String),
                },
            ]);
            expect(new Date(stored[0]!.timestamp as string).toISOString()).toBe(
                stored[0]!.timestamp
            );
            expect(stored[0]).not.toHaveProperty('outcome');
            expect(stored[0]).not.toHaveProperty('resultRef');
            expect(stored[0]).not.toHaveProperty('completedAt');
        });

        it('writes an allowed record, then completes it once with outcome and resultRef', async () => {
            const id = await createDelegateGrantAudit({ ...auditBase, decision: 'allowed' });
            const created = {
                ...auditBase,
                decision: 'allowed',
                id,
                timestamp: expect.any(String),
            };

            const beforeCompletion = await storedAudits();
            expect(beforeCompletion).toEqual([created]);
            expect(beforeCompletion[0]).not.toHaveProperty('stage');
            expect(beforeCompletion[0]).not.toHaveProperty('outcome');

            expect(await completeDelegateGrantAudit(id, 'succeeded', 'issuance-1')).toBe(true);

            const completed = await storedAudits();
            expect(completed).toEqual([
                {
                    ...created,
                    outcome: 'succeeded',
                    resultRef: 'issuance-1',
                    completedAt: expect.any(String),
                },
            ]);
            expect(new Date(completed[0]!.completedAt as string).toISOString()).toBe(
                completed[0]!.completedAt
            );

            // A record is completed once: the second attempt changes nothing.
            expect(await completeDelegateGrantAudit(id, 'failed', 'issuance-2')).toBe(false);
            expect(await storedAudits()).toEqual(completed);
        });

        it('does not complete a denied record', async () => {
            const id = await createDelegateGrantAudit({
                ...auditBase,
                decision: 'denied',
                stage: 'policy',
            });
            const before = await storedAudits();
            expect(before).toHaveLength(1);
            expect(before[0]).toMatchObject({ id, decision: 'denied', stage: 'policy' });

            expect(await completeDelegateGrantAudit(id, 'succeeded', 'issuance-1')).toBe(false);

            const after = await storedAudits();
            expect(after).toEqual(before);
            expect(after[0]).not.toHaveProperty('outcome');
            expect(after[0]).not.toHaveProperty('resultRef');
        });

        it('refuses a record that mixes a denial with an outcome, or an allowed decision with a stage', async () => {
            await expect(
                createDelegateGrantAudit({
                    ...auditBase,
                    decision: 'denied',
                    stage: 'owner',
                    outcome: 'succeeded',
                })
            ).rejects.toThrow();
            await expect(
                createDelegateGrantAudit({ ...auditBase, decision: 'allowed', stage: 'route' })
            ).rejects.toThrow();
            // A denial without its stage is refused as well.
            await expect(
                createDelegateGrantAudit({ ...auditBase, decision: 'denied' })
            ).rejects.toThrow();

            expect(await storedAudits()).toEqual([]);
        });
    });
});
