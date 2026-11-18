/** LC-2422: the access log. Draft 3 §8.1 `context.read`, plus LearnCard read denials. */
import { describe, expect, it } from 'vitest';

import { QueryInputSchema, READ_DENIED_EVENT, type Disclosure, type Entry } from '../schemas';
import { createEntry, getEntry, queryEntries } from './entries';
import { listAudit } from './governance';
import { revokeGrant } from './grants';
import type { HcpV1Deps } from './deps';
import {
    CLIENT_DID,
    OTHER_PURPOSE,
    PURPOSE,
    SUBJECT_DID,
    client,
    entryInput,
    issueGrant,
    makeHarness,
    otherClient,
    subject,
} from './test-harness';

const DENIED = { type: 'scope-denied' };
const HOUR = 60 * 60 * 1000;

const query = (overrides: Record<string, unknown> = {}) =>
    QueryInputSchema.parse({ query: 'answers', purpose: PURPOSE, ...overrides });

type H = ReturnType<typeof makeHarness>;

const subjectCreate = async (h: H, ...args: Parameters<typeof entryInput>) =>
    (await createEntry(h.deps, subject, entryInput(...args))) as Entry;

/** The subject's audit log as they read it, newest first. */
const audit = async (h: H, eventTypes?: string[]) =>
    (
        await listAudit(h.deps, subject, {
            limit: 100,
            ...(eventTypes ? { eventTypes: eventTypes as never } : {}),
        })
    ).events;

const failingLog = (deps: HcpV1Deps): HcpV1Deps => ({
    ...deps,
    activity: {
        record: async () => {
            throw new Error('audit store unavailable');
        },
    },
});

describe('HCP v1 access log: context.read', () => {
    it("records a client's query with what it disclosed, by entry id, never ref or query text", async () => {
        const h = makeHarness();
        const goal = await subjectCreate(h, {
            value: 'answers about my goals at work',
            categories: ['goals_and_constraints', 'work_context'],
        });
        await subjectCreate(h, {
            value: 'answers about my asthma',
            categories: ['health_context'],
        });
        const grantId = await issueGrant(h.deps, {
            categories: ['goals_and_constraints', 'education_learner_profile'],
        });

        const result = await queryEntries(
            h.deps,
            client,
            query({ grantId, query: 'secret plans', purposeDescription: 'Plan my week' })
        );
        const [shown] = result.entries as Disclosure[];

        const [read] = await audit(h, ['context.read']);
        expect(read).toEqual({
            eventId: expect.stringMatching(/^urn:uuid:/),
            eventType: 'context.read',
            timestamp: result.timestamp,
            participants: {
                initiator: { role: 'context-client', id: CLIENT_DID },
                authorizingPrincipal: { id: SUBJECT_DID },
                provider: { id: 'did:web:brain.test' },
                retrievalId: result.retrievalId,
            },
            entryId: null,
            categories: ['goals_and_constraints'],
            purpose: PURPOSE,
            purposeDescription: 'Plan my week',
            grantId,
            disclosed: [{ entryId: goal.id, version: 1, useUntil: shown!.useUntil }],
            data: {
                maxEntries: 5,
                categoriesSearched: ['goals_and_constraints', 'education_learner_profile'],
                directives: [],
            },
        });
        expect(JSON.stringify(read)).not.toContain(shown!.ref);
        expect(JSON.stringify(read)).not.toContain('secret plans');
    });

    it('records a query that found nothing, with nothing disclosed', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);

        expect((await queryEntries(h.deps, client, query({ grantId }))).entries).toEqual([]);

        const [read] = await audit(h, ['context.read']);
        expect(read).toMatchObject({
            categories: [],
            disclosed: [],
            purposeDescription: null,
            data: { categoriesSearched: ['general_preferences'] },
        });
    });

    it("records a client's get entry with the entry id and the version disclosed", async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];

        const got = await getEntry(h.deps, client, { grantId, ref: found!.ref, purpose: PURPOSE });

        const [read] = await audit(h, ['context.read']);
        expect(read).toMatchObject({
            entryId: created.id,
            categories: ['general_preferences'],
            grantId,
            participants: { retrievalId: got.retrievalId },
            disclosed: [
                { entryId: created.id, version: 1, useUntil: (got.entry as Disclosure).useUntil },
            ],
            data: { directives: [] },
        });
        expect(read!.data).not.toHaveProperty('categoriesSearched');
    });

    it("records the subject's own query and get, with no copy limit", async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);

        await queryEntries(h.deps, subject, query());
        await getEntry(h.deps, subject, { entryId: created.id, purpose: PURPOSE });

        const reads = await audit(h, ['context.read']);
        expect(reads).toHaveLength(2);
        for (const read of reads) {
            expect(read).toMatchObject({
                participants: { initiator: { role: 'management-client', id: SUBJECT_DID } },
                grantId: null,
                disclosed: [{ entryId: created.id, version: 1 }],
            });
            expect(read!.disclosed![0]).not.toHaveProperty('useUntil');
        }
    });

    it('leaves read events out of lifecycle filters and lifecycle events out of read filters', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        await queryEntries(h.deps, client, query({ grantId }));

        expect((await audit(h)).map(e => e.eventType)).toEqual([
            'context.read',
            'grant.issued',
            'context.created',
        ]);
        expect((await audit(h, ['grant.issued'])).map(e => e.eventType)).toEqual(['grant.issued']);
        expect(
            (await listAudit(h.deps, subject, { limit: 10, grantId })).events.map(e => e.eventType)
        ).toEqual(['context.read', 'grant.issued']);
    });
});

describe('HCP v1 access log: a failed log write fails the read', () => {
    it('returns no entries from a query or get when the event cannot be recorded', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];
        const broken = failingLog(h.deps);

        await expect(queryEntries(broken, client, query({ grantId }))).rejects.toThrow(
            'audit store unavailable'
        );
        await expect(
            getEntry(broken, client, { grantId, ref: found!.ref, purpose: PURPOSE })
        ).rejects.toThrow('audit store unavailable');
        await expect(queryEntries(broken, subject, query())).rejects.toThrow(
            'audit store unavailable'
        );
    });

    it('still refuses a denied read when its denial cannot be recorded', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        await expect(
            queryEntries(failingLog(h.deps), client, query({ grantId, purpose: OTHER_PURPOSE }))
        ).rejects.toThrow();
    });
});

describe('HCP v1 access log: read denials (LearnCard extension)', () => {
    it("records a client's refused reads under its own grant, with the same scope-denied response", async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const otherGrant = await issueGrant(h.deps);
        const [found] = (await queryEntries(h.deps, client, query({ grantId: otherGrant })))
            .entries as Disclosure[];

        await expect(
            queryEntries(
                h.deps,
                client,
                query({ grantId, purpose: OTHER_PURPOSE, purposeDescription: 'Sell ads' })
            )
        ).rejects.toMatchObject(DENIED);
        await expect(
            queryEntries(h.deps, client, query({ grantId, categories: ['health_context'] }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            getEntry(h.deps, client, { grantId, ref: found!.ref, purpose: PURPOSE })
        ).rejects.toMatchObject(DENIED);

        const denials = await audit(h, [READ_DENIED_EVENT]);
        expect(denials).toHaveLength(3);
        const [byRef, byCategory, byPurpose] = denials;
        expect(byPurpose).toMatchObject({
            eventType: READ_DENIED_EVENT,
            participants: { initiator: { role: 'context-client', id: CLIENT_DID } },
            entryId: null,
            categories: [],
            purpose: OTHER_PURPOSE,
            purposeDescription: 'Sell ads',
            grantId,
            data: { operation: 'query', grantStatus: 'active' },
        });
        expect(byCategory).toMatchObject({ categories: ['health_context'] });
        // A ref from another grant names no entry under this one.
        expect(byRef).toMatchObject({ entryId: null, data: { operation: 'get' } });
        for (const denial of denials) {
            expect(denial).not.toHaveProperty('disclosed');
            expect(denial!.participants).not.toHaveProperty('retrievalId');
        }
        expect(await audit(h, ['context.read'])).toHaveLength(1);
    });

    it('records refusals under a revoked or expired grant with its status', async () => {
        const h = makeHarness();
        const revoked = await issueGrant(h.deps);
        await revokeGrant(h.deps, subject, revoked);
        const expiring = await issueGrant(h.deps);
        h.advance(4 * HOUR);

        await expect(
            queryEntries(h.deps, client, query({ grantId: revoked }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            queryEntries(h.deps, client, query({ grantId: expiring }))
        ).rejects.toMatchObject(DENIED);

        const denials = await audit(h, [READ_DENIED_EVENT]);
        expect(denials.map(e => [e.grantId, e.data.grantStatus])).toEqual([
            [expiring, 'expired'],
            [revoked, 'revoked'],
        ]);
    });

    it('records nothing for a caller with no grant, or with a grant issued to another client', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);

        await expect(queryEntries(h.deps, otherClient, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );
        await expect(queryEntries(h.deps, client, query())).rejects.toMatchObject(DENIED);
        await expect(
            queryEntries(h.deps, client, query({ grantId: 'urn:uuid:no-such-grant' }))
        ).rejects.toMatchObject(DENIED);

        expect(await audit(h, [READ_DENIED_EVENT, 'context.read'])).toEqual([]);
    });

    it('never logs a denial to the audit reader of another subject', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        await expect(
            queryEntries(h.deps, client, query({ grantId, purpose: OTHER_PURPOSE }))
        ).rejects.toMatchObject(DENIED);

        const someoneElse = {
            did: 'did:key:z6MkSomeoneElse',
            subjectDid: 'did:key:z6MkSomeoneElse',
        };
        expect((await listAudit(h.deps, someoneElse, { limit: 10 })).events).toEqual([]);
        await expect(listAudit(h.deps, client, { limit: 10 })).rejects.toMatchObject(DENIED);
    });
});
