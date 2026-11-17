import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';

import { Profile } from '@models';
import { neogma } from '@instance';
import { setValidChallengeForDid } from '@cache/challenges';
import { deleteProfile } from '@accesslayer/profile/delete';
import { getProfileByProfileId } from '@accesslayer/profile/read';

import { appRouter, createContext } from '../src/app';
import { getClient, getUser } from './helpers/getClient';

const PURPOSE = 'https://purpose.example/tutoring';
const GENERAL = 'https://hcp.example/spec/profiles/general-context/2.0';
const BADGES = 'https://learncard.com/hcp/categories/badges';
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
    classification: { categories: ['education_learner_profile'] },
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
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED', hcp: { type: 'invalid-token' } });
        await expect(
            agent.clients.partialAuth.hcp.v1.entries.query({ query: 'x', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyToken.clients.fullAuth.hcp.v1.entries.query({ query: 'x', purpose: PURPOSE })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            hcp: { type: 'invalid-token', detail: 'This operation requires hcp:read scope' },
        });
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
            hcp: {
                type: 'scope-denied',
                detail: "The request is outside the caller's grant, or the entry does not exist.",
            },
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
        ).rejects.toMatchObject({ code: 'CONFLICT', hcp: { type: 'version-conflict' } });

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
        ).rejects.toMatchObject({ code: 'BAD_REQUEST', hcp: { type: 'malformed-request' } });
        await expect(
            own.entries.create(
                entry(subjectDid, 'x', { assertion: { declarationType: 'model-inferred' } })
            )
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'model-inferred entries require assertion.confidence.',
            hcp: {
                type: 'malformed-request',
                detail: 'model-inferred entries require assertion.confidence.',
            },
        });
        await expect(
            own.entries.get({ entryId: 'urn:uuid:a', ref: 'b', purpose: PURPOSE })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('stores, queries and grants custom categories through the router (Draft 3 §4.5)', async () => {
        const subjectDid = subject.learnCard.id.did();
        const own = subject.clients.fullAuth.hcp.v1;
        const asAgent = agent.clients.fullAuth.hcp.v1;

        await own.entries.create(
            entry(subjectDid, 'Earned the robotics badge', {
                classification: { categories: [BADGES] },
            })
        );
        await own.entries.create(entry(subjectDid, 'Learns robotics with worked examples'));

        const mine = await own.entries.query({ query: 'robotics', purpose: PURPOSE });
        expect(mine.entries).toHaveLength(2);
        expect(mine.categoriesSearched).toContain(BADGES);

        const grant = await own.grants.create({
            client: { id: agent.learnCard.id.did(), name: 'Badge Agent' },
            access: [
                {
                    actions: ['read'],
                    categories: [BADGES],
                    purposes: [{ code: PURPOSE, description: 'Tutoring' }],
                },
            ],
        });
        expect(grant.scopes).toEqual([]);
        const read = await asAgent.entries.query({
            grantId: grant.grantId,
            query: 'robotics',
            purpose: PURPOSE,
        });
        expect(read.entries.map(e => e.content.value)).toEqual(['Earned the robotics badge']);
        await expect(
            asAgent.entries.query({
                grantId: grant.grantId,
                query: 'robotics',
                purpose: PURPOSE,
                categories: ['education_learner_profile'],
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN', hcp: { type: 'scope-denied' } });
        await expect(
            own.entries.create(
                entry(subjectDid, 'x', { classification: { categories: ['urn:learncard:x'] } })
            )
        ).rejects.toMatchObject({ code: 'BAD_REQUEST', hcp: { type: 'malformed-request' } });
    });

    describe('profile delete cascade', () => {
        const PURPOSE_GRANT = [{ code: PURPOSE, description: 'Tutoring' }];

        /** Counts HcpV1 nodes for a subject; refs are reached through the subject's grants. */
        const hcpNodes = async (subjectDid: string, grantIds: string[]) => {
            const result = await neogma.queryRunner.run(
                `UNWIND $labels AS label
                CALL (label) {
                    MATCH (n) WHERE label IN labels(n)
                      AND (n.subjectDid = $subjectDid OR n.grantId IN $grantIds)
                    RETURN count(n) AS c
                }
                RETURN label, c`,
                { labels: LABELS, subjectDid, grantIds }
            );
            return Object.fromEntries(
                result.records.map(r => [r.get('label'), Number(r.get('c'))])
            );
        };

        /** Entries with a revision, a grant the agent reads under (refs), and audit events. */
        const seed = async (user: typeof subject, value: string): Promise<string> => {
            const did = user.learnCard.id.did();
            const own = user.clients.fullAuth.hcp.v1;
            const created = await own.entries.create(entry(did, value));
            await own.entries.revise({
                entryId: (created as { id: string }).id,
                expectedVersion: 1,
                content: { profile: GENERAL, value: `${value}, revised` },
                reason: 'Updated',
                record: { provenance: { source: 'person-input' } },
            });
            const grant = await own.grants.create({
                client: { id: agent.learnCard.id.did(), name: 'Tutor Agent' },
                access: [
                    {
                        actions: ['read'],
                        categories: ['education_learner_profile'],
                        purposes: PURPOSE_GRANT,
                    },
                ],
            });
            const read = await agent.clients.fullAuth.hcp.v1.entries.query({
                grantId: grant.grantId,
                query: value.split(' ')[0]!,
                purpose: PURPOSE,
            });
            expect(read.entries).toHaveLength(1);
            return grant.grantId;
        };

        it("deletes every HcpV1 node of the profile through the real route, and no one else's", async () => {
            await otherAgent.clients.fullAuth.profile.createProfile({ profileId: 'hcp-other' });
            const profile = await getProfileByProfileId('hcp-subject');
            const mineDid = subject.learnCard.id.did();
            const theirsDid = otherAgent.learnCard.id.did();
            const mineGrant = await seed(subject, 'Worked examples help');
            const theirsGrant = await seed(otherAgent, 'Diagrams help');

            // The cascade's key is exactly the subjectDid HCP stored for this profile.
            expect(profile?.did).toBe(mineDid);
            const before = await hcpNodes(mineDid, [mineGrant]);
            expect(before).toEqual({
                HcpV1ContextEntry: 1,
                HcpV1EntryVersion: 2,
                HcpV1EntryRef: 1,
                HcpV1Grant: 1,
                HcpV1Event: 3,
            });
            const theirsBefore = await hcpNodes(theirsDid, [theirsGrant]);
            expect(theirsBefore).toEqual(before);

            await expect(subject.clients.fullAuth.profile.deleteProfile()).resolves.toBe(true);

            expect(await getProfileByProfileId('hcp-subject')).toBeFalsy();
            expect(await hcpNodes(mineDid, [mineGrant])).toEqual({
                HcpV1ContextEntry: 0,
                HcpV1EntryVersion: 0,
                HcpV1EntryRef: 0,
                HcpV1Grant: 0,
                HcpV1Event: 0,
            });
            expect(await hcpNodes(theirsDid, [theirsGrant])).toEqual(theirsBefore);
        });

        it('keeps the profile when the HCP cascade fails', async () => {
            const profile = await getProfileByProfileId('hcp-subject');
            await seed(subject, 'Worked examples help');
            const session = vi.spyOn(neogma.driver, 'session').mockImplementationOnce(() => {
                throw new Error('neo4j unavailable');
            });
            try {
                await expect(deleteProfile(profile!)).rejects.toThrow('neo4j unavailable');
            } finally {
                session.mockRestore();
            }
            expect(await getProfileByProfileId('hcp-subject')).toBeTruthy();
            const left = await subject.clients.fullAuth.hcp.v1.entries.query({
                query: 'examples',
                purpose: PURPOSE,
            });
            expect(left.entries).toHaveLength(1);
        });
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

describe('HCP v1 Core errors over HTTP (Draft 3 §5.5)', () => {
    let server: FastifyInstance;

    const bearer = async (user: Awaited<ReturnType<typeof getUser>>): Promise<string> => {
        const challenge = randomUUID();
        await setValidChallengeForDid(user.learnCard.id.did(), challenge);
        const token = await user.learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        return `Bearer ${token}`;
    };

    /** OpenAPI: POST /api/hcp/v1/...; the error body is the tRPC error shape. */
    const rest = async (path: string, body: object, user?: Awaited<ReturnType<typeof getUser>>) => {
        const response = await server.inject({
            method: 'POST',
            url: `/api/hcp/v1${path}`,
            payload: body,
            headers: user ? { authorization: await bearer(user) } : {},
        });
        return { status: response.statusCode, body: response.json() };
    };

    /** tRPC HTTP: the error is `{ error: shape }`. */
    const trpcQuery = async (
        procedure: string,
        input: object,
        user?: Awaited<ReturnType<typeof getUser>>
    ) => {
        const response = await server.inject({
            method: 'GET',
            url: `/trpc/hcp.v1.${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`,
            headers: user ? { authorization: await bearer(user) } : {},
        });
        return { status: response.statusCode, body: response.json() };
    };

    beforeAll(async () => {
        subject = await getUser('a'.repeat(64));
        agent = await getUser('b'.repeat(64));
        server = Fastify();
        await server.register(fastifyTRPCOpenApiPlugin, {
            basePath: '/api',
            router: appRouter,
            createContext,
        });
        await server.register(fastifyTRPCPlugin, {
            prefix: '/trpc',
            trpcOptions: { router: appRouter, createContext },
        });
    });

    afterAll(async () => {
        await server.close();
    });

    beforeEach(async () => {
        await resetHcp();
        await Profile.delete({ detach: true, where: {} });
        await subject.clients.fullAuth.profile.createProfile({ profileId: 'hcp-subject' });
    });

    const QUERY = { query: 'examples', purpose: PURPOSE };

    it('invalid-token: no DID auth', async () => {
        const viaRest = await rest('/entries/query', QUERY);
        expect(viaRest.status).toBe(401);
        expect(viaRest.body).toMatchObject({
            code: 'UNAUTHORIZED',
            data: {
                hcp: {
                    type: 'invalid-token',
                    detail: 'Missing, malformed, or expired authorization evidence.',
                },
            },
        });

        const viaTrpc = await trpcQuery('entries.query', QUERY);
        expect(viaTrpc.status).toBe(401);
        expect(viaTrpc.body.error.data).toMatchObject({
            code: 'UNAUTHORIZED',
            hcp: { type: 'invalid-token' },
        });
    });

    it('scope-denied: an agent without a grant', async () => {
        const viaRest = await rest('/entries/query', QUERY, agent);
        expect(viaRest.status).toBe(403);
        expect(viaRest.body).toMatchObject({
            code: 'FORBIDDEN',
            message: "The request is outside the caller's grant, or the entry does not exist.",
            data: {
                hcp: {
                    type: 'scope-denied',
                    detail: "The request is outside the caller's grant, or the entry does not exist.",
                },
            },
        });

        const viaTrpc = await trpcQuery('entries.query', QUERY, agent);
        expect(viaTrpc.status).toBe(403);
        expect(viaTrpc.body.error.data.hcp).toEqual({
            type: 'scope-denied',
            detail: "The request is outside the caller's grant, or the entry does not exist.",
        });
    });

    it('malformed-request: a service rule and a schema failure', async () => {
        const subjectDid = subject.learnCard.id.did();
        const rule = await rest(
            '/entries',
            entry(subjectDid, 'x', { assertion: { declarationType: 'model-inferred' } }),
            subject
        );
        expect(rule.status).toBe(400);
        expect(rule.body.data.hcp).toEqual({
            type: 'malformed-request',
            detail: 'model-inferred entries require assertion.confidence.',
        });

        const schema = await rest(
            '/entries',
            entry(subjectDid, 'x', { classification: { categories: ['not_a_category'] } }),
            subject
        );
        expect(schema.status).toBe(400);
        expect(schema.body).toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Input validation failed',
            data: {
                hcp: {
                    type: 'malformed-request',
                    detail: expect.stringMatching(/^classification\.categories\.0: /),
                },
            },
        });
        expect(schema.body.issues).toHaveLength(1);
    });

    it('version-conflict: a stale expectedVersion', async () => {
        const subjectDid = subject.learnCard.id.did();
        const created = await rest('/entries', entry(subjectDid, 'Learns by doing'), subject);
        expect(created.status).toBe(200);
        const revise = (expectedVersion: number) => ({
            entryId: created.body.id,
            expectedVersion,
            content: { profile: GENERAL, value: 'Learns by doing and reading' },
            reason: 'Updated',
            record: { provenance: { source: 'person-input' } },
        });
        expect((await rest('/entries/revisions', revise(1), subject)).status).toBe(200);

        const stale = await rest('/entries/revisions', revise(1), subject);
        expect(stale.status).toBe(409);
        expect(stale.body).toMatchObject({
            code: 'CONFLICT',
            data: {
                hcp: {
                    type: 'version-conflict',
                    detail: "expectedVersion is not the entry's current version.",
                },
            },
        });
    });

    it('leaves other routes without data.hcp', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/trpc/profile.getProfile`,
        });
        expect(response.statusCode).toBe(401);
        expect(response.json().error.data).not.toHaveProperty('hcp');
    });
});
