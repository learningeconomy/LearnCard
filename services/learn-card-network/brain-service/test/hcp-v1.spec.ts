import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { Profile } from '@models';
import { neogma } from '@instance';

import { getClient, getUser } from './helpers/getClient';

const PURPOSE = 'https://purpose.example/tutoring';
const GENERAL = 'https://hcp.example/spec/profiles/general-context/2.0';
const LABELS = [
    'HcpV1ContextEntry',
    'HcpV1EntryVersion',
    'HcpV1EntryRef',
    'HcpV1Grant',
    'HcpV1Event',
];

let subject: Awaited<ReturnType<typeof getUser>>;
let agent: Awaited<ReturnType<typeof getUser>>;
let otherAgent: Awaited<ReturnType<typeof getUser>>;
let readOnlyToken: Awaited<ReturnType<typeof getUser>>;

const entry = (subjectDid: string, value: string, extra: Record<string, unknown> = {}) => ({
    schema: 'https://hcp.example/spec/entry/2.0' as const,
    subject: { id: subjectDid },
    content: { profile: GENERAL as typeof GENERAL, value },
    classification: { categories: ['education_learner_profile' as const] },
    assertion: { declarationType: 'person-declared' as const },
    record: { provenance: { source: 'person-input' } },
    ...extra,
});

const resetHcp = async (): Promise<void> => {
    await neogma.queryRunner.run(
        'MATCH (n) WHERE any(label IN labels(n) WHERE label IN $labels) DETACH DELETE n',
        { labels: LABELS }
    );
};

describe('HCP v1 router (hcp.v1.*)', () => {
    beforeAll(async () => {
        subject = await getUser('a'.repeat(64));
        agent = await getUser('b'.repeat(64));
        otherAgent = await getUser('e'.repeat(64));
        readOnlyToken = await getUser('a'.repeat(64), 'credentials:read');
    });

    beforeEach(async () => {
        await resetHcp();
        await Profile.delete({ detach: true, where: {} });
        await subject.clients.fullAuth.profile.createProfile({ profileId: 'hcp-subject' });
    });

    it('serves discovery without authentication', async () => {
        const meta = await getClient().hcp.v1.meta();
        expect(meta).toMatchObject({ api_version: 'v1', hcp_version: '2.0-draft-3' });
        expect(meta.spec.commit).toBe('b790561830702c067cd7810c96ee78dd3d84741c');
    });

    it('requires DID auth with a valid challenge, and the hcp scope for API tokens', async () => {
        await expect(
            getClient().hcp.v1.entries.query({ query: 'x', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            agent.clients.partialAuth.hcp.v1.entries.query({ query: 'x', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyToken.clients.fullAuth.hcp.v1.entries.query({ query: 'x', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('runs the grant lifecycle end to end for a profile-less agent DID', async () => {
        const subjectDid = subject.learnCard.id.did();
        const agentDid = agent.learnCard.id.did();
        const own = subject.clients.fullAuth.hcp.v1;
        const asAgent = agent.clients.fullAuth.hcp.v1;

        await own.entries.create(entry(subjectDid, 'Learns best with worked examples'));
        await own.entries.create(
            entry(subjectDid, 'Has a peanut allergy', {
                classification: { categories: ['health_context'] },
            })
        );

        // No grant: the agent has no profile, so it cannot act as a subject either.
        await expect(
            asAgent.entries.query({ query: 'examples', purpose: PURPOSE })
        ).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: expect.stringMatching(/^scope-denied: /),
        });
        await expect(
            asAgent.grants.create({
                client: { id: agentDid, name: 'Self-granted' },
                access: [
                    {
                        actions: ['read'],
                        categories: ['education_learner_profile'],
                        purposes: [{ code: PURPOSE, description: 'Tutoring' }],
                    },
                ],
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const grant = await own.grants.create({
            client: { id: agentDid, name: 'Tutor Agent' },
            access: [
                {
                    actions: ['read', 'write'],
                    categories: ['education_learner_profile'],
                    purposes: [{ code: PURPOSE, description: 'Tutoring' }],
                },
            ],
        });
        expect(grant).toMatchObject({
            subject: { id: subjectDid },
            status: 'active',
            grantType: 'temporary',
        });
        await expect(asAgent.grants.get({ grantId: grant.grantId })).resolves.toMatchObject({
            grantId: grant.grantId,
        });
        await expect(
            otherAgent.clients.fullAuth.hcp.v1.entries.query({
                grantId: grant.grantId,
                query: 'examples',
                purpose: PURPOSE,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const result = await asAgent.entries.query({
            grantId: grant.grantId,
            query: 'examples',
            purpose: PURPOSE,
        });
        expect(result.categoriesSearched).toEqual(['education_learner_profile']);
        expect(result.entries).toHaveLength(1);
        const [disclosure] = result.entries;
        expect(disclosure).toHaveProperty('ref');
        expect(disclosure).not.toHaveProperty('id');
        const ref = (disclosure as { ref: string }).ref;

        await expect(
            asAgent.entries.query({
                grantId: grant.grantId,
                query: 'allergy',
                purpose: PURPOSE,
                categories: ['health_context'],
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const revised = await asAgent.entries.revise({
            grantId: grant.grantId,
            ref,
            expectedVersion: 1,
            content: { profile: GENERAL, value: 'Learns best with worked examples and diagrams' },
            reason: 'Observed in session',
            record: { provenance: { source: 'conversation' } },
        });
        expect(revised).toMatchObject({ ref, version: 2 });
        await expect(
            asAgent.entries.revise({
                grantId: grant.grantId,
                ref,
                expectedVersion: 1,
                content: { profile: GENERAL, value: 'stale' },
                reason: 'race',
                record: { provenance: { source: 'conversation' } },
            })
        ).rejects.toMatchObject({
            code: 'CONFLICT',
            message: expect.stringMatching(/^version-conflict: /),
        });

        await expect(
            asAgent.entries.withdraw({ grantId: grant.grantId, ref, reason: 'outdated' })
        ).resolves.toMatchObject({ ref, status: 'deleted' });
        await expect(
            asAgent.entries.withdraw({ grantId: grant.grantId, ref, reason: 'outdated' })
        ).resolves.toMatchObject({ status: 'deleted' });
        await expect(
            asAgent.entries.get({ grantId: grant.grantId, ref, purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const exported = await own.export({ includeVersions: true });
        const learner = exported.entries.find(e =>
            e.classification.categories.includes('education_learner_profile')
        );
        expect(learner?.record).toMatchObject({ status: 'deleted', version: 2 });
        expect(exported.versions.map(v => v.record.version)).toEqual([1]);
        await expect(asAgent.export({})).rejects.toMatchObject({ code: 'FORBIDDEN' });

        await asAgent.grants.revoke({ grantId: grant.grantId });
        await expect(own.grants.revoke({ grantId: grant.grantId })).resolves.toMatchObject({
            status: 'revoked',
        });
        await expect(
            asAgent.entries.query({ grantId: grant.grantId, query: 'examples', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(await own.grants.list()).toEqual([]);
        expect((await own.grants.list({ status: 'revoked' })).map(g => g.grantId)).toEqual([
            grant.grantId,
        ]);

        const audit = await own.audit.list({ limit: 100 });
        expect(audit.events.map(e => e.eventType).reverse()).toEqual([
            'context.created',
            'context.created',
            'grant.issued',
            'context.revised',
            'context.withdrawn',
            'context.exported',
            'grant.revoked',
        ]);
        await expect(asAgent.audit.list({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('rejects malformed requests at the boundary', async () => {
        const subjectDid = subject.learnCard.id.did();
        const own = subject.clients.fullAuth.hcp.v1;

        await expect(
            own.entries.create(entry(subjectDid, 'x', { classification: { categories: [] } }))
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            own.entries.create(
                entry(subjectDid, 'x', { assertion: { declarationType: 'model-inferred' } })
            )
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringMatching(/^malformed-request: /),
        });
        await expect(
            own.entries.get({ entryId: 'urn:uuid:a', ref: 'b', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('documents every v1 procedure in the OpenAPI document under /hcp/v1', async () => {
        const { openApiDocument } = await import('../src/openapi');
        const paths = Object.keys(openApiDocument.paths ?? {}).filter(path =>
            path.startsWith('/hcp/v1')
        );
        expect(paths.sort()).toEqual([
            '/hcp/v1/audit',
            '/hcp/v1/entries',
            '/hcp/v1/entries/get',
            '/hcp/v1/entries/query',
            '/hcp/v1/entries/revisions',
            '/hcp/v1/entries/withdraw',
            '/hcp/v1/export',
            '/hcp/v1/grants',
            '/hcp/v1/grants/{grantId}',
            '/hcp/v1/meta',
        ]);
    });
});
