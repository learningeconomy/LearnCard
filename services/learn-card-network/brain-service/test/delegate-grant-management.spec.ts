import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';
import { resolveTenantFromRequest } from '@learncard/email-templates';

import type { Context } from '@routes';
import { Profile, AuthGrant, DelegateAuthGrant } from '@models';
import { getDelegateGrantAudience } from '@helpers/delegate-auth-grant.helpers';
import { DELEGATE_GRANT_CHALLENGE_PREFIX } from '@helpers/delegate-auth-grant.schema';

import { appRouter } from '../src/app';
import { getClient, getUser } from './helpers/getClient';

const DOMAIN = 'localhost%3A3000';
const DELEGATE_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const DAY_MS = 24 * 60 * 60 * 1000;

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const inDays = (days: number): string => new Date(Date.now() + days * DAY_MS).toISOString();

const validInput = () => ({
    name: 'Issuance service',
    delegateDid: DELEGATE_DID,
    scope: 'inbox:write',
    expiresAt: inDays(30),
});

// The spec calls the router in process, so no request goes through `createContext`: a
// caller is handed the user that `createContext` would have built for the request.
const getCallerAs = (user: NonNullable<Context['user']>, domain = DOMAIN) =>
    appRouter.createCaller({ domain, tenant: resolveTenantFromRequest({}), user });

/** The session of a request signed with a legacy grant token of the given scope. */
const getApiTokenClient = (did: string, scope: string) =>
    getCallerAs({ did, isChallengeValid: true, scope, isAuthGrant: true });

const getScopedClient = (did: string, scope: string) =>
    getClient({ did, isChallengeValid: true, scope });

type Outcome = { ok: unknown } | { code: string; message: string };

/** What a call answered: its value, or the code and message of its refusal. */
const outcomeOf = async (call: Promise<unknown>): Promise<Outcome> => {
    try {
        return { ok: await call };
    } catch (error) {
        if (error instanceof TRPCError) return { code: error.code, message: error.message };

        throw error;
    }
};

const storedGrantCount = async (): Promise<number> => (await DelegateAuthGrant.findMany()).length;

const deleteEverything = async (): Promise<void> => {
    await DelegateAuthGrant.delete({ detach: true, where: {} });
    await AuthGrant.delete({ detach: true, where: {} });
    await Profile.delete({ detach: true, where: {} });
};

describe('Delegate grant management', () => {
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

    it('create returns grantId, a challenge with the delegate prefix, and the server audience', async () => {
        const input = { ...validInput(), description: 'Issues course certificates' };

        const created = await userA.clients.fullAuth.delegateGrants.create(input);

        expect(Object.keys(created).sort()).toEqual(['audience', 'challenge', 'grantId']);
        expect(created.challenge.startsWith(DELEGATE_GRANT_CHALLENGE_PREFIX)).toBe(true);
        expect(created.challenge.length).toBeGreaterThan(DELEGATE_GRANT_CHALLENGE_PREFIX.length);
        expect(created.audience).toBe(getDelegateGrantAudience());
        expect(created.audience.startsWith('did:web:')).toBe(true);

        const stored = await userA.clients.fullAuth.delegateGrants.get({ id: created.grantId });

        expect(stored).toMatchObject({
            ...input,
            id: created.grantId,
            challenge: created.challenge,
            audience: created.audience,
            ownerProfileId: 'usera',
            effectiveProfileId: 'usera',
            createdBy: 'usera',
            status: 'active',
        });
        expect(Date.parse(stored.createdAt)).toBeLessThanOrEqual(Date.now());
    });

    it('create takes the audience from the server configuration, not from the request domain', async () => {
        const foreignDomainClient = getCallerAs(
            { did: userA.learnCard.id.did(), isChallengeValid: true, scope: '*:*' },
            'request-derived.example'
        );

        const created = await foreignDomainClient.delegateGrants.create(validInput());

        expect(created.audience).toBe(getDelegateGrantAudience());
        expect(created.audience).not.toContain('request-derived.example');
    });

    it('create ignores caller-supplied audience, challenge, ownerProfileId, createdBy and status', async () => {
        const serverSetFields = {
            audience: 'did:web:attacker.example',
            challenge: `${DELEGATE_GRANT_CHALLENGE_PREFIX}chosen-by-the-caller`,
            ownerProfileId: 'userb',
            effectiveProfileId: 'userb',
            createdBy: 'userb',
            createdAt: inDays(-1),
            status: 'revoked',
            id: uuid(),
        };

        for (const [field, value] of Object.entries(serverSetFields)) {
            const forged = { ...validInput(), [field]: value };

            await expect(
                userA.clients.fullAuth.delegateGrants.create(forged),
                `caller-supplied ${field}`
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        }

        expect(await storedGrantCount()).toBe(0);
    });

    it('create refuses a did:web delegate, an unknown scope, a duplicate scope, and an expiry beyond 90 days', async () => {
        const refused = [
            { field: 'delegateDid', input: { delegateDid: `did:web:${DOMAIN}:users:userb` } },
            { field: 'scope', input: { scope: 'inbox:write profile:write' } },
            { field: 'scope', input: { scope: '*:*' } },
            { field: 'scope', input: { scope: 'inbox:write inbox:write' } },
            { field: 'expiresAt', input: { expiresAt: inDays(91) } },
            { field: 'expiresAt', input: { expiresAt: inDays(-1) } },
            { field: 'expiresAt', input: { expiresAt: 'next quarter' } },
        ];

        for (const { field, input } of refused) {
            const result = await outcomeOf(
                userA.clients.fullAuth.delegateGrants.create({ ...validInput(), ...input })
            );

            // The message names the field and its rule; it is not a raw validator dump.
            expect(result, JSON.stringify(input)).toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringMatching(new RegExp(`^${field} must `)),
            });
        }

        expect(await storedGrantCount()).toBe(0);
    });

    it('create is refused for an API-token session', async () => {
        const did = userA.learnCard.id.did();

        for (const scope of ['authGrants:write', 'authGrants:read authGrants:write', '*:*']) {
            await expect(
                getApiTokenClient(did, scope).delegateGrants.create(validInput()),
                `token scope ${scope}`
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        }

        expect(await storedGrantCount()).toBe(0);

        // The same profile, signed in rather than using a token, may create one.
        await expect(
            getScopedClient(did, 'authGrants:write').delegateGrants.create(validInput())
        ).resolves.toMatchObject({ audience: getDelegateGrantAudience() });
    });

    it('create sets createdBy to the manager when the manager acts as a managed profile', async () => {
        // The act-as header is not resolved here: this is the user it leaves behind, with
        // the managed profile as `profile` and the manager's profile id in `onBehalfOf`.
        const actingClient = getCallerAs({
            did: userA.learnCard.id.did(),
            isChallengeValid: true,
            scope: '*:*',
            onBehalfOf: 'userb',
        });

        const created = await actingClient.delegateGrants.create(validInput());
        const stored = await userA.clients.fullAuth.delegateGrants.get({ id: created.grantId });

        expect(stored).toMatchObject({
            ownerProfileId: 'usera',
            effectiveProfileId: 'usera',
            createdBy: 'userb',
        });
    });

    it('another profile cannot get, list or revoke the grant', async () => {
        const { grantId } = await userA.clients.fullAuth.delegateGrants.create(validInput());
        const before = await userA.clients.fullAuth.delegateGrants.get({ id: grantId });
        const unknownId = uuid();

        const unknownGet = await outcomeOf(
            userB.clients.fullAuth.delegateGrants.get({ id: unknownId })
        );
        const foreignGet = await outcomeOf(
            userB.clients.fullAuth.delegateGrants.get({ id: grantId })
        );

        expect(unknownGet).toMatchObject({ code: 'NOT_FOUND' });
        expect(foreignGet).toEqual(unknownGet);

        const unknownRevoke = await outcomeOf(
            userB.clients.fullAuth.delegateGrants.revoke({ id: unknownId })
        );
        const foreignRevoke = await outcomeOf(
            userB.clients.fullAuth.delegateGrants.revoke({ id: grantId })
        );

        expect(unknownRevoke).toMatchObject({ code: 'NOT_FOUND' });
        expect(foreignRevoke).toEqual(unknownRevoke);
        expect(foreignRevoke).toEqual(unknownGet);

        expect(await userB.clients.fullAuth.delegateGrants.list()).toEqual([]);

        const after = await userA.clients.fullAuth.delegateGrants.get({ id: grantId });

        expect(after).toEqual(before);
        expect(after.status).toBe('active');
    });

    it('revoke is idempotent and the grant stays readable as revoked', async () => {
        const { grantId } = await userA.clients.fullAuth.delegateGrants.create(validInput());
        const before = await userA.clients.fullAuth.delegateGrants.get({ id: grantId });

        expect(await userA.clients.fullAuth.delegateGrants.revoke({ id: grantId })).toBe(true);
        expect(await userA.clients.fullAuth.delegateGrants.revoke({ id: grantId })).toBe(true);

        const after = await userA.clients.fullAuth.delegateGrants.get({ id: grantId });

        expect(after).toEqual({ ...before, status: 'revoked' });
        expect(await userA.clients.fullAuth.delegateGrants.list()).toEqual([after]);
    });

    it('list returns only the grants of the caller, up to the limit', async () => {
        const first = await userA.clients.fullAuth.delegateGrants.create(validInput());
        const second = await userA.clients.fullAuth.delegateGrants.create(validInput());
        await userB.clients.fullAuth.delegateGrants.create(validInput());

        const listed = await userA.clients.fullAuth.delegateGrants.list();

        expect(listed.map(grant => grant.id).sort()).toEqual(
            [first.grantId, second.grantId].sort()
        );
        expect(listed.every(grant => grant.ownerProfileId === 'usera')).toBe(true);
        expect(await userA.clients.fullAuth.delegateGrants.list({ limit: 1 })).toHaveLength(1);
    });

    it('the legacy routes do not see a delegate grant', async () => {
        const { grantId } = await userA.clients.fullAuth.delegateGrants.create(validInput());
        const before = await userA.clients.fullAuth.delegateGrants.get({ id: grantId });
        const legacyId = await userA.clients.fullAuth.authGrants.addAuthGrant({ name: 'legacy' });
        const legacy = userA.clients.fullAuth.authGrants;

        expect(await outcomeOf(legacy.getAuthGrant({ id: grantId }))).toEqual(
            await outcomeOf(legacy.getAuthGrant({ id: uuid() }))
        );
        expect(
            await outcomeOf(legacy.updateAuthGrant({ id: grantId, updates: { name: 'renamed' } }))
        ).toEqual(
            await outcomeOf(legacy.updateAuthGrant({ id: uuid(), updates: { name: 'renamed' } }))
        );
        expect(await outcomeOf(legacy.revokeAuthGrant({ id: grantId }))).toEqual(
            await outcomeOf(legacy.revokeAuthGrant({ id: uuid() }))
        );
        expect(await outcomeOf(legacy.deleteAuthGrant({ id: grantId }))).toEqual(
            await outcomeOf(legacy.deleteAuthGrant({ id: uuid() }))
        );

        // Each of them refused, rather than both sides of a comparison succeeding.
        expect(await outcomeOf(legacy.getAuthGrant({ id: grantId }))).toMatchObject({
            code: expect.any(String),
        });
        expect(await outcomeOf(legacy.deleteAuthGrant({ id: grantId }))).toMatchObject({
            code: expect.any(String),
        });

        const legacyIds = (await legacy.getAuthGrants()).map(grant => grant.id);

        expect(legacyIds).toEqual([legacyId]);

        expect(await userA.clients.fullAuth.delegateGrants.get({ id: grantId })).toEqual(before);
    });

    it('a caller without authGrants:write cannot create or revoke, and without authGrants:read cannot get or list', async () => {
        const did = userA.learnCard.id.did();
        const { grantId } = await userA.clients.fullAuth.delegateGrants.create(validInput());

        const readOnly = getScopedClient(did, 'authGrants:read');
        const needsWrite = {
            code: 'UNAUTHORIZED',
            message: expect.stringContaining('authGrants:write'),
        };

        await expect(readOnly.delegateGrants.create(validInput())).rejects.toMatchObject(
            needsWrite
        );
        await expect(readOnly.delegateGrants.revoke({ id: grantId })).rejects.toMatchObject(
            needsWrite
        );
        expect((await readOnly.delegateGrants.get({ id: grantId })).status).toBe('active');
        expect(await readOnly.delegateGrants.list()).toHaveLength(1);

        const readOnlyToken = getApiTokenClient(did, 'authGrants:read');

        await expect(readOnlyToken.delegateGrants.revoke({ id: grantId })).rejects.toMatchObject(
            needsWrite
        );

        const needsRead = {
            code: 'UNAUTHORIZED',
            message: expect.stringContaining('authGrants:read'),
        };

        for (const writeOnly of [
            getScopedClient(did, 'authGrants:write'),
            getApiTokenClient(did, 'authGrants:write'),
        ]) {
            await expect(writeOnly.delegateGrants.get({ id: grantId })).rejects.toMatchObject(
                needsRead
            );
            await expect(writeOnly.delegateGrants.list()).rejects.toMatchObject(needsRead);
        }

        expect(await storedGrantCount()).toBe(1);
    });

    it('a caller without a profile session is refused on every route', async () => {
        const { grantId } = await userA.clients.fullAuth.delegateGrants.create(validInput());

        for (const client of [getClient(), userA.clients.partialAuth]) {
            await expect(client.delegateGrants.create(validInput())).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(client.delegateGrants.get({ id: grantId })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(client.delegateGrants.list()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(client.delegateGrants.revoke({ id: grantId })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        }

        expect(await storedGrantCount()).toBe(1);
    });
});
