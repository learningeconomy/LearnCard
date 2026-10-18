import { ProfileVisibilityEnum } from '@learncard/types';

import { neogma } from '@instance';
import { Profile } from '@models';
import { searchProfiles } from '@accesslayer/profile/read';
import { backfillProfileDisplayNameLower } from '@accesslayer/profile/search-fields';

import { getClient } from './helpers/getClient';

const noAuthClient = getClient();

let didCounter = 0;
const newClient = () =>
    getClient({
        did: `did:test:profile-search-${++didCounter}`,
        isChallengeValid: true,
        scope: '*:*',
    });

const createProfile = async (
    profileId: string,
    displayName?: string,
    extra: Record<string, unknown> = {}
) => {
    const client = newClient();
    await client.profile.createProfile({
        profileId,
        ...(displayName !== undefined && { displayName }),
        ...extra,
    });
    return client;
};

const ids = (results: { profileId: string }[]) => results.map(result => result.profileId);

describe('Profile search (text-index backed, case-insensitive)', () => {
    beforeAll(async () => {
        await Profile.delete({ detach: true, where: {} });

        await createProfile('alice', 'Alice Alison');
        await createProfile('mko', 'McKenzie Ortiz');
        await createProfile('bobby-tables', 'Robert');
        await createProfile('dotcom', 'Dot.Com (Test)');
        await createProfile('elodie', 'élodie Martin');
        await createProfile('noname');

        await createProfile('hidden-private', 'Hidden Private', { isPrivate: true });

        const connectionsOnly = await createProfile('hidden-connections', 'Hidden Connections');
        await connectionsOnly.profile.updateProfile({
            profileVisibility: ProfileVisibilityEnum.enum.connections_only,
        });

        const privateVisibility = await createProfile('hidden-visibility', 'Hidden Visibility');
        await privateVisibility.profile.updateProfile({
            profileVisibility: ProfileVisibilityEnum.enum.private,
        });

        await newClient().profile.createServiceProfile({
            profileId: 'hidden-service',
            displayName: 'Hidden Service',
        });

        // Created out of order so the ordering assertion means something
        for (const n of [5, 2, 7, 1, 4, 6, 3]) {
            await createProfile(`pager${n}`, `Pager Person 0${n}`);
        }
    }, 30_000);

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
    });

    it('matches on profileId, whatever the casing of the input', async () => {
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'bobby' }))).toEqual([
            'bobby-tables',
        ]);
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'BOBBY-T' }))).toEqual([
            'bobby-tables',
        ]);
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'NoNaMe' }))).toEqual([
            'noname',
        ]);
    });

    it('matches on displayName case-insensitively, including mid-word and across spaces', async () => {
        for (const input of [
            'ALICE',
            'alice alison',
            'mckenzie',
            'MCKENZIE',
            'kenZIE oRt',
            'rober',
        ]) {
            const results = await noAuthClient.profile.searchProfiles({ input });
            expect(results.length, input).toBeGreaterThan(0);
        }

        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'kenZIE oRt' }))).toEqual([
            'mko',
        ]);
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'ROBER' }))).toEqual([
            'bobby-tables',
        ]);
    });

    it('returns a profile that matches both fields once', async () => {
        const results = await noAuthClient.profile.searchProfiles({ input: 'ALI' });

        expect(ids(results)).toEqual(['alice']);
    });

    it('lowercases non-ASCII letters too', async () => {
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'ÉLODIE' }))).toEqual([
            'elodie',
        ]);
    });

    it('treats regex metacharacters literally', async () => {
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'DOT.COM' }))).toEqual([
            'dotcom',
        ]);
        expect(ids(await noAuthClient.profile.searchProfiles({ input: '(test)' }))).toEqual([
            'dotcom',
        ]);
        // `.` used to be a regex wildcard here; now it only matches a literal dot
        expect(await noAuthClient.profile.searchProfiles({ input: 'r.bert' })).toHaveLength(0);
        // An unbalanced bracket used to be an invalid regex
        await expect(noAuthClient.profile.searchProfiles({ input: '[' })).resolves.toEqual([]);
    });

    it('leaves out private, non-public and service profiles', async () => {
        const results = await noAuthClient.profile.searchProfiles({ input: 'hidden' });

        expect(results).toHaveLength(0);
    });

    it('includes service profiles only when asked', async () => {
        const results = await noAuthClient.profile.searchProfiles({
            input: 'HIDDEN',
            includeServiceProfiles: true,
        });

        expect(ids(results)).toEqual(['hidden-service']);
    });

    it('leaves out blacklisted profileIds', async () => {
        const results = await searchProfiles('pager', { blacklist: ['pager1', 'pager2'] });

        expect(ids(results)).toEqual(['pager3', 'pager4', 'pager5', 'pager6', 'pager7']);
    });

    it('orders by displayName and applies the limit after merging both fields', async () => {
        const firstThree = await noAuthClient.profile.searchProfiles({ input: 'PAGER', limit: 3 });
        const all = await noAuthClient.profile.searchProfiles({ input: 'pager person', limit: 50 });

        expect(ids(firstThree)).toEqual(['pager1', 'pager2', 'pager3']);
        expect(ids(all)).toEqual([
            'pager1',
            'pager2',
            'pager3',
            'pager4',
            'pager5',
            'pager6',
            'pager7',
        ]);
    });

    it('still returns everything visible for an empty search', async () => {
        const results = await noAuthClient.profile.searchProfiles({ input: '', limit: 50 });

        expect(results.map(result => result.profileId).sort()).toEqual(
            [
                'alice',
                'bobby-tables',
                'dotcom',
                'elodie',
                'mko',
                'noname',
                'pager1',
                'pager2',
                'pager3',
                'pager4',
                'pager5',
                'pager6',
                'pager7',
            ].sort()
        );
    });

    it('keeps the lowercased copy in sync when displayName changes', async () => {
        const client = await createProfile('renamer', 'Original Name');

        await client.profile.updateProfile({ displayName: 'Zebra Crossing' });

        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'ZEBRA' }))).toEqual([
            'renamer',
        ]);
        expect(await noAuthClient.profile.searchProfiles({ input: 'original' })).toHaveLength(0);

        // Updates that don't touch displayName leave the copy alone
        await client.profile.updateProfile({ shortBio: 'hi' });
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'zebra' }))).toEqual([
            'renamer',
        ]);
    });

    it('does not expose the lowercased copy in search results', async () => {
        const [result] = await noAuthClient.profile.searchProfiles({ input: 'mko' });

        expect(result).toBeDefined();
        expect(result).not.toHaveProperty('displayNameLower');
    });

    it('finds pre-existing profiles by displayName only after the backfill runs', async () => {
        await createProfile('legacy-user', 'Quokka Legacy');
        // Simulate a profile written before displayNameLower existed
        await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: "legacy-user"}) REMOVE p.displayNameLower'
        );

        expect(await noAuthClient.profile.searchProfiles({ input: 'quokka' })).toHaveLength(0);
        // profileId matches don't depend on the backfill
        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'LEGACY-U' }))).toEqual([
            'legacy-user',
        ]);

        const session = neogma.driver.session();
        try {
            const updated = await backfillProfileDisplayNameLower(query => session.run(query), {
                batchSize: 2,
            });
            expect(updated).toBe(1);

            // Idempotent: nothing left to do on a second run
            const again = await backfillProfileDisplayNameLower(query => session.run(query));
            expect(again).toBe(0);
        } finally {
            await session.close();
        }

        expect(ids(await noAuthClient.profile.searchProfiles({ input: 'QUOKKA' }))).toEqual([
            'legacy-user',
        ]);
    });
});
