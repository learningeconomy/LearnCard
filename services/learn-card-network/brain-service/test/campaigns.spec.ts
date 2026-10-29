import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import {
    CampaignAudienceSourceValidator,
    type CampaignAudienceInput,
    type CreateCampaignInput,
} from '@learncard/types';

import { neogma } from '@instance';
import cache from '@cache';
import { campaignsRouter } from '@routes/campaigns';
import { getLiveCampaignsForProfile } from '@accesslayer/campaign/read';
import { campaignTimeParams } from '@accesslayer/campaign/shared';
import { constructUri } from '@helpers/uri.helpers';
import { ensureCampaignConstraints } from '../src/models/campaign-constraints';

const domain = 'localhost%3A3000';
const tenant = resolveTenantFromRequest({}, 'learncard');
const did = (profileId: string): string => `did:key:${profileId}`;
const caller = (profileId: string, scope = '*:*', callerDomain = domain) =>
    campaignsRouter.createCaller({
        domain: callerDomain,
        tenant,
        user: { did: did(profileId), scope, isChallengeValid: true },
    });
const admin = caller('campaign-admin');
const learner = caller('learner');
const other = caller('other');
const draft = (overrides: Partial<CreateCampaignInput> = {}): CreateCampaignInput => ({
    id: 'pilot-clr',
    name: 'Pilot campaign',
    channels: ['inApp'],
    message: { title: 'Welcome' },
    ...overrides,
});
const audience = (source: CampaignAudienceInput['source']): CampaignAudienceInput => ({
    campaignId: 'pilot-clr',
    source,
});
const addLearner = async (): Promise<void> => {
    await admin.addAudience(audience({ type: 'dids', dids: [did('learner')] }));
};

beforeAll(async () => {
    await ensureCampaignConstraints();
});
beforeEach(async () => {
    await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
    await neogma.queryRunner.run(
        `UNWIND $profiles AS properties CREATE (p:Profile) SET p = properties`,
        {
            profiles: [
                'campaign-admin',
                'learner',
                'other',
                'pending',
                'revoked',
                'minor',
                'child',
                'unknown-dob',
                'managed-adult',
                'managed-service',
            ].map(profileId => ({
                profileId,
                did: did(profileId),
                displayName: profileId,
                shortBio: '',
                bio: '',
                type:
                    profileId === 'child'
                        ? 'child'
                        : profileId === 'managed-service'
                          ? 'organization'
                          : 'person',
                isServiceProfile: profileId === 'managed-service',
                dob:
                    profileId === 'minor'
                        ? '2020-01-01'
                        : profileId === 'unknown-dob'
                          ? ''
                          : '1990-01-01',
            })),
        }
    );
    for (const profileId of [
        'campaign-admin',
        'learner',
        'other',
        'minor',
        'child',
        'unknown-dob',
        'managed-adult',
        'managed-service',
    ]) {
        await cache.delete([`campaigns:user:${profileId}`]);
    }
});
afterAll(async () => {
    await neogma.driver.close();
});

describe('campaign lifecycle and access', () => {
    it('requires a signed-in admin for every management procedure', async () => {
        await expect(
            campaignsRouter.createCaller({ domain, tenant }).getMyCampaigns()
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(other.isAdmin()).resolves.toBe(false);
        await expect(admin.isAdmin()).resolves.toBe(true);
        for (const request of [
            () => other.create(draft()),
            () => other.get({ campaignId: 'pilot-clr' }),
            () => other.update({ campaignId: 'pilot-clr', updates: { name: 'No' } }),
            () => other.delete({ campaignId: 'pilot-clr' }),
            () => other.list(),
            () => other.setStatus({ campaignId: 'pilot-clr', status: 'live' }),
            () => other.previewAudience(audience({ type: 'dids', dids: [did('learner')] })),
            () => other.addAudience(audience({ type: 'dids', dids: [did('learner')] })),
            () => other.pageAudience({ campaignId: 'pilot-clr' }),
            () => other.getStats({ campaignId: 'pilot-clr' }),
        ])
            await expect(request()).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(caller('campaign-admin', '*:read').create(draft())).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(
            caller('learner', 'campaigns:read').enroll({ campaignId: 'pilot-clr' })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('forces message identity, enforces uniqueness, validates merged updates, and keeps archived campaigns immutable', async () => {
        const campaign = await admin.create(
            draft({ message: { id: 'different', title: 'Welcome' } })
        );
        expect(campaign.message.id).toBe('pilot-clr');
        await expect(admin.create(draft())).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            admin.update({ campaignId: campaign.id, updates: { channels: ['notify'] } })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        const updated = await admin.update({
            campaignId: campaign.id,
            updates: {
                message: { id: 'wrong', title: 'Changed' },
                startsAt: '2026-01-01T00:00:00Z',
                endsAt: '2027-01-01T00:00:00Z',
            },
        });
        expect(updated.message).toMatchObject({ id: campaign.id, title: 'Changed' });
        await expect(
            admin.update({ campaignId: campaign.id, updates: { startsAt: '2028-01-01T00:00:00Z' } })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect((await admin.get({ campaignId: campaign.id })).startsAt).toBe(
            '2026-01-01T00:00:00.000Z'
        );
        await admin.update({ campaignId: campaign.id, updates: { startsAt: null, endsAt: null } });
        expect(await admin.get({ campaignId: campaign.id })).not.toHaveProperty('startsAt');
        await admin.setStatus({ campaignId: campaign.id, status: 'archived' });
        await expect(
            admin.update({ campaignId: campaign.id, updates: { name: 'Changed' } })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            admin.setStatus({ campaignId: campaign.id, status: 'live' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(addLearner()).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await admin.delete({ campaignId: campaign.id });
        await expect(admin.get({ campaignId: campaign.id })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it.each(['live', 'paused'] as const)(
        'requires archiving a %s campaign before deletion and preserves audience and engagement on refusal',
        async status => {
            await admin.create(draft({ status: 'live' }));
            await addLearner();
            await learner.recordEvent({ campaignId: 'pilot-clr', event: 'shown' });
            if (status === 'paused') await admin.setStatus({ campaignId: 'pilot-clr', status });
            const before = await admin.get({ campaignId: 'pilot-clr' });
            const stats = await admin.getStats({ campaignId: 'pilot-clr' });

            await expect(admin.delete({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Archive live or paused campaigns before deleting them',
            });
            expect(await admin.get({ campaignId: 'pilot-clr' })).toEqual(before);
            expect(await admin.getStats({ campaignId: 'pilot-clr' })).toEqual(stats);
            const state = await neogma.queryRunner.run(
                `MATCH (:Profile {profileId: 'learner'})-[state:CAMPAIGN_STATE]->(:Campaign {id: 'pilot-clr'})
                 RETURN state.shownCount AS shownCount`
            );
            expect(state.records[0]!.get('shownCount').toNumber()).toBe(1);

            await admin.setStatus({ campaignId: 'pilot-clr', status: 'archived' });
            expect(await admin.delete({ campaignId: 'pilot-clr' })).toBe(true);
            await expect(admin.get({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        }
    );

    it('deletes draft campaigns and reports missing campaigns', async () => {
        await admin.create(draft());
        expect(await admin.delete({ campaignId: 'pilot-clr' })).toBe(true);
        await expect(admin.delete({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it.each(['live', 'paused'] as const)(
        'does not let a %s campaign roll back to draft and bypass archive-before-delete',
        async status => {
            await admin.create(draft({ status: 'live' }));
            if (status === 'paused') await admin.setStatus({ campaignId: 'pilot-clr', status });

            await expect(
                admin.setStatus({ campaignId: 'pilot-clr', status: 'draft' })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: `Campaign status cannot transition from ${status} to draft`,
            });
            await expect(
                admin.update({ campaignId: 'pilot-clr', updates: { status: 'draft' } })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(admin.delete({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
            expect(await admin.get({ campaignId: 'pilot-clr' })).toMatchObject({ status });
        }
    );

    it('paginates campaigns by immutable ID and filters status', async () => {
        await admin.create(draft({ id: 'aaa', status: 'live' }));
        await admin.create(draft({ id: 'bbb' }));
        const first = await admin.list({ limit: 1 });
        expect(first).toMatchObject({ hasMore: true, cursor: 'aaa', records: [{ id: 'aaa' }] });
        expect(await admin.list({ limit: 1, cursor: first.cursor })).toMatchObject({
            hasMore: false,
            records: [{ id: 'bbb' }],
        });
        expect((await admin.list({ status: 'live' })).records.map(item => item.id)).toEqual([
            'aaa',
        ]);
    });

    it('serializes concurrent creation and partial edits without losing fields', async () => {
        const creates = await Promise.allSettled([admin.create(draft()), admin.create(draft())]);
        expect(creates.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(creates.find(result => result.status === 'rejected')).toMatchObject({
            reason: { code: 'CONFLICT' },
        });
        await admin.update({
            campaignId: 'pilot-clr',
            updates: { status: 'live', selfEnroll: true, excludeMinors: false },
        });
        await Promise.all([
            admin.update({ campaignId: 'pilot-clr', updates: { name: 'Renamed' } }),
            admin.update({ campaignId: 'pilot-clr', updates: { message: { title: 'Updated' } } }),
        ]);
        expect(await admin.get({ campaignId: 'pilot-clr' })).toMatchObject({
            name: 'Renamed',
            status: 'live',
            selfEnroll: true,
            excludeMinors: false,
            message: { title: 'Updated' },
        });
    });
});

describe('campaign audiences', () => {
    it('deduplicates DID aliases and verified emails, applies minor policy, and pages eligible profiles', async () => {
        await admin.create(draft());
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'learner'}) CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {type:'email', value:'  Learner@Example.COM  ', isVerified:true})`
        );
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'other'}) CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {type:'email', value:'unverified@example.com', isVerified:false})`
        );
        const inputs = audience({
            type: 'dids',
            dids: [
                did('learner'),
                did('other'),
                `did:web:${domain}:users:learner`,
                did('minor'),
                did('child'),
                did('unknown-dob'),
            ],
        });
        expect(await admin.previewAudience(inputs)).toEqual({ count: 2 });
        expect((await admin.getStats({ campaignId: 'pilot-clr' })).audience).toBe(0);
        expect(await admin.addAudience(inputs)).toEqual({ count: 2 });
        expect(
            await admin.previewAudience(
                audience({
                    type: 'emails',
                    emails: ['LEARNER@example.com', 'unverified@example.com'],
                })
            )
        ).toEqual({ count: 1 });
        expect(
            await admin.addAudience(
                audience({
                    type: 'emails',
                    emails: ['LEARNER@example.com', 'unverified@example.com'],
                })
            )
        ).toEqual({ count: 1 });
        expect((await admin.getStats({ campaignId: 'pilot-clr' })).audience).toBe(2);
        const page = await admin.pageAudience({ campaignId: 'pilot-clr', limit: 1 });
        expect(page).toMatchObject({
            hasMore: true,
            cursor: 'learner',
            records: [{ profileId: 'learner' }],
        });
        expect(
            await admin.pageAudience({ campaignId: 'pilot-clr', cursor: page.cursor })
        ).toMatchObject({ hasMore: false, records: [{ profileId: 'other' }] });
        await admin.update({ campaignId: 'pilot-clr', updates: { excludeMinors: false } });
        expect(await admin.addAudience(inputs)).toEqual({ count: 4 });
        await admin.update({ campaignId: 'pilot-clr', updates: { excludeMinors: true } });
        expect((await admin.pageAudience({ campaignId: 'pilot-clr' })).records).toHaveLength(2);
    });

    it.each([
        ['localhost%3A3000', 'did:web:localhost%3A3000:users:learner'],
        ['network.learncard.app', 'did:web:network.learncard.app:users:learner'],
        [
            'pr-99.preview.learncard.ai:brain',
            'did:web:pr-99.preview.learncard.ai%3Abrain:users:learner',
        ],
    ])('matches the canonical did:web alias for %s', async (callerDomain, learnerDid) => {
        await admin.create(draft());
        const domainAdmin = caller('campaign-admin', '*:*', callerDomain);

        expect(
            await domainAdmin.previewAudience(audience({ type: 'dids', dids: [learnerDid] }))
        ).toEqual({ count: 1 });
    });

    it('treats managed human profiles as minors without classifying managed services as children', async () => {
        await admin.create(draft({ status: 'live', selfEnroll: true }));
        await neogma.queryRunner.run(
            `MATCH (adult:Profile {profileId: 'managed-adult'}),
                   (service:Profile {profileId: 'managed-service'}),
                   (admin:Profile {profileId: 'campaign-admin'})
             CREATE (:ProfileManager {id: 'guardian-manager', created: $now, managerType: 'guardian'})-[:MANAGES]->(adult)
             CREATE (service)-[:MANAGED_BY]->(admin)`,
            { now: new Date().toISOString() }
        );
        const input = audience({
            type: 'dids',
            dids: [did('managed-adult'), did('managed-service')],
        });

        expect(await admin.previewAudience(input)).toEqual({ count: 1 });
        await admin.update({ campaignId: 'pilot-clr', updates: { excludeMinors: false } });
        expect(await admin.previewAudience(input)).toEqual({ count: 2 });
        expect(await admin.addAudience(input)).toEqual({ count: 2 });
        await expect(
            caller('managed-adult').enroll({ campaignId: 'pilot-clr' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(caller('managed-service').enroll({ campaignId: 'pilot-clr' })).resolves.toBe(
            true
        );

        await admin.update({ campaignId: 'pilot-clr', updates: { excludeMinors: true } });
        expect(await caller('managed-adult').getMyCampaigns()).toEqual([]);
        expect(await caller('managed-service').getMyCampaigns()).toHaveLength(1);
    });

    it.each([null, '', 'unknown'])(
        'excludes unavailable birthdays (%s) from targeting, discovery, enrollment and events',
        async dob => {
            await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: 'unknown-dob'}) SET p.dob = $dob`,
                { dob }
            );
            const unknown = caller('unknown-dob');
            for (const excludeMinors of [true, false]) {
                const campaignId = `birthday-${excludeMinors}`;
                await admin.create(
                    draft({ id: campaignId, status: 'live', selfEnroll: true, excludeMinors })
                );
                const input = {
                    campaignId,
                    source: { type: 'dids' as const, dids: [did('unknown-dob')] },
                };
                expect(await admin.previewAudience(input)).toEqual({ count: 0 });
                expect(await admin.addAudience(input)).toEqual({ count: 0 });
                expect(await unknown.getMyCampaigns()).toEqual([]);
                await expect(unknown.enroll({ campaignId })).rejects.toMatchObject({
                    code: 'FORBIDDEN',
                });
                expect((await admin.getStats({ campaignId })).audience).toBe(0);

                // Existing membership must not bypass a missing birthday at read/event time.
                await neogma.queryRunner.run(
                    `MATCH (p:Profile {profileId: 'unknown-dob'}), (c:Campaign {id: $campaignId})
                     CREATE (p)-[:IN_CAMPAIGN_AUDIENCE]->(c)`,
                    { campaignId }
                );
                expect((await admin.pageAudience({ campaignId })).records).toEqual([]);
                expect(await unknown.getMyCampaigns()).toEqual([]);
                expect(await unknown.recordEvent({ campaignId, event: 'shown' })).toBe(false);
                expect((await admin.getStats({ campaignId })).shown).toBe(0);
            }
        }
    );

    it('matches profile and listing senders, deduplicates dual attribution, and preserves recipient identity', async () => {
        await admin.create(draft());
        await neogma.queryRunner.run(
            `CREATE (listing:AppStoreListing {listing_id:'transcript-app'}), (boost:Boost {id:'test-boost'})
             WITH listing, boost MATCH (sender:Profile {profileId:'campaign-admin'})
             UNWIND $ids AS id MATCH (p:Profile {profileId:id})
             CREATE (credential:Credential {id:id})-[:INSTANCE_OF]->(boost)
             CREATE (sender)-[sent:CREDENTIAL_SENT]->(credential)
             SET sent.to = id, sent.date = '2026-10-20T00:00:00.000Z', sent.\`metadata.kind\` = 'transcript',
                 sent.status = CASE WHEN id = 'revoked' THEN 'revoked' ELSE null END
             CREATE (listing)-[appSent:CREDENTIAL_SENT]->(credential) SET appSent = properties(sent)
             FOREACH (unused IN CASE WHEN id = 'pending' THEN [] ELSE [1] END |
                CREATE (credential)-[:CREDENTIAL_RECEIVED]->(p))`,
            { ids: ['learner', 'pending', 'revoked'] }
        );
        // A shared credential can have other recipients: only sent.to belongs to this send.
        await neogma.queryRunner.run(
            `MATCH (c:Credential {id:'learner'}), (p:Profile {profileId:'other'}) CREATE (c)-[:CREDENTIAL_RECEIVED]->(p)`
        );
        // Legacy and specialized paths can write a listing-only sent edge. The
        // shared learner credential above has both edges and must still count once.
        await neogma.queryRunner.run(
            `MATCH (listing:AppStoreListing {listing_id:'transcript-app'}),
                   (boost:Boost {id:'test-boost'}), (other:Profile {profileId:'other'})
             CREATE (listingOnly:Credential {id:'listing-only'})-[:INSTANCE_OF]->(boost)
             CREATE (listing)-[:CREDENTIAL_SENT {
                to:'other', date:'2026-10-20T00:00:00.000Z', \`metadata.kind\`:'listing-only'
             }]->(listingOnly)
             CREATE (listingOnly)-[:CREDENTIAL_RECEIVED]->(other)`
        );
        for (const identity of [
            { senderProfileId: 'campaign-admin' },
            { listingId: 'transcript-app' },
        ]) {
            const source = {
                type: 'credentialsSentBy' as const,
                ...identity,
                metadata: { kind: 'transcript' },
                since: '2026-10-19T00:00:00Z',
            };
            expect(await admin.previewAudience(audience(source))).toEqual({ count: 1 });
            expect(await admin.addAudience(audience(source))).toEqual({ count: 1 });
            expect(
                await admin.previewAudience(audience({ ...source, includePending: true }))
            ).toEqual({ count: 2 });
            expect(
                await admin.previewAudience(audience({ ...source, metadata: { kind: 'badge' } }))
            ).toEqual({ count: 0 });
            expect(
                await admin.previewAudience(audience({ ...source, since: '2026-10-21T00:00:00Z' }))
            ).toEqual({ count: 0 });
        }
        expect(
            await admin.previewAudience(
                audience({ type: 'credentialsSentBy', listingId: 'other-app' })
            )
        ).toEqual({ count: 0 });
        const boostSource = {
            type: 'boostRecipients' as const,
            boostUri: `lc:network:${domain}/trpc:boost:test-boost`,
        };
        expect(await admin.previewAudience(audience(boostSource))).toEqual({ count: 2 });
        expect(await admin.addAudience(audience({ ...boostSource, includePending: true }))).toEqual(
            { count: 3 }
        );
        for (const [callerDomain, boostUri] of [
            [
                'pr-99.preview.learncard.ai:brain',
                constructUri('boost', 'test-boost', 'pr-99.preview.learncard.ai:brain'),
            ],
            [
                'pr-99.preview.learncard.ai:brain',
                'lc:network:pr-99.preview.learncard.ai%3Abrain/trpc:boost:test-boost',
            ],
            ['network.learncard.app', constructUri('boost', 'test-boost', 'network.learncard.app')],
        ] as const) {
            const domainAdmin = caller('campaign-admin', '*:*', callerDomain);
            expect(
                await domainAdmin.previewAudience(audience({ type: 'boostRecipients', boostUri }))
            ).toEqual({ count: 2 });
        }
        expect((await admin.pageAudience({ campaignId: 'pilot-clr' })).records).toEqual([
            { profileId: 'learner', did: did('learner') },
            { profileId: 'other', did: did('other') },
            { profileId: 'pending', did: did('pending') },
        ]);
        expect((await admin.getStats({ campaignId: 'pilot-clr' })).audience).toBe(3);
        await expect(
            admin.previewAudience(
                audience({
                    ...boostSource,
                    boostUri: 'lc:network:foreign.example/trpc:boost:test-boost',
                })
            )
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await neogma.queryRunner.run(
            `MATCH (c:Credential {id:'learner'})-[received:CREDENTIAL_RECEIVED]->() SET received.status = 'revoked'`
        );
        expect(await admin.previewAudience(audience(boostSource))).toEqual({ count: 1 });
        await neogma.queryRunner.run(
            `MATCH (c:Credential {id:'pending'}), (p:Profile {profileId:'pending'}) CREATE (c)-[:CREDENTIAL_RECEIVED {status:'pending'}]->(p)`
        );
        expect(await admin.previewAudience(audience(boostSource))).toEqual({ count: 1 });
    });

    it('matches inbox claims by issuer and claim time, and rejects injection before querying', async () => {
        await admin.create(draft());
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId:'learner'}) CREATE (p)-[:CLAIMED_INBOX_CREDENTIAL {timestamp:'2026-10-20T00:00:00.000Z'}]->(:InboxCredential {id:'inbox', issuerDid:'did:key:issuer'})`
        );
        const source = {
            type: 'inboxClaims' as const,
            issuerDid: 'did:key:issuer',
            since: '2026-10-19T00:00:00Z',
        };
        expect(await admin.previewAudience(audience(source))).toEqual({ count: 1 });
        expect(await admin.addAudience(audience(source))).toEqual({ count: 1 });
        expect(
            await admin.previewAudience(audience({ ...source, issuerDid: 'did:key:other' }))
        ).toEqual({ count: 0 });
        expect(
            await admin.previewAudience(audience({ ...source, since: '2026-10-21T00:00:00Z' }))
        ).toEqual({ count: 0 });
        const unsafe = {
            type: 'credentialsSentBy' as const,
            senderProfileId: 'campaign-admin',
            metadata: { 'kind`]) MATCH (n) DETACH DELETE n //': 'x' },
        };
        expect(CampaignAudienceSourceValidator.safeParse(unsafe).success).toBe(false);
        await expect(admin.addAudience(audience(unsafe))).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect((await admin.get({ campaignId: 'pilot-clr' })).id).toBe('pilot-clr');
    });
});

describe('campaign eligibility and engagement', () => {
    it('applies live windows, channels, membership, message enablement and current minor eligibility', async () => {
        await admin.create(
            draft({
                status: 'live',
                startsAt: '2026-10-20T00:00:00Z',
                endsAt: '2026-10-23T00:00:00Z',
            })
        );
        await addLearner();
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2026-10-19T23:59:59Z'))
        ).toEqual([]);
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2026-10-20T00:00:00Z'))
        ).toHaveLength(1);
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2026-10-23T00:00:00Z'))
        ).toEqual([]);
        expect(await other.getMyCampaigns()).toEqual([]);
        await admin.update({ campaignId: 'pilot-clr', updates: { startsAt: null, endsAt: null } });
        expect(await learner.getMyCampaigns()).toHaveLength(1);
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId:'learner'}) SET p.type = 'child'`
        );
        expect(await learner.getMyCampaigns()).toEqual([]);
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId:'learner'}) SET p.type = 'person'`
        );
        await admin.setStatus({ campaignId: 'pilot-clr', status: 'paused' });
        expect(await learner.getMyCampaigns()).toEqual([]);
        await admin.update({
            campaignId: 'pilot-clr',
            updates: { status: 'live', message: { title: 'Disabled', enabled: false } },
        });
        expect(await learner.getMyCampaigns()).toEqual([]);
        await admin.update({
            campaignId: 'pilot-clr',
            updates: {
                message: { title: 'Notify' },
                channels: ['notify'],
                notification: { title: 'Hi', body: 'Hello' },
            },
        });
        expect(await learner.getMyCampaigns()).toEqual([]);
    });

    it.each(['not-json', JSON.stringify({ id: 'broken-campaign' })])(
        'skips a malformed stored definition without breaking other campaign discovery',
        async invalidDefinition => {
            await admin.create(draft({ id: 'valid-campaign', status: 'live' }));
            await admin.create(draft({ id: 'broken-campaign', status: 'live' }));
            for (const campaignId of ['valid-campaign', 'broken-campaign']) {
                await admin.addAudience({
                    campaignId,
                    source: { type: 'dids', dids: [did('learner')] },
                });
            }
            await neogma.queryRunner.run(
                `MATCH (c:Campaign {id: 'broken-campaign'}) SET c.definition = $definition`,
                { definition: invalidDefinition }
            );

            expect((await learner.getMyCampaigns()).map(item => item.campaign.id)).toEqual([
                'valid-campaign',
            ]);
        }
    );

    it('supports self-enrollment only while live/enabled and never for known minors', async () => {
        await admin.create(draft({ status: 'live', selfEnroll: true, excludeMinors: false }));
        expect(await learner.getMyCampaigns()).toHaveLength(1);
        expect(await learner.recordEvent({ campaignId: 'pilot-clr', event: 'shown' })).toBe(false);
        await expect(caller('minor').enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await expect(caller('child').enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await Promise.all(
            Array.from({ length: 5 }, () => learner.enroll({ campaignId: 'pilot-clr' }))
        );
        expect(await admin.getStats({ campaignId: 'pilot-clr' })).toMatchObject({
            audience: 1,
            enrolled: 1,
        });
        await admin.addAudience(audience({ type: 'dids', dids: [did('learner')] }));
        expect((await admin.getStats({ campaignId: 'pilot-clr' })).enrolled).toBe(1);
        await admin.setStatus({ campaignId: 'pilot-clr', status: 'paused' });
        await expect(other.enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await admin.update({
            campaignId: 'pilot-clr',
            updates: { status: 'live', selfEnroll: false },
        });
        await expect(other.enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });

    it('rejects disabled and out-of-window enrollment and never stores a supplied credential payload', async () => {
        await admin.create(
            draft({ status: 'live', selfEnroll: true, startsAt: '2999-01-01T00:00:00Z' })
        );
        await expect(learner.enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await admin.update({
            campaignId: 'pilot-clr',
            updates: { startsAt: null, endsAt: '2000-01-01T00:00:00Z' },
        });
        await expect(learner.enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await admin.update({
            campaignId: 'pilot-clr',
            updates: { endsAt: null, message: { title: 'Disabled', enabled: false } },
        });
        await expect(learner.enroll({ campaignId: 'pilot-clr' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        const unsolicited = { campaignId: 'pilot-clr', credential: { issuer: 'did:key:private' } };
        await expect(learner.enroll(unsolicited)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(await admin.getStats({ campaignId: 'pilot-clr' })).toMatchObject({
            audience: 0,
            enrolled: 0,
        });
    });

    it.each(['missing campaign', 'nonmember', 'age-ineligible member'])(
        'does not write profile properties or campaign state for a rejected event: %s',
        async scenario => {
            await admin.create(draft({ status: 'live' }));
            await addLearner();
            const profileId = scenario === 'age-ineligible member' ? 'learner' : 'other';
            const actor = caller(profileId);
            if (scenario === 'age-ineligible member') {
                await neogma.queryRunner.run(
                    `MATCH (p:Profile {profileId: $profileId}) REMOVE p.dob`,
                    { profileId }
                );
            }
            await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profileId}) SET p.campaignStateLock = 17`,
                { profileId }
            );
            const readProfile = async (): Promise<Record<string, unknown>> => {
                const result = await neogma.queryRunner.run(
                    `MATCH (p:Profile {profileId: $profileId}) RETURN properties(p) AS profile`,
                    { profileId }
                );
                return result.records[0]!.get('profile');
            };
            const before = await readProfile();
            const campaignId = scenario === 'missing campaign' ? 'missing' : 'pilot-clr';
            expect(await actor.recordEvent({ campaignId, event: 'shown' })).toBe(false);
            expect(await readProfile()).toEqual(before);
            expect((await admin.getStats({ campaignId: 'pilot-clr' })).shown).toBe(0);
        }
    );

    it.each([
        ['paused', { status: 'paused' as const }],
        ['not started', { status: 'live' as const, startsAt: '2999-01-01T00:00:00Z' }],
        ['ended', { status: 'live' as const, endsAt: '2000-01-01T00:00:00Z' }],
    ])('does not write profile or engagement state when a campaign is %s', async (_, options) => {
        await admin.create(draft(options));
        await addLearner();
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'learner'}) SET p.campaignStateLock = 17`
        );

        expect(await learner.recordEvent({ campaignId: 'pilot-clr', event: 'shown' })).toBe(false);
        const result = await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'learner'})
             OPTIONAL MATCH (p)-[state:CAMPAIGN_STATE]->(:Campaign {id: 'pilot-clr'})
             RETURN p.campaignStateLock AS lockVersion, state`
        );
        expect(result.records[0]!.get('lockVersion').toNumber()).toBe(17);
        expect(result.records[0]!.get('state')).toBeNull();
    });

    it('persists shared state and counts unique engaged profiles under concurrent shown events', async () => {
        await admin.create(draft({ status: 'live' }));
        await addLearner();
        expect(await other.recordEvent({ campaignId: 'pilot-clr', event: 'shown' })).toBe(false);
        await learner.recordEvent({ campaignId: 'pilot-clr', event: 'shown' });
        const first = (await learner.getMyCampaigns())[0]!.state.firstShownAt;
        await Promise.all(
            Array.from({ length: 6 }, () =>
                learner.recordEvent({ campaignId: 'pilot-clr', event: 'shown' })
            )
        );
        for (const event of ['clicked', 'dismissed', 'converted'] as const)
            await learner.recordEvent({ campaignId: 'pilot-clr', event });
        const anotherDevice = caller('learner');
        expect((await anotherDevice.getMyCampaigns())[0]!.state).toMatchObject({
            firstShownAt: first,
            shownCount: 7,
            clickedAt: expect.any(String),
            dismissedAt: expect.any(String),
            convertedAt: expect.any(String),
        });
        expect(await admin.getStats({ campaignId: 'pilot-clr' })).toEqual({
            audience: 1,
            enrolled: 0,
            notified: 0,
            shown: 1,
            clicked: 1,
            dismissed: 1,
            converted: 1,
        });
    });

    it('enforces a combined 60-call user budget without counting admin operations', async () => {
        for (let index = 0; index < 60; index += 1) await learner.getMyCampaigns();
        await expect(learner.isAdmin()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        await expect(other.getMyCampaigns()).resolves.toEqual([]);
        await expect(admin.create(draft())).resolves.toMatchObject({ id: 'pilot-clr' });
    });

    it('uses the exact UTC eighteenth birthday cutoff', async () => {
        expect(campaignTimeParams(new Date('2026-10-22T23:59:59Z')).adultCutoff).toBe('2008-10-22');
        await admin.create(draft({ status: 'live', selfEnroll: true }));
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId:'learner'}) SET p.dob = '2008-10-22'`
        );
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2026-10-22T00:00:00Z'))
        ).toHaveLength(1);
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2026-10-21T23:59:59Z'))
        ).toEqual([]);
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId:'learner'}) SET p.dob = '2010-03-01'`
        );
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2028-02-29T23:59:59Z'))
        ).toEqual([]);
        expect(
            await getLiveCampaignsForProfile('learner', new Date('2028-03-01T00:00:00Z'))
        ).toHaveLength(1);
    });
});
