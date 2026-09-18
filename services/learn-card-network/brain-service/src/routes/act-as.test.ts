import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import { ACT_AS_HEADER, AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';
import type { ProfileType } from 'types/profile';

const mocks = vi.hoisted(() => ({
    getProfileByDid: vi.fn(),
    getProfileByProfileId: vi.fn(),
    getProfilesThatManageAProfile: vi.fn(),
    grant: vi.fn(),
    verifyPresentation: vi.fn(),
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: mocks.getProfileByDid,
    getProfileByProfileId: mocks.getProfileByProfileId,
}));
vi.mock('@accesslayer/profile/relationships/read', () => ({
    getProfilesThatManageAProfile: mocks.getProfilesThatManageAProfile,
}));
vi.mock('@accesslayer/auth-grant/read', () => ({
    isAuthGrantChallengeValidForDID: mocks.grant,
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getEmptyLearnCard: async () => ({ invoke: { verifyPresentation: mocks.verifyPresentation } }),
}));

import { createContext, didRoute, profileRoute, t, type Context } from './index';
import { profilesRouter } from './profiles';

const domain = 'network.example.com';
const manager: ProfileType = {
    profileId: 'manager',
    did: 'did:key:manager',
    displayName: 'Manager',
    shortBio: '',
    bio: '',
};
const target: ProfileType = {
    profileId: 'the-id',
    did: `did:web:${domain}:users:the-id`,
    displayName: 'District',
    shortBio: '',
    bio: '',
};
const inspectionRouter = t.router({
    context: didRoute.query(({ ctx }) => ctx.user),
    writeInbox: profileRoute.meta({ requiredScope: 'inbox:write' }).query(() => true),
    writeBoost: profileRoute.meta({ requiredScope: 'boosts:write' }).query(() => true),
});
const context = (overrides: Partial<Context> = {}): Context => ({
    domain,
    tenant: resolveTenantFromRequest({}),
    actAs: target.profileId,
    user: { did: manager.did, isChallengeValid: true, scope: '*:*' },
    ...overrides,
});

beforeEach(() => {
    vi.resetAllMocks();
    mocks.getProfileByDid.mockResolvedValue(manager);
    mocks.getProfileByProfileId.mockImplementation(async (id: string) =>
        id === target.profileId ? target : null
    );
    mocks.getProfilesThatManageAProfile.mockResolvedValue([manager]);
    mocks.verifyPresentation.mockResolvedValue({ warnings: [], errors: [], checks: ['JWS'] });
});

describe('act as a managed profile', () => {
    it.each([target.profileId, target.did])('accepts seed-auth delegation to %s', async actAs => {
        const ctx = context({ actAs });
        await expect(profilesRouter.createCaller(ctx).getProfile()).resolves.toMatchObject(target);
        await expect(inspectionRouter.createCaller(ctx).context()).resolves.toMatchObject({
            did: target.did,
            profile: target,
            onBehalfOf: manager.profileId,
            scope: '*:*',
        });
        expect(ctx.user?.did).toBe(manager.did);
        expect(mocks.getProfilesThatManageAProfile).toHaveBeenCalledWith(target.profileId);
    });

    it('rejects a profile the caller does not manage', async () => {
        mocks.getProfilesThatManageAProfile.mockResolvedValue([]);
        await expect(inspectionRouter.createCaller(context()).context()).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'You do not manage profile "the-id".',
        });
    });

    it('rejects an unknown profile', async () => {
        await expect(
            inspectionRouter.createCaller(context({ actAs: 'missing' })).context()
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it.each([
        'did:key:other',
        'did:web:elsewhere:users:the-id',
        `did:web:${domain}:manager:the-id`,
        `${target.did}:extra`,
    ])('rejects an unsupported DID: %s', async actAs => {
        await expect(
            inspectionRouter.createCaller(context({ actAs })).context()
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it.each([
        [undefined, false],
        ['', false],
        ['*', true],
        ['other-id', false],
        ['the-id,other', true],
        [' other, the-id ', true],
    ] as const)('enforces token policy %s (allowed: %s)', async (actAs, allowed) => {
        mocks.grant.mockResolvedValue({ isChallengeValid: true, scope: 'inbox:write', actAs });
        const payload = Buffer.from(
            JSON.stringify({
                vp: { holder: manager.did },
                nonce: `${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}test`,
            })
        ).toString('base64url');
        const ctx = await createContext({
            req: {
                headers: new Map([
                    ['authorization', `Bearer e30.${payload}.signature`],
                    [ACT_AS_HEADER, target.profileId],
                ]),
            },
        });
        const caller = inspectionRouter.createCaller(ctx);
        if (!allowed) {
            await expect(caller.context()).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'This API token may not act as "the-id". Grant actAs on the token.',
            });
            return;
        }
        await expect(caller.context()).resolves.toMatchObject({
            profile: target,
            did: target.did,
            onBehalfOf: manager.profileId,
            scope: 'inbox:write',
            isAuthGrant: true,
            actAsPolicy: actAs,
        });
        await expect(caller.writeInbox()).resolves.toBe(true);
        await expect(caller.writeBoost()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('leaves the authenticated identity unchanged without a header', async () => {
        const result = await inspectionRouter.createCaller(context({ actAs: undefined })).context();
        expect(result).toMatchObject({ profile: manager, did: manager.did, scope: '*:*' });
        expect(result.onBehalfOf).toBeUndefined();
    });

    it.each([ACT_AS_HEADER, ACT_AS_HEADER.toLowerCase(), ACT_AS_HEADER.toUpperCase()])(
        'reads header %s without resolving a profile in createContext',
        async name => {
            const ctx = await createContext({ req: { headers: new Map([[name, target.did]]) } });
            expect(ctx.actAs).toBe(target.did);
            expect(mocks.getProfileByProfileId).not.toHaveBeenCalled();
        }
    );
});

describe('act-as ordering', () => {
    it('does not resolve the target when the challenge is not verified', async () => {
        const ctx = context({ user: { did: manager.did, isChallengeValid: false, scope: '*:*' } });
        await expect(inspectionRouter.createCaller(ctx).context()).resolves.toMatchObject({
            did: manager.did,
        });
        expect(mocks.getProfileByProfileId).not.toHaveBeenCalled();
        expect(mocks.getProfilesThatManageAProfile).not.toHaveBeenCalled();
    });

    it('treats a blank header as no delegation', async () => {
        const ctx = context({ actAs: '   ' });
        await expect(inspectionRouter.createCaller(ctx).context()).resolves.toMatchObject({
            did: manager.did,
        });
        expect(mocks.getProfileByProfileId).not.toHaveBeenCalled();
    });
});
