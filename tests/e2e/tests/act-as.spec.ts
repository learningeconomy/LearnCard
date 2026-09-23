import { beforeEach, describe, expect, test } from 'vitest';
import { randomBytes } from 'node:crypto';
import { initLearnCard, type NetworkLearnCardFromSeed } from '@learncard/init';
import { getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const NETWORK = 'http://localhost:4000/trpc';

const rejectsWith = async (promise: Promise<unknown>, code: string): Promise<void> => {
    await expect(promise).rejects.toMatchObject({ data: expect.objectContaining({ code }) });
};

type AnyCard = {
    invoke: { getLCNClient: () => { profile: { getProfile: { query: () => Promise<unknown> } } } };
};

const whoAmI = (card: AnyCard): Promise<unknown> =>
    card.invoke.getLCNClient().profile.getProfile.query();

describe('Act as a managed profile', () => {
    const seed = randomBytes(32).toString('hex');
    const suffix = randomBytes(3).toString('hex');
    const parentId = `act-as-parent-${suffix}`;
    const districtId = `act-as-district-${suffix}`;
    const otherDistrictId = `act-as-other-${suffix}`;
    const strangerId = `act-as-stranger-${suffix}`;
    let parent: NetworkLearnCardFromSeed['returnValue'];

    // The shared harness clears every database after each test, so rebuild the org per test.
    beforeEach(async () => {
        parent = await initLearnCard({ seed, network: NETWORK });
        await parent.invoke.createProfile({
            profileId: parentId,
            displayName: 'Act-As Parent',
            bio: '',
            shortBio: '',
        });
        const managerDid = await parent.invoke.createProfileManager({
            displayName: 'Act-As Districts',
            bio: '',
            shortBio: '',
        });
        const manager = await initLearnCard({ seed, network: NETWORK, didWeb: managerDid });
        const districts: Array<[string, string]> = [
            [districtId, 'District'],
            [otherDistrictId, 'Other District'],
        ];
        for (const [id, name] of districts) {
            await manager.invoke.createManagedProfile({
                profileId: id,
                displayName: name,
                bio: '',
                shortBio: '',
            });
        }

        const stranger = await initLearnCard({
            seed: randomBytes(32).toString('hex'),
            network: NETWORK,
        });
        await stranger.invoke.createProfile({
            profileId: strangerId,
            displayName: 'Stranger',
            bio: '',
            shortBio: '',
        });

        await getLearnCardForUser('b');
    });

    describe('with the seed', () => {
        test('initLearnCard({ actAs }) acts as the district for every call', async () => {
            const district = await initLearnCard({ seed, network: NETWORK, actAs: districtId });
            const me = await district.invoke.getProfile();
            expect(me?.profileId).toBe(districtId);

            const signed = await district.invoke.issueCredential({
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: district.id.did(),
                validFrom: new Date().toISOString(),
                name: 'From the district',
                credentialSubject: {
                    type: ['AchievementSubject'],
                    achievement: {
                        id: 'urn:uuid:00000000-0000-4000-8000-00000000ac7a',
                        type: ['Achievement'],
                        name: 'From the district',
                        description: 'act-as e2e',
                        criteria: { narrative: 'be here' },
                    },
                },
            });
            const result = await district.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                signedCredential: signed,
            });
            expect(result.credentialUri).toMatch(/^lc:network:/);

            const recipient = await getLearnCardForUser('b');
            const incoming = await recipient.invoke.getIncomingCredentials(districtId);
            expect(incoming.length).toBeGreaterThan(0);
        });

        test('invoke.actAs() returns a scoped instance and leaves the original alone', async () => {
            const asDistrict = await parent.invoke.actAs(districtId);
            expect((await asDistrict.invoke.getProfile())?.profileId).toBe(districtId);
            expect((await parent.invoke.getProfile())?.profileId).toBe(parentId);
        });

        test('cannot act as a profile it does not manage', async () => {
            const bogus = await initLearnCard({ seed, network: NETWORK, actAs: strangerId });
            await rejectsWith(whoAmI(bogus), 'FORBIDDEN');
        });

        test('unknown profile is NOT_FOUND', async () => {
            const bogus = await initLearnCard({ seed, network: NETWORK, actAs: `nope-${suffix}` });
            await rejectsWith(whoAmI(bogus), 'NOT_FOUND');
        });
    });

    describe('with an API token', () => {
        const scope = 'boosts:write boosts:read profiles:read';

        const tokenFor = async (actAs?: string): Promise<string> => {
            const grantId = await parent.invoke.addAuthGrant({
                name: `e2e-${randomBytes(2).toString('hex')}`,
                scope,
                ...(actAs !== undefined && { actAs }),
            });
            return parent.invoke.getAPITokenForAuthGrant(grantId);
        };

        const cardWith = (apiKey: string, actAs: string) =>
            initLearnCard({ apiKey, network: NETWORK, actAs });

        test('a token without actAs may not delegate (deny by default)', async () => {
            const lc = await cardWith(await tokenFor(), districtId);
            await rejectsWith(whoAmI(lc), 'FORBIDDEN');
        });

        test("actAs: '*' may act as any managed profile", async () => {
            const token = await tokenFor('*');
            for (const id of [districtId, otherDistrictId]) {
                const lc = await cardWith(token, id);
                expect((await lc.invoke.getProfile())?.profileId).toBe(id);
            }
        });

        test('an explicit list permits exactly those profiles', async () => {
            const token = await tokenFor(districtId);
            expect((await (await cardWith(token, districtId)).invoke.getProfile())?.profileId).toBe(
                districtId
            );
            await rejectsWith(whoAmI(await cardWith(token, otherDistrictId)), 'FORBIDDEN');
        });

        test('acting does not widen the token scope', async () => {
            const lc = await cardWith(await tokenFor('*'), districtId);
            await rejectsWith(
                lc.invoke.addAuthGrant({ name: 'escalate', scope: '*:*' }),
                'UNAUTHORIZED'
            );
        });

        test("the relationship is still required even with actAs: '*'", async () => {
            const lc = await cardWith(await tokenFor('*'), strangerId);
            await rejectsWith(whoAmI(lc), 'FORBIDDEN');
        });
    });
});
