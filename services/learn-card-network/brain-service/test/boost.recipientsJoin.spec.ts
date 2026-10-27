import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

import { neogma } from '@instance';
import { Profile, Boost, Credential, Role } from '@models';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    getBoostRecipients,
    getConnectedBoostRecipients,
    countConnectedBoostRecipients,
    getBoostRecipientsWithChildren,
    countBoostRecipientsWithChildren,
} from '@accesslayer/boost/relationships/read';

/**
 * Access-layer coverage for the boost recipient queries that join each CREDENTIAL_SENT to the
 * recipient Profile by `sent.to`: list, count, pagination, and pending (unaccepted) recipients.
 *
 * Sends are written directly so dates, statuses, repeat sends, and sends to profileIds with no
 * Profile are exact.
 */

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const domain = 'localhost%3A3000';
const minute = (k: number) => new Date(Date.UTC(2026, 0, 1, 0, k)).toISOString();

type SeedSend = {
    to: string;
    k: number;
    accepted?: boolean;
    sentStatus?: string;
    receivedStatus?: string;
    from?: string;
};

const createProfiles = async (profileIds: string[]) => {
    await neogma.queryRunner.run(
        `UNWIND $profileIds AS id
         CREATE (:Profile {profileId: id, did: 'did:example:' + id, displayName: 'Name ' + id})`,
        { profileIds }
    );
};

const seedSends = async (boostId: string, sends: SeedSend[]) => {
    await neogma.queryRunner.run(
        `MATCH (b:Boost {id: $boostId})
         UNWIND $rows AS row
         MATCH (s:Profile {profileId: row.from})
         CREATE (c:Credential {id: row.id, credential: '{}'})-[:INSTANCE_OF]->(b)
         CREATE (s)-[sent:CREDENTIAL_SENT {to: row.to, date: row.date}]->(c)
         SET sent.status = row.sentStatus
         WITH c, row WHERE row.accepted
         MATCH (r:Profile {profileId: row.to})
         CREATE (c)-[received:CREDENTIAL_RECEIVED {from: row.from, date: row.date}]->(r)
         SET received.status = row.receivedStatus`,
        {
            boostId,
            rows: sends.map(send => ({
                id: `${boostId}-${send.k}`,
                from: send.from ?? 'usera',
                to: send.to,
                date: minute(send.k),
                accepted: Boolean(send.accepted),
                sentStatus: send.sentStatus ?? null,
                receivedStatus: send.receivedStatus ?? null,
            })),
        }
    );
};

const connect = async (profileId: string, targets: string[]) => {
    await neogma.queryRunner.run(
        `MATCH (a:Profile {profileId: $profileId})
         UNWIND $targets AS target
         MATCH (b:Profile {profileId: target})
         CREATE (a)-[:CONNECTED_WITH]->(b)`,
        { profileId, targets }
    );
};

const createBoost = async (category = 'Main') => {
    const uri = await userA.clients.fullAuth.boost.createBoost({
        credential: testUnsignedBoost,
        category,
    });
    return { uri, boost: (await getBoostByUri(uri))! };
};

/** Same paging the getBoostRecipients route does: limit + 1, cursor = sent date of the last kept row */
const walkBySentDate = async <T extends { sent: string }>(
    fetchPage: (limit: number, cursor?: string) => Promise<T[]>,
    limit: number
) => {
    const pages: T[][] = [];
    let cursor: string | undefined;

    for (let i = 0; i < 20; i++) {
        const records = await fetchPage(limit + 1, cursor);
        const hasMore = records.length > limit;
        pages.push(records.slice(0, limit));
        cursor = records.at(hasMore ? -2 : -1)?.sent;
        if (!hasMore) break;
    }

    return pages;
};

type RecipientQuery = NonNullable<Parameters<typeof getBoostRecipients>[1]['query']>;

const ids = (records: Array<{ to: { profileId: string } }>) =>
    records.map(record => record.to.profileId);

/**
 * Main boost, sent by usera unless noted:
 *  k0 r0 accepted            k5 r4 accepted, sent suspended
 *  k1 r1 pending             k6 r1 accepted (repeat send)
 *  k2 no Profile, pending    k7 r5 pending, sent by senderb
 *  k3 r2 accepted, received revoked
 *  k4 r3 pending, sent revoked
 *  k8 r6 accepted, received suspended
 *  k9 r7 accepted
 */
const MAIN_SENDS: SeedSend[] = [
    { k: 0, to: 'r0', accepted: true },
    { k: 1, to: 'r1' },
    { k: 2, to: 'no-profile-1' },
    { k: 3, to: 'r2', accepted: true, receivedStatus: 'revoked' },
    { k: 4, to: 'r3', sentStatus: 'revoked' },
    { k: 5, to: 'r4', accepted: true, sentStatus: 'suspended' },
    { k: 6, to: 'r1', accepted: true },
    { k: 7, to: 'r5', from: 'senderb' },
    { k: 8, to: 'r6', accepted: true, receivedStatus: 'suspended' },
    { k: 9, to: 'r7', accepted: true },
];

describe('AccessLayer: boost recipient queries', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await createProfiles([
            'senderb',
            'viewer',
            'r0',
            'r1',
            'r2',
            'r3',
            'r4',
            'r5',
            'r6',
            'r7',
            'r8',
        ]);
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    describe('getBoostRecipients', () => {
        it('lists pending and accepted recipients in send order, skipping revoked sends and unknown profiles', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);

            const records = await getBoostRecipients(boost, { limit: 50, domain });

            expect(ids(records)).toEqual(['r0', 'r1', 'r4', 'r5', 'r6', 'r7']);

            const byId = Object.fromEntries(records.map(record => [record.to.profileId, record]));
            // A repeat send keeps the earliest row, which here is still pending
            expect(byId.r1!.sent).toBe(minute(1));
            expect(byId.r1!.received).toBeUndefined();
            expect(byId.r0!.received).toBe(minute(0));
            expect(byId.r4!.status).toBe('suspended');
            expect(byId.r6!.status).toBe('suspended');
            expect(byId.r5!.from).toBe('senderb');
            expect(byId.r0!.uri).toContain(`${boost.id}-0`);
        });

        it('only lists accepted recipients when includeUnacceptedBoosts is false', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);

            const records = await getBoostRecipients(boost, {
                limit: 50,
                domain,
                includeUnacceptedBoosts: false,
            });

            expect(ids(records)).toEqual(['r0', 'r4', 'r1', 'r6', 'r7']);
            expect(records.find(record => record.to.profileId === 'r1')!.sent).toBe(minute(6));
        });

        it('starts after the cursor before deduplicating repeat sends', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);

            const records = await getBoostRecipients(boost, {
                limit: 50,
                domain,
                cursor: minute(3),
            });

            expect(ids(records)).toEqual(['r4', 'r1', 'r5', 'r6', 'r7']);
            expect(records[1]!.sent).toBe(minute(6));
        });

        it('pages through pending and accepted recipients with the route cursor', async () => {
            const { boost } = await createBoost();
            await seedSends(
                boost.id,
                ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map((to, k) => ({
                    k,
                    to,
                    accepted: k % 2 === 0,
                }))
            );

            for (const [limit, expected] of [
                [2, [['r0', 'r1'], ['r2', 'r3'], ['r4', 'r5'], ['r6']]],
                [3, [['r0', 'r1', 'r2'], ['r3', 'r4', 'r5'], ['r6']]],
                [7, [['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6']]],
            ] as const) {
                const pages = await walkBySentDate(
                    (pageLimit, cursor) =>
                        getBoostRecipients(boost, { limit: pageLimit, cursor, domain }),
                    limit
                );
                expect(pages.map(page => ids(page))).toEqual(expected);
            }

            const acceptedPages = await walkBySentDate(
                (pageLimit, cursor) =>
                    getBoostRecipients(boost, {
                        limit: pageLimit,
                        cursor,
                        domain,
                        includeUnacceptedBoosts: false,
                    }),
                2
            );
            expect(acceptedPages.map(page => ids(page))).toEqual([
                ['r0', 'r2'],
                ['r4', 'r6'],
            ]);
        });

        it('filters by recipient profileId the way the recipient-list visibility check calls it', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);

            const lookup = (query: RecipientQuery) =>
                getBoostRecipients(boost, { limit: 1, domain, query });

            expect(ids(await lookup({ profileId: 'r4' }))).toEqual(['r4']);
            expect(ids(await lookup({ profileId: 'r1' }))).toEqual(['r1']);
            expect(await lookup({ profileId: 'r3' })).toEqual([]);
            expect(await lookup({ profileId: 'r2' })).toEqual([]);
            expect(await lookup({ profileId: 'no-profile-1' })).toEqual([]);
            expect(await lookup({ profileId: 'viewer' })).toEqual([]);

            const several = await getBoostRecipients(boost, {
                limit: 10,
                domain,
                query: { profileId: { $in: ['r5', 'r7', 'r3', 'viewer'] } },
            });
            expect(ids(several)).toEqual(['r5', 'r7']);

            const either = await getBoostRecipients(boost, {
                limit: 10,
                domain,
                query: {
                    $or: [{ profileId: 'r0' }, { displayName: 'Name r6' }],
                } as unknown as RecipientQuery,
            });
            expect(ids(either)).toEqual(['r0', 'r6']);
        });

        it('filters by sender', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);

            const fromB = await getBoostRecipients(boost, { limit: 10, domain, from: 'senderb' });
            expect(ids(fromB)).toEqual(['r5']);

            const fromA = await getBoostRecipients(boost, {
                limit: 2,
                domain,
                from: 'usera',
                cursor: minute(0),
            });
            // The send with no Profile and the two revoked sends never take a LIMIT slot
            expect(ids(fromA)).toEqual(['r1', 'r4']);
        });

        it('lists a real pending send and then the accepted one', async () => {
            const { uri, boost } = await createBoost();

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            const pending = await getBoostRecipients(boost, { limit: 10, domain });
            expect(ids(pending)).toEqual(['userb']);
            expect(pending[0]!.received).toBeUndefined();
            expect(
                await getBoostRecipients(boost, {
                    limit: 10,
                    domain,
                    includeUnacceptedBoosts: false,
                })
            ).toEqual([]);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri
            );

            const accepted = await getBoostRecipients(boost, {
                limit: 10,
                domain,
                includeUnacceptedBoosts: false,
            });
            expect(ids(accepted)).toEqual(['userb']);
            expect(accepted[0]!.received).toBeDefined();
        });
    });

    describe('connected recipients', () => {
        it('lists, pages, and counts recipients connected to the requester', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);
            await connect('viewer', ['r0', 'r1', 'r3', 'r4', 'r6']);
            const viewer = (await getProfileByProfileId('viewer'))!;

            // No revoked filter and no repeat-send dedupe here, as before
            const all = await getConnectedBoostRecipients(viewer, boost, { limit: 50, domain });
            expect(all.map(record => [record.to.profileId, record.sent])).toEqual([
                ['r0', minute(0)],
                ['r1', minute(1)],
                ['r3', minute(4)],
                ['r4', minute(5)],
                ['r1', minute(6)],
                ['r6', minute(8)],
            ]);

            const pages = await walkBySentDate(
                (limit, cursor) =>
                    getConnectedBoostRecipients(viewer, boost, { limit, cursor, domain }),
                4
            );
            expect(pages.map(page => ids(page))).toEqual([
                ['r0', 'r1', 'r3', 'r4'],
                ['r1', 'r6'],
            ]);

            const accepted = await getConnectedBoostRecipients(viewer, boost, {
                limit: 50,
                domain,
                includeUnacceptedBoosts: false,
            });
            expect(ids(accepted)).toEqual(['r0', 'r4', 'r1', 'r6']);

            const filtered = await getConnectedBoostRecipients(viewer, boost, {
                limit: 50,
                domain,
                query: { displayName: 'Name r4' },
            });
            expect(ids(filtered)).toEqual(['r4']);

            expect(await countConnectedBoostRecipients(viewer, boost, {})).toBe(5);
            expect(
                await countConnectedBoostRecipients(viewer, boost, {
                    includeUnacceptedBoosts: false,
                })
            ).toBe(4);
            expect(
                await countConnectedBoostRecipients(viewer, boost, {
                    query: { displayName: 'Name r3' },
                })
            ).toBe(1);
            expect(
                await countConnectedBoostRecipients(viewer, boost, {
                    includeUnacceptedBoosts: false,
                    query: { profileId: { $in: ['r1', 'r3'] } },
                })
            ).toBe(1);
        });

        it('counts zero when the requester has no connected recipients', async () => {
            const { boost } = await createBoost();
            await seedSends(boost.id, MAIN_SENDS);
            const viewer = (await getProfileByProfileId('viewer'))!;

            expect(await getConnectedBoostRecipients(viewer, boost, { limit: 10, domain })).toEqual(
                []
            );
            expect(await countConnectedBoostRecipients(viewer, boost, {})).toBe(0);
        });
    });

    describe('recipients with children', () => {
        const seedFamily = async () => {
            const { uri: parentUri, boost: parent } = await createBoost('Parent');
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testUnsignedBoost, category: 'Child' },
            });
            const child = (await getBoostByUri(childUri))!;

            await seedSends(parent.id, MAIN_SENDS);
            await seedSends(child.id, [
                { k: 20, to: 'r0', accepted: true },
                { k: 21, to: 'r8' },
                { k: 22, to: 'no-profile-2' },
                { k: 23, to: 'r2', accepted: true, receivedStatus: 'revoked' },
            ]);

            return { parent, child };
        };

        it('groups pending and accepted recipients by profile across child boosts', async () => {
            const { parent } = await seedFamily();

            const records = await getBoostRecipientsWithChildren(parent, { limit: 50, domain });

            // r2 only has revoked received rows, which are dropped after the page is read
            expect(ids(records)).toEqual(['r0', 'r1', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']);
            expect(records[0]!.boostUris).toHaveLength(2);

            const accepted = await getBoostRecipientsWithChildren(parent, {
                limit: 50,
                domain,
                includeUnacceptedBoosts: false,
            });
            expect(ids(accepted)).toEqual(['r0', 'r1', 'r4', 'r6', 'r7']);

            const filtered = await getBoostRecipientsWithChildren(parent, {
                limit: 50,
                domain,
                profileQuery: { profileId: { $in: ['r8', 'r0', 'no-profile-2'] } },
            });
            expect(ids(filtered)).toEqual(['r0', 'r8']);
        });

        it('pages by profileId cursor', async () => {
            const { parent } = await seedFamily();

            const page = await getBoostRecipientsWithChildren(parent, {
                limit: 2,
                cursor: 'r3',
                domain,
            });
            expect(ids(page)).toEqual(['r4', 'r5']);

            const tail = await getBoostRecipientsWithChildren(parent, {
                limit: 50,
                cursor: 'r5',
                domain,
            });
            expect(ids(tail)).toEqual(['r6', 'r7', 'r8']);

            const first = await getBoostRecipientsWithChildren(parent, { limit: 1, domain });
            expect(ids(first)).toEqual(['r0']);
        });

        it('counts distinct recipients with existing profiles', async () => {
            const { parent } = await seedFamily();

            expect(await countBoostRecipientsWithChildren(parent, {})).toBe(9);
            expect(
                await countBoostRecipientsWithChildren(parent, { includeUnacceptedBoosts: false })
            ).toBe(6);
            expect(
                await countBoostRecipientsWithChildren(parent, {
                    profileQuery: { profileId: 'r2' },
                })
            ).toBe(1);
            expect(
                await countBoostRecipientsWithChildren(parent, {
                    includeUnacceptedBoosts: false,
                    profileQuery: { profileId: { $in: ['r3', 'r5', 'r8', 'r6'] } },
                })
            ).toBe(1);
        });
    });
});
