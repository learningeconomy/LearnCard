import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

import { Profile, Boost, Credential, Role } from '@models';
import { getBoostByUri } from '@accesslayer/boost/read';
import { countBoostRecipientsWithChildren } from '@accesslayer/boost/relationships/read';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let userD: Awaited<ReturnType<typeof getUser>>;

/**
 * Unit tests for access-layer countBoostRecipientsWithChildren
 * Focused on generation limits, acceptance filtering, and query filtering
 */

describe('AccessLayer: countBoostRecipientsWithChildren', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        userD = await getUser('d'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('returns 0 for boost with no recipients', async () => {
        const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testUnsignedBoost });
        const boostInstance = (await getBoostByUri(uri))!;

        const count = await countBoostRecipientsWithChildren(boostInstance, {});

        expect(count).toBe(0);
    });

    it('counts recipients across child boosts', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Parent',
        });
        const childUri = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost, category: 'Child' },
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, parentUri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userc', user: userC }, childUri);

        const boostInstance = (await getBoostByUri(parentUri))!;

        const count = await countBoostRecipientsWithChildren(boostInstance, {});
        expect(count).toBe(2);
    });

    it('counts distinct recipients once when they receive multiple boosts', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Parent',
        });
        const childUri1 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost, category: 'Child1' },
        });
        const childUri2 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost, category: 'Child2' },
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, parentUri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, childUri1);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, childUri2);

        const boostInstance = (await getBoostByUri(parentUri))!;

        const count = await countBoostRecipientsWithChildren(boostInstance, {});
        expect(count).toBe(1);
    });

    it('respects numberOfGenerations parameter', async () => {
        // 3-level hierarchy: parent -> child -> grandchild
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Parent',
        });
        const childUri = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost, category: 'Child' },
        });
        const grandchildUri = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri: childUri,
            boost: { credential: testUnsignedBoost, category: 'Grandchild' },
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, parentUri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userc', user: userC }, childUri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userd', user: userD }, grandchildUri);

        const boostInstance = (await getBoostByUri(parentUri))!;

        // Only parent + 1 level (default = 1)
        const count1 = await countBoostRecipientsWithChildren(boostInstance, { numberOfGenerations: 1 });
        expect(count1).toBe(2);

        // Include grandchild (2 levels)
        const count2 = await countBoostRecipientsWithChildren(boostInstance, { numberOfGenerations: 2 });
        expect(count2).toBe(3);
    });

    it('includes or excludes unaccepted boosts based on includeUnacceptedBoosts option', async () => {
        const uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Test',
        });

        // Send but do not accept
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            uri,
            false
        );

        const boostInstance = (await getBoostByUri(uri))!;

        const includeCount = await countBoostRecipientsWithChildren(boostInstance, { includeUnacceptedBoosts: true });
        expect(includeCount).toBe(1);

        const excludeCount = await countBoostRecipientsWithChildren(boostInstance, { includeUnacceptedBoosts: false });
        expect(excludeCount).toBe(0);
    });

    it('supports filtering by boostQuery', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Achievement',
        });
        const childUri = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost, category: 'Badge' },
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, parentUri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userc', user: userC }, childUri);

        const boostInstance = (await getBoostByUri(parentUri))!;

        const achCount = await countBoostRecipientsWithChildren(boostInstance, {
            boostQuery: { category: 'Achievement' },
        });
        expect(achCount).toBe(1);

        const badgeCount = await countBoostRecipientsWithChildren(boostInstance, {
            boostQuery: { category: 'Badge' },
        });
        expect(badgeCount).toBe(1);
    });

    it('supports filtering by profileQuery', async () => {
        const uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Test',
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, uri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userc', user: userC }, uri);

        const boostInstance = (await getBoostByUri(uri))!;

        const onlyUserB = await countBoostRecipientsWithChildren(boostInstance, {
            // Use $in single value to exercise typed map path reliably
            profileQuery: { profileId: { $in: ['userb'] } },
        } as any);
        expect(onlyUserB).toBe(1);

        const inQuery = await countBoostRecipientsWithChildren(boostInstance, {
            profileQuery: { profileId: { $in: ['userb', 'userd'] } },
        } as any);
        expect(inQuery).toBe(1);
    });

    it('supports filtering by profileQuery with regex', async () => {
        const uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Test',
        });

        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userb', user: userB }, uri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userc', user: userC }, uri);
        await sendBoost({ profileId: 'usera', user: userA }, { profileId: 'userd', user: userD }, uri);

        const boostInstance = (await getBoostByUri(uri))!;

        const regexQuery = await countBoostRecipientsWithChildren(boostInstance, {
            // Provide RegExpValue so convertObjectRegExpToNeo4j generates Neo4j-compatible pattern
            profileQuery: { profileId: { $regex: { source: 'userb', flags: 'i' } } },
        } as any);

        expect(regexQuery).toBe(1);
    });
});
