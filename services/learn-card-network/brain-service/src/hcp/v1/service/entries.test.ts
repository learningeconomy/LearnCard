import { describe, expect, it, vi } from 'vitest';

import type { StoredEvent } from '../store/port';
import {
    GENERAL_CONTEXT_PROFILE,
    QueryInputSchema,
    READ_DENIED_EVENT,
    ReviseEntryInputSchema,
    type Disclosure,
    type Entry,
} from '../schemas';
import { createEntry, getEntry, queryEntries, reviseEntry, withdrawEntry } from './entries';
import { exportContext } from './governance';
import { revokeGrant } from './grants';
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

const revision = (overrides: Record<string, unknown>) =>
    ReviseEntryInputSchema.parse({
        expectedVersion: 1,
        content: { profile: GENERAL_CONTEXT_PROFILE, value: 'Prefers detailed answers' },
        reason: 'Changed my mind',
        record: { provenance: { source: 'person-input' } },
        ...overrides,
    });

const subjectCreate = async (
    h: ReturnType<typeof makeHarness>,
    ...args: Parameters<typeof entryInput>
) => (await createEntry(h.deps, subject, entryInput(...args))) as Entry;

describe('HCP v1 entries: the Context Subject', () => {
    it('creates, queries and gets their own entries without a grant', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);

        expect(created).toMatchObject({
            schema: 'https://hcp.example/spec/entry/2.0',
            type: ['ContextEntry'],
            subject: { id: SUBJECT_DID, relationship: null },
            classification: { categories: ['general_preferences'], dimension: null },
            record: {
                status: 'active',
                version: 1,
                provenance: {
                    assertedBy: { id: SUBJECT_DID, assurance: 'authenticated' },
                    submittedByClient: { id: SUBJECT_DID },
                    authorizedUnder: null,
                    recordedByProvider: 'did:web:brain.test',
                },
            },
        });
        expect(created.id).toMatch(/^urn:uuid:/);

        const result = await queryEntries(h.deps, subject, query());
        expect(result.entries).toEqual([created]);
        expect(result.categoriesSearched).toHaveLength(9);

        const got = await getEntry(h.deps, subject, { entryId: created.id, purpose: PURPOSE });
        expect(got.entry).toEqual(created);
        expect(got.minimization).toEqual({ method: 'none' });

        const events = await h.store.listEvents(SUBJECT_DID, {}, { limit: 10 });
        expect(events.map(e => e.eventType)).toEqual([
            'context.read',
            'context.read',
            'context.created',
        ]);
    });

    it('rejects a write about another subject', async () => {
        const h = makeHarness();
        await expect(
            createEntry(h.deps, subject, entryInput({ subject: { id: 'did:key:z6MkSomeoneElse' } }))
        ).rejects.toMatchObject(DENIED);
    });

    it('enforces the confidence rule for declaration types', async () => {
        const h = makeHarness();
        await expect(
            createEntry(
                h.deps,
                subject,
                entryInput({
                    assertion: { declarationType: 'model-inferred' },
                    record: {
                        provenance: {
                            source: 'conversation',
                            assertedBy: { id: 'did:key:z6MkModel' },
                        },
                    },
                })
            )
        ).rejects.toMatchObject({ type: 'malformed-request' });
        await expect(
            createEntry(
                h.deps,
                subject,
                entryInput({
                    assertion: { declarationType: 'person-declared', confidence: 'high' },
                })
            )
        ).rejects.toMatchObject({ type: 'malformed-request' });
    });
});

describe('HCP v1 entries: Context Client policy', () => {
    it('denies a client without a grant', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        await expect(queryEntries(h.deps, client, query())).rejects.toMatchObject(DENIED);
        await expect(createEntry(h.deps, client, entryInput())).rejects.toMatchObject(DENIED);
    });

    it('denies a grant presented by a different client DID', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        await expect(queryEntries(h.deps, otherClient, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );
        await expect(queryEntries(h.deps, subject, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );
    });

    it('denies a revoked grant', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        await revokeGrant(h.deps, subject, grantId);
        await expect(queryEntries(h.deps, client, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );
    });

    it('denies an expired grant and records grant.expired once', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        h.advance(4 * HOUR);

        await expect(queryEntries(h.deps, client, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );
        await expect(queryEntries(h.deps, client, query({ grantId }))).rejects.toMatchObject(
            DENIED
        );

        expect((await h.store.getGrant(grantId))?.status).toBe('expired');
        const expired = await h.store.listEvents(
            SUBJECT_DID,
            { eventTypes: ['grant.expired'] },
            { limit: 10 }
        );
        expect(expired).toHaveLength(1);
        expect(expired[0]).toMatchObject({
            initiator: { role: 'hcp-provider' },
            data: { reason: 'expiresAt' },
        });
    });

    it('requires a purpose the grant approved', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const { entries } = await queryEntries(h.deps, client, query({ grantId }));
        const ref = (entries[0] as Disclosure).ref;

        await expect(
            queryEntries(h.deps, client, query({ grantId, purpose: OTHER_PURPOSE }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            getEntry(h.deps, client, { grantId, ref, purpose: OTHER_PURPOSE })
        ).rejects.toMatchObject(DENIED);
    });

    it('narrows queries to granted categories; omitting categories never broadens', async () => {
        const h = makeHarness();
        await subjectCreate(h, { value: 'answers in bullet points' });
        await subjectCreate(h, {
            value: 'answers about my asthma',
            categories: ['health_context'],
        });
        await subjectCreate(h, {
            value: 'answers at work and at home',
            categories: ['work_context', 'general_preferences'],
        });
        const grantId = await issueGrant(h.deps);

        const result = await queryEntries(h.deps, client, query({ grantId }));
        expect(result.categoriesSearched).toEqual(['general_preferences']);
        const values = result.entries.map(e => e.content.value);
        expect(values).toHaveLength(2);
        expect(values).not.toContain('answers about my asthma');

        // A disclosure shows only the categories the grant covers (Draft 3 §7.4).
        const mixed = result.entries.find(e => e.content.value === 'answers at work and at home');
        expect(mixed?.classification.categories).toEqual(['general_preferences']);

        await expect(
            queryEntries(h.deps, client, query({ grantId, categories: ['health_context'] }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            queryEntries(
                h.deps,
                client,
                query({ grantId, categories: ['general_preferences', 'health_context'] })
            )
        ).rejects.toMatchObject(DENIED);
        expect(() => query({ grantId, categories: [] })).toThrow();
    });

    it('discloses refs, never ids, and a ref works only under its own grant', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);
        const grantA = await issueGrant(h.deps);
        const grantB = await issueGrant(h.deps);

        const [a] = (await queryEntries(h.deps, client, query({ grantId: grantA })))
            .entries as Disclosure[];
        const [b] = (await queryEntries(h.deps, client, query({ grantId: grantB })))
            .entries as Disclosure[];
        expect(a).not.toHaveProperty('id');
        expect(a).not.toHaveProperty('record');
        expect(a!.ref).not.toBe(b!.ref);
        expect(a!.ref).not.toContain(created.id.replace('urn:uuid:', ''));
        expect(a).toMatchObject({
            version: 1,
            standing: { assurance: 'authenticated', confirmed: false },
        });

        const again = (await queryEntries(h.deps, client, query({ grantId: grantA })))
            .entries[0] as Disclosure;
        expect(again.ref).toBe(a!.ref);

        await expect(
            getEntry(h.deps, client, { grantId: grantB, ref: a!.ref, purpose: PURPOSE })
        ).rejects.toMatchObject(DENIED);
        await expect(
            getEntry(h.deps, client, { grantId: grantA, entryId: created.id, purpose: PURPOSE })
        ).rejects.toMatchObject(DENIED);
        await expect(
            getEntry(h.deps, client, { grantId: grantA, ref: a!.ref, purpose: PURPOSE })
        ).resolves.toMatchObject({ entry: { ref: a!.ref } });
    });

    it('caps a disclosure useUntil at one hour, or validUntil when earlier', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        await subjectCreate(h, {
            value: 'answers until tonight',
            assertion: {
                declarationType: 'person-declared',
                validUntil: '2026-11-16T20:30:00.000Z',
            },
        });
        const grantId = await issueGrant(h.deps);
        const { entries } = await queryEntries(h.deps, client, query({ grantId }));
        const byValue = Object.fromEntries(
            entries.map(e => [e.content.value, (e as Disclosure).useUntil])
        );
        expect(byValue['Prefers concise answers']).toBe('2026-11-16T21:00:00.000Z');
        expect(byValue['answers until tonight']).toBe('2026-11-16T20:30:00.000Z');
    });

    it('hides entries whose permitted purposes exclude the request purpose', async () => {
        const h = makeHarness();
        await subjectCreate(h, {
            assertion: { declarationType: 'person-declared', permittedPurposes: [OTHER_PURPOSE] },
        });
        const grantId = await issueGrant(h.deps, { purposes: [PURPOSE, OTHER_PURPOSE] });
        expect((await queryEntries(h.deps, client, query({ grantId }))).entries).toHaveLength(0);
        expect(
            (await queryEntries(h.deps, client, query({ grantId, purpose: OTHER_PURPOSE }))).entries
        ).toHaveLength(1);
    });

    it('expires a lapsed entry on first touch and never discloses it', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h, {
            assertion: {
                declarationType: 'person-declared',
                validUntil: '2026-11-16T20:30:00.000Z',
            },
        });
        const grantId = await issueGrant(h.deps);
        h.advance(HOUR);

        expect((await queryEntries(h.deps, client, query({ grantId }))).entries).toHaveLength(0);
        expect((await h.store.getEntry(SUBJECT_DID, created.id))?.header.status).toBe('expired');
        const events = await h.store.listEvents(
            SUBJECT_DID,
            { eventTypes: ['context.expired'] },
            { limit: 10 }
        );
        expect(events).toHaveLength(1);
    });

    it('applies the quantity bound: default 5, ceiling 20, relevance order', async () => {
        const h = makeHarness();
        for (let i = 0; i < 25; i += 1) await subjectCreate(h, { value: `note ${i}` });
        await subjectCreate(h, { value: 'zebra crossings near school' });
        h.advance(1000);
        const grantId = await issueGrant(h.deps);

        expect((await queryEntries(h.deps, client, query({ grantId }))).entries).toHaveLength(5);
        expect(
            (await queryEntries(h.deps, client, query({ grantId, maxEntries: 50 }))).entries
        ).toHaveLength(20);

        const ranked = await queryEntries(
            h.deps,
            client,
            query({ grantId, query: 'school zebra' })
        );
        expect(ranked.entries[0]?.content.value).toBe('zebra crossings near school');
        expect(ranked.minimization).toEqual({ method: 'lexical' });
    });
});

describe('HCP v1 entries: client writes', () => {
    it('requires write on every category of a create', async () => {
        const h = makeHarness();
        const readOnly = await issueGrant(h.deps);
        const writeOne = await issueGrant(h.deps, { actions: ['read', 'write'] });

        await expect(
            createEntry(h.deps, client, entryInput({ grantId: readOnly }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            createEntry(
                h.deps,
                client,
                entryInput({
                    grantId: writeOne,
                    categories: ['general_preferences', 'work_context'],
                })
            )
        ).rejects.toMatchObject(DENIED);

        const created = (await createEntry(
            h.deps,
            client,
            entryInput({ grantId: writeOne })
        )) as Disclosure;
        expect(created.ref).toBeTruthy();
        const stored = await h.store.listEntries(SUBJECT_DID, { limit: 10 });
        expect(stored[0]?.current.provenance).toMatchObject({
            assertedBy: { id: SUBJECT_DID, assurance: 'unverified' },
            submittedByClient: { id: CLIENT_DID, name: 'Study Buddy Agent' },
            authorizedUnder: writeOne,
        });
    });

    it('accepts issuer-attested only from the authenticated issuer', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps, { actions: ['read', 'write'] });
        const attested = (assertedBy: string) =>
            entryInput({
                grantId,
                assertion: { declarationType: 'issuer-attested' },
                record: { provenance: { source: 'integration', assertedBy: { id: assertedBy } } },
            });

        await expect(
            createEntry(h.deps, client, attested('did:key:z6MkUniversity'))
        ).rejects.toMatchObject(DENIED);
        await expect(createEntry(h.deps, client, attested(CLIENT_DID))).resolves.toMatchObject({
            standing: { assurance: 'authenticated' },
        });
    });

    it('consults the write policy seam only for authorized writes', async () => {
        const writePolicy = vi.fn(async () => ({ kind: 'write' as const }));
        const h = makeHarness({ writePolicy });
        const readOnly = await issueGrant(h.deps);
        const writer = await issueGrant(h.deps, { actions: ['write'] });

        await expect(
            createEntry(h.deps, client, entryInput({ grantId: readOnly }))
        ).rejects.toMatchObject(DENIED);
        expect(writePolicy).not.toHaveBeenCalled();

        await createEntry(h.deps, client, entryInput({ grantId: writer }));
        expect(writePolicy).toHaveBeenCalledWith({
            operation: 'create',
            subjectDid: SUBJECT_DID,
            actorDid: CLIENT_DID,
            grantId: writer,
            categories: ['general_preferences'],
        });
    });
});

describe('HCP v1 entries: revise and withdraw', () => {
    it('appends immutable versions and rejects a stale expectedVersion without change', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);

        const revised = (await reviseEntry(
            h.deps,
            subject,
            revision({ entryId: created.id })
        )) as Entry;
        expect(revised.id).toBe(created.id);
        expect(revised.record.version).toBe(2);
        expect(revised.content.value).toBe('Prefers detailed answers');

        const v1 = await getEntry(h.deps, subject, {
            entryId: created.id,
            purpose: PURPOSE,
            version: 1,
        });
        expect(v1.entry.content.value).toBe('Prefers concise answers');

        const before = await h.snapshot();
        await expect(
            reviseEntry(h.deps, subject, revision({ entryId: created.id, expectedVersion: 1 }))
        ).rejects.toMatchObject({ type: 'version-conflict' });
        expect(await h.snapshot()).toEqual(before);

        const events = await h.store.listEvents(
            SUBJECT_DID,
            { eventTypes: ['context.revised'] },
            { limit: 10 }
        );
        expect(events[0]?.data).toEqual({ version: 2, reason: 'Changed my mind' });
    });

    it('lets a writing client revise by ref and keeps the ref stable', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps, { actions: ['read', 'write'] });
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];

        const revised = (await reviseEntry(
            h.deps,
            client,
            revision({ grantId, ref: found!.ref })
        )) as Disclosure;
        expect(revised).toMatchObject({ ref: found!.ref, version: 2 });
    });

    it('withdraws idempotently, hides from clients, keeps for the subject', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);
        const grantId = await issueGrant(h.deps, { actions: ['read', 'write'] });
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];

        const first = await withdrawEntry(h.deps, client, {
            grantId,
            ref: found!.ref,
            reason: 'stale',
        });
        expect(first).toMatchObject({ ref: found!.ref, status: 'deleted' });
        const second = await withdrawEntry(h.deps, client, {
            grantId,
            ref: found!.ref,
            reason: 'stale',
        });
        expect(second.status).toBe('deleted');
        expect(
            await h.store.listEvents(
                SUBJECT_DID,
                { eventTypes: ['context.withdrawn'] },
                { limit: 10 }
            )
        ).toHaveLength(1);

        expect((await queryEntries(h.deps, client, query({ grantId }))).entries).toHaveLength(0);
        await expect(
            getEntry(h.deps, client, { grantId, ref: found!.ref, purpose: PURPOSE })
        ).rejects.toMatchObject(DENIED);
        await expect(
            reviseEntry(h.deps, client, revision({ grantId, ref: found!.ref }))
        ).rejects.toMatchObject(DENIED);

        const own = await getEntry(h.deps, subject, { entryId: created.id, purpose: PURPOSE });
        expect((own.entry as Entry).record.status).toBe('deleted');
        expect(
            (
                await exportContext(h.deps, subject, {
                    excludeDeleted: false,
                    includeVersions: false,
                })
            ).entries
        ).toHaveLength(1);
    });

    it('denies a read-only client revise or withdraw', async () => {
        const h = makeHarness();
        await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];

        await expect(
            reviseEntry(h.deps, client, revision({ grantId, ref: found!.ref }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            withdrawEntry(h.deps, client, { grantId, ref: found!.ref, reason: 'nope' })
        ).rejects.toMatchObject(DENIED);
    });
});

describe('HCP v1 entries: denied requests change nothing', () => {
    it('leaves entries, versions, grants and events untouched, logging only the read denial', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h);
        const grantId = await issueGrant(h.deps);
        const writer = await issueGrant(h.deps, { actions: ['read', 'write'] });
        const [found] = (await queryEntries(h.deps, client, query({ grantId })))
            .entries as Disclosure[];

        const before = await h.snapshot();
        const denials = [
            createEntry(h.deps, client, entryInput({ grantId })),
            createEntry(h.deps, otherClient, entryInput({ grantId: writer })),
            createEntry(
                h.deps,
                client,
                entryInput({ grantId: writer, categories: ['health_context'] })
            ),
            reviseEntry(h.deps, client, revision({ grantId, ref: found!.ref })),
            reviseEntry(h.deps, otherClient, revision({ grantId: writer, ref: found!.ref })),
            withdrawEntry(h.deps, client, { grantId, ref: found!.ref, reason: 'x' }),
            withdrawEntry(h.deps, client, { grantId: writer, ref: found!.ref, reason: 'x' }),
            withdrawEntry(h.deps, client, { grantId: writer, entryId: created.id, reason: 'x' }),
            queryEntries(h.deps, client, query({ grantId, purpose: OTHER_PURPOSE })),
            exportContext(h.deps, client, { excludeDeleted: false, includeVersions: false }),
            revokeGrant(h.deps, otherClient, grantId),
        ];
        for (const denial of denials) await expect(denial).rejects.toMatchObject(DENIED);

        const after = (await h.snapshot()) as { events: StoredEvent[] };
        const added = after.events.filter(e => e.eventType === READ_DENIED_EVENT);
        expect(added).toHaveLength(1);
        expect({ ...after, events: after.events.filter(e => !added.includes(e)) }).toEqual(before);
    });
});

describe('HCP v1 entries: custom categories (Draft 3 §4.5)', () => {
    const BADGES = 'https://learncard.com/hcp/categories/badges';
    const CLUBS = 'https://learncard.com/hcp/categories/clubs';

    it('lets the subject write and query a custom category', async () => {
        const h = makeHarness();
        const created = await subjectCreate(h, {
            value: 'answers with badge counts',
            categories: [BADGES, 'general_preferences'],
        });
        expect(created.classification.categories).toEqual(['general_preferences', BADGES]);

        const unfiltered = await queryEntries(h.deps, subject, query());
        expect(unfiltered.entries).toEqual([created]);
        expect(unfiltered.categoriesSearched).toHaveLength(10);
        expect(unfiltered.categoriesSearched).toContain(BADGES);

        const named = await queryEntries(h.deps, subject, query({ categories: [BADGES] }));
        expect(named.entries).toEqual([created]);
        expect(named.categoriesSearched).toEqual([BADGES]);
        expect(
            (await queryEntries(h.deps, subject, query({ categories: [CLUBS] }))).entries
        ).toEqual([]);
    });

    it('lets a client read a custom category its grant covers, and nothing more', async () => {
        const h = makeHarness();
        await subjectCreate(h, { value: 'answers with badge counts', categories: [BADGES] });
        await subjectCreate(h, { value: 'answers about chess club', categories: [CLUBS] });
        await subjectCreate(h, { value: 'answers in bullet points' });
        const grantId = await issueGrant(h.deps, { categories: [BADGES] });

        const all = await queryEntries(h.deps, client, query({ grantId }));
        expect(all.categoriesSearched).toEqual([BADGES]);
        expect(all.entries.map(e => e.content.value)).toEqual(['answers with badge counts']);
        expect(all.entries[0]?.classification.categories).toEqual([BADGES]);

        const named = await queryEntries(h.deps, client, query({ grantId, categories: [BADGES] }));
        expect(named.entries).toHaveLength(1);
        const ref = (named.entries[0] as Disclosure).ref;
        await expect(
            getEntry(h.deps, client, { grantId, ref, purpose: PURPOSE })
        ).resolves.toMatchObject({ entry: { ref, classification: { categories: [BADGES] } } });
    });

    it('denies a client a custom category its grant does not cover', async () => {
        const h = makeHarness();
        await subjectCreate(h, { value: 'answers with badge counts', categories: [BADGES] });
        const general = await issueGrant(h.deps);
        const clubs = await issueGrant(h.deps, { categories: [CLUBS], actions: ['read', 'write'] });

        expect((await queryEntries(h.deps, client, query({ grantId: general }))).entries).toEqual(
            []
        );
        for (const grantId of [general, clubs]) {
            await expect(
                queryEntries(h.deps, client, query({ grantId, categories: [BADGES] }))
            ).rejects.toMatchObject(DENIED);
        }
        await expect(
            createEntry(h.deps, client, entryInput({ grantId: clubs, categories: [BADGES] }))
        ).rejects.toMatchObject(DENIED);
        await expect(
            createEntry(h.deps, client, entryInput({ grantId: clubs, categories: [CLUBS] }))
        ).resolves.toMatchObject({ classification: { categories: [CLUBS] } });
    });
});
