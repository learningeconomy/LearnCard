/**
 * Behavior every HcpV1Store adapter must have. Run against the memory adapter in
 * unit tests (`memory.test.ts`) and against Neo4j in `test/hcp-v1-store.neo4j.spec.ts`.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { GENERAL_CONTEXT_PROFILE, type Category, type EntryStatus } from '../schemas';
import type { EntryRecord, EntryVersion, HcpV1Store, StoredEvent, StoredGrant } from './port';

const SUBJECT = 'did:key:z6MkSubjectContract';
const OTHER_SUBJECT = 'did:key:z6MkOtherContract';

const at = (minute: number): string => new Date(Date.UTC(2026, 10, 16, 12, minute)).toISOString();

const version = (entryId: string, n: number, subjectDid = SUBJECT): EntryVersion => ({
    entryId,
    subjectDid,
    version: n,
    content: { profile: GENERAL_CONTEXT_PROFILE, value: `value ${n}`, language: 'en' },
    assertion: { declarationType: 'person-declared', confidence: null, validUntil: null },
    evidence: [],
    provenance: {
        assertedBy: { id: subjectDid, assurance: 'authenticated' },
        assertedAt: at(n),
        source: 'person-input',
        submittedByClient: { id: subjectDid, name: 'Context Subject' },
        authorizedUnder: null,
        recordedByProvider: 'did:web:provider',
        recordedAt: at(n),
    },
});

const entry = (
    id: string,
    options: {
        categories?: Category[];
        status?: EntryStatus;
        minute?: number;
        subjectDid?: string;
    } = {}
): EntryRecord => {
    const subjectDid = options.subjectDid ?? SUBJECT;
    return {
        header: {
            id,
            subjectDid,
            status: options.status ?? 'active',
            version: 1,
            categories: options.categories ?? ['general_preferences'],
            dimension: null,
            permittedPurposes: null,
            createdAt: at(options.minute ?? 0),
            updatedAt: at(options.minute ?? 0),
        },
        current: version(id, 1, subjectDid),
    };
};

const grant = (grantId: string, options: Partial<StoredGrant> = {}): StoredGrant => ({
    grantId,
    subjectDid: SUBJECT,
    client: { id: 'did:key:z6MkClient', name: 'Agent' },
    access: [
        {
            type: 'https://hcp.example/spec/authorization/context-access',
            actions: ['read'],
            categories: ['general_preferences'],
            purposes: [{ code: 'https://purpose.example/assist', description: 'Assist' }],
        },
    ],
    grantType: 'temporary',
    issuedAt: at(0),
    expiresAt: at(240),
    status: 'active',
    statusChangedAt: null,
    source: { type: 'direct' },
    canWrite: false,
    ...options,
});

const event = (
    eventId: string,
    minute: number,
    options: Partial<StoredEvent> = {}
): StoredEvent => ({
    eventId,
    eventType: 'context.created',
    timestamp: at(minute),
    subjectDid: SUBJECT,
    providerId: 'did:web:provider',
    initiator: { role: 'management-client', id: SUBJECT },
    entryId: null,
    categories: [],
    purpose: null,
    grantId: null,
    data: { version: 1 },
    ...options,
});

let auditSeq = 0;
/** A fresh lifecycle event to pass with a change. */
const audit = (options: Partial<StoredEvent> = {}): StoredEvent =>
    event(`urn:uuid:audit-${++auditSeq}`, 0, options);

export type StoreHarness = { store: HcpV1Store; reset: () => Promise<void> };

export const describeHcpV1StoreContract = (
    name: string,
    makeHarness: () => StoreHarness | Promise<StoreHarness>
): void => {
    describe(`HcpV1Store contract: ${name}`, () => {
        let store: HcpV1Store;

        beforeEach(async () => {
            const harness = await makeHarness();
            await harness.reset();
            store = harness.store;
        });

        it('round-trips an entry and scopes reads to its subject', async () => {
            const record = entry('urn:uuid:e1');
            await store.insertEntry(record, audit());

            expect(await store.getEntry(SUBJECT, 'urn:uuid:e1')).toEqual(record);
            expect(await store.getEntry(OTHER_SUBJECT, 'urn:uuid:e1')).toBeNull();
            expect(await store.getEntry(SUBJECT, 'urn:uuid:missing')).toBeNull();
        });

        it('lists newest first, filtering by status and category before the limit', async () => {
            await store.insertEntry(entry('urn:uuid:a', { minute: 1 }), audit());
            await store.insertEntry(
                entry('urn:uuid:b', { minute: 2, categories: ['health_context'] }),
                audit()
            );
            await store.insertEntry(entry('urn:uuid:c', { minute: 3, status: 'deleted' }), audit());
            await store.insertEntry(
                entry('urn:uuid:d', { minute: 4, subjectDid: OTHER_SUBJECT }),
                audit()
            );
            await store.insertEntry(
                entry('urn:uuid:e', {
                    minute: 5,
                    categories: ['work_context', 'general_preferences'],
                }),
                audit()
            );

            const all = await store.listEntries(SUBJECT, { limit: 10 });
            expect(all.map(r => r.header.id)).toEqual([
                'urn:uuid:e',
                'urn:uuid:c',
                'urn:uuid:b',
                'urn:uuid:a',
            ]);

            const active = await store.listEntries(SUBJECT, {
                statuses: ['active'],
                categories: ['general_preferences'],
                limit: 10,
            });
            expect(active.map(r => r.header.id)).toEqual(['urn:uuid:e', 'urn:uuid:a']);

            const limited = await store.listEntries(SUBJECT, { statuses: ['active'], limit: 1 });
            expect(limited.map(r => r.header.id)).toEqual(['urn:uuid:e']);
        });

        it('filters by a custom category with exact matching (Draft 3 §4.5)', async () => {
            const badges = 'https://learncard.com/hcp/categories/badges';
            await store.insertEntry(
                entry('urn:uuid:a', { minute: 1, categories: [badges] }),
                audit()
            );
            await store.insertEntry(
                entry('urn:uuid:b', { minute: 2, categories: ['general_preferences', badges] }),
                audit()
            );
            await store.insertEntry(
                entry('urn:uuid:c', { minute: 3, categories: [`${badges}/sub`] }),
                audit()
            );

            const found = await store.listEntries(SUBJECT, { categories: [badges], limit: 10 });
            expect(found.map(r => r.header.id)).toEqual(['urn:uuid:b', 'urn:uuid:a']);
            expect(found[0]?.header.categories).toEqual(['general_preferences', badges]);

            const unfiltered = await store.listEntries(SUBJECT, { limit: 10 });
            expect(unfiltered.map(r => r.header.id)).toEqual([
                'urn:uuid:c',
                'urn:uuid:b',
                'urn:uuid:a',
            ]);
        });

        it('appends a version only from the expected version, keeping prior versions', async () => {
            await store.insertEntry(entry('urn:uuid:v'), audit());

            expect(
                await store.appendVersion(
                    'urn:uuid:v',
                    1,
                    version('urn:uuid:v', 2),
                    'active',
                    at(9),
                    audit()
                )
            ).toBe(true);
            expect(
                await store.appendVersion(
                    'urn:uuid:v',
                    1,
                    version('urn:uuid:v', 2),
                    'active',
                    at(9),
                    audit()
                )
            ).toBe(false);

            const current = await store.getEntry(SUBJECT, 'urn:uuid:v');
            expect(current?.header.version).toBe(2);
            expect(current?.header.updatedAt).toBe(at(9));
            expect(current?.current.content.value).toBe('value 2');
            expect((await store.getEntryVersion('urn:uuid:v', 1))?.content.value).toBe('value 1');
            expect(await store.getEntryVersion('urn:uuid:v', 3)).toBeNull();
            expect((await store.listVersions(SUBJECT)).map(v => [v.entryId, v.version])).toEqual([
                ['urn:uuid:v', 1],
                ['urn:uuid:v', 2],
            ]);
        });

        it('serializes concurrent revisions of one version: exactly one wins', async () => {
            await store.insertEntry(entry('urn:uuid:race'), audit());
            const results = await Promise.all(
                [0, 1, 2, 3].map(() =>
                    store.appendVersion(
                        'urn:uuid:race',
                        1,
                        version('urn:uuid:race', 2),
                        'active',
                        at(9),
                        audit()
                    )
                )
            );
            expect(results.filter(Boolean)).toHaveLength(1);
            expect((await store.listVersions(SUBJECT)).length).toBe(2);
            // One event for the insert, one for the single winning revision.
            expect(await store.listEvents(SUBJECT, {}, { limit: 10 })).toHaveLength(2);
        });

        it('transitions status only from an allowed status', async () => {
            await store.insertEntry(entry('urn:uuid:s'), audit());
            expect(
                await store.transitionEntryStatus(
                    'urn:uuid:s',
                    ['active'],
                    'deleted',
                    at(3),
                    audit()
                )
            ).toBe(true);
            expect(
                await store.transitionEntryStatus(
                    'urn:uuid:s',
                    ['active'],
                    'deleted',
                    at(4),
                    audit()
                )
            ).toBe(false);
            expect(
                await store.transitionEntryStatus(
                    'urn:uuid:missing',
                    ['active'],
                    'deleted',
                    at(4),
                    audit()
                )
            ).toBe(false);
            expect((await store.getEntry(SUBJECT, 'urn:uuid:s'))?.header).toMatchObject({
                status: 'deleted',
                updatedAt: at(3),
            });
        });

        it('keeps one stable ref per grant and entry, and resolves it only under that grant', async () => {
            const first = await store.refFor('urn:uuid:g1', 'urn:uuid:e1', 'ref-a');
            const again = await store.refFor('urn:uuid:g1', 'urn:uuid:e1', 'ref-b');
            const otherGrant = await store.refFor('urn:uuid:g2', 'urn:uuid:e1', 'ref-c');

            expect(first).toBe('ref-a');
            expect(again).toBe('ref-a');
            expect(otherGrant).toBe('ref-c');
            expect(await store.resolveRef('urn:uuid:g1', 'ref-a')).toBe('urn:uuid:e1');
            expect(await store.resolveRef('urn:uuid:g2', 'ref-a')).toBeNull();
            expect(await store.resolveRef('urn:uuid:g1', 'nope')).toBeNull();
        });

        it('stores grants, lists by subject and status, and moves only active grants', async () => {
            await store.insertGrant(grant('urn:uuid:g1', { issuedAt: at(1) }), audit());
            await store.insertGrant(
                grant('urn:uuid:g2', { issuedAt: at(2), expiresAt: null, grantType: 'persistent' }),
                audit()
            );
            await store.insertGrant(grant('urn:uuid:g3', { subjectDid: OTHER_SUBJECT }), audit());

            expect(await store.getGrant('urn:uuid:g2')).toEqual(
                grant('urn:uuid:g2', { issuedAt: at(2), expiresAt: null, grantType: 'persistent' })
            );
            expect(await store.getGrant('urn:uuid:none')).toBeNull();
            expect((await store.listGrants(SUBJECT, 'active')).map(g => g.grantId)).toEqual([
                'urn:uuid:g2',
                'urn:uuid:g1',
            ]);

            expect(
                await store.transitionGrantStatus('urn:uuid:g1', 'revoked', at(5), audit())
            ).toBe(true);
            expect(
                await store.transitionGrantStatus('urn:uuid:g1', 'expired', at(6), audit())
            ).toBe(false);
            expect(await store.getGrant('urn:uuid:g1')).toMatchObject({
                status: 'revoked',
                statusChangedAt: at(5),
            });
            expect((await store.listGrants(SUBJECT, 'revoked')).map(g => g.grantId)).toEqual([
                'urn:uuid:g1',
            ]);
        });

        it('pages events newest first, filtering before the limit', async () => {
            await store.appendEvent(event('urn:uuid:ev1', 1, { entryId: 'urn:uuid:e1' }));
            await store.appendEvent(
                event('urn:uuid:ev2', 2, { eventType: 'grant.issued', grantId: 'urn:uuid:g1' })
            );
            await store.appendEvent(event('urn:uuid:ev3', 3, { entryId: 'urn:uuid:e1' }));
            await store.appendEvent(event('urn:uuid:ev4', 3, { entryId: 'urn:uuid:e2' }));
            await store.appendEvent(event('urn:uuid:ev5', 4, { subjectDid: OTHER_SUBJECT }));

            const first = await store.listEvents(SUBJECT, {}, { limit: 2 });
            expect(first.map(e => e.eventId)).toEqual(['urn:uuid:ev4', 'urn:uuid:ev3']);

            const next = await store.listEvents(SUBJECT, {}, { limit: 2, after: first[1] });
            expect(next.map(e => e.eventId)).toEqual(['urn:uuid:ev2', 'urn:uuid:ev1']);

            const byEntry = await store.listEvents(
                SUBJECT,
                { entryId: 'urn:uuid:e1' },
                { limit: 1 }
            );
            expect(byEntry.map(e => e.eventId)).toEqual(['urn:uuid:ev3']);

            const byType = await store.listEvents(
                SUBJECT,
                { eventTypes: ['grant.issued'], grantId: 'urn:uuid:g1' },
                { limit: 10 }
            );
            expect(byType).toEqual([
                event('urn:uuid:ev2', 2, { eventType: 'grant.issued', grantId: 'urn:uuid:g1' }),
            ]);

            const window = await store.listEvents(
                SUBJECT,
                { since: at(2), until: at(3) },
                { limit: 10 }
            );
            expect(window.map(e => e.eventId)).toEqual(['urn:uuid:ev2']);
        });

        it('round-trips access-log members, and leaves them absent where unset (LC-2422)', async () => {
            const read = event('urn:uuid:read', 1, {
                eventType: 'context.read',
                initiator: { role: 'context-client', id: 'did:key:z6MkClient' },
                categories: ['goals_and_constraints'],
                purpose: 'https://purpose.example/assist',
                purposeDescription: 'Plan my week',
                grantId: 'urn:uuid:g1',
                retrievalId: 'urn:uuid:r1',
                disclosed: [
                    { entryId: 'urn:uuid:e1', version: 2, useUntil: at(61) },
                    { entryId: 'urn:uuid:e2', version: 1 },
                ],
                data: { maxEntries: 5, categoriesSearched: ['goals_and_constraints'] },
            });
            const empty = event('urn:uuid:read-empty', 2, {
                eventType: 'context.read',
                retrievalId: 'urn:uuid:r2',
                disclosed: [],
            });
            const lifecycle = event('urn:uuid:created', 3);
            for (const e of [read, empty, lifecycle]) await store.appendEvent(e);

            expect(await store.listEvents(SUBJECT, {}, { limit: 10 })).toEqual([
                lifecycle,
                empty,
                read,
            ]);
            const [stored] = await store.listEvents(SUBJECT, {}, { limit: 1 });
            expect(stored).not.toHaveProperty('disclosed');
            expect(stored).not.toHaveProperty('retrievalId');
            expect(stored).not.toHaveProperty('purposeDescription');
        });

        describe('writes each lifecycle change and its event atomically', () => {
            const DUP = 'urn:uuid:dup';
            const dup = (): StoredEvent => event(DUP, 0);
            const eventIds = async (subjectDid = SUBJECT): Promise<string[]> =>
                (await store.listEvents(subjectDid, {}, { limit: 100 })).map(e => e.eventId);

            beforeEach(async () => {
                await store.appendEvent(dup());
            });

            it('records the event with the change, and none when the change does not happen', async () => {
                await store.insertEntry(entry('urn:uuid:e'), audit({ eventId: 'urn:uuid:c1' }));
                expect(
                    await store.appendVersion(
                        'urn:uuid:e',
                        7,
                        version('urn:uuid:e', 8),
                        'active',
                        at(9),
                        audit({ eventId: 'urn:uuid:skipped' })
                    )
                ).toBe(false);
                expect(
                    await store.transitionGrantStatus(
                        'urn:uuid:none',
                        'revoked',
                        at(9),
                        audit({ eventId: 'urn:uuid:skipped2' })
                    )
                ).toBe(false);
                expect((await eventIds()).sort()).toEqual(['urn:uuid:c1', DUP]);
            });

            it('insertEntry: a failed event leaves no entry or version', async () => {
                await expect(store.insertEntry(entry('urn:uuid:e'), dup())).rejects.toThrow();
                expect(await store.getEntry(SUBJECT, 'urn:uuid:e')).toBeNull();
                expect(await store.listVersions(SUBJECT)).toEqual([]);
                expect(await eventIds()).toEqual([DUP]);
            });

            it('appendVersion: a failed event leaves the current version', async () => {
                await store.insertEntry(entry('urn:uuid:e'), audit());
                const before = await store.getEntry(SUBJECT, 'urn:uuid:e');
                await expect(
                    store.appendVersion(
                        'urn:uuid:e',
                        1,
                        version('urn:uuid:e', 2),
                        'active',
                        at(9),
                        dup()
                    )
                ).rejects.toThrow();
                expect(await store.getEntry(SUBJECT, 'urn:uuid:e')).toEqual(before);
                expect(await store.getEntryVersion('urn:uuid:e', 2)).toBeNull();
            });

            it('transitionEntryStatus: a failed event leaves the status', async () => {
                await store.insertEntry(entry('urn:uuid:e'), audit());
                await expect(
                    store.transitionEntryStatus('urn:uuid:e', ['active'], 'deleted', at(9), dup())
                ).rejects.toThrow();
                expect((await store.getEntry(SUBJECT, 'urn:uuid:e'))?.header).toMatchObject({
                    status: 'active',
                    updatedAt: at(0),
                });
            });

            it('insertGrant: a failed event leaves no grant', async () => {
                await expect(store.insertGrant(grant('urn:uuid:g'), dup())).rejects.toThrow();
                expect(await store.getGrant('urn:uuid:g')).toBeNull();
            });

            it('transitionGrantStatus: a failed event leaves the grant active', async () => {
                await store.insertGrant(grant('urn:uuid:g'), audit());
                await expect(
                    store.transitionGrantStatus('urn:uuid:g', 'revoked', at(9), dup())
                ).rejects.toThrow();
                expect(await store.getGrant('urn:uuid:g')).toMatchObject({
                    status: 'active',
                    statusChangedAt: null,
                });
            });
        });

        it("deletes all of one subject's data and nothing of another's", async () => {
            const seed = async (subjectDid: string, tag: string): Promise<void> => {
                const id = `urn:uuid:${tag}-e`;
                await store.insertEntry(entry(id, { subjectDid }), audit({ subjectDid }));
                await store.appendVersion(
                    id,
                    1,
                    version(id, 2, subjectDid),
                    'active',
                    at(5),
                    audit({ subjectDid })
                );
                const grantId = `urn:uuid:${tag}-g`;
                await store.insertGrant(grant(grantId, { subjectDid }), audit({ subjectDid }));
                await store.transitionGrantStatus(grantId, 'revoked', at(6), audit({ subjectDid }));
                await store.insertGrant(
                    grant(`${grantId}2`, { subjectDid }),
                    audit({ subjectDid })
                );
                await store.refFor(grantId, id, `${tag}-ref`);
                await store.refFor(`${grantId}2`, id, `${tag}-ref2`);
                await store.appendEvent(audit({ subjectDid, eventType: 'context.exported' }));
            };
            await seed(SUBJECT, 'mine');
            await seed(OTHER_SUBJECT, 'theirs');

            await store.deleteSubjectData(SUBJECT);
            await store.deleteSubjectData(SUBJECT);

            expect(await store.getEntry(SUBJECT, 'urn:uuid:mine-e')).toBeNull();
            expect(await store.getEntryVersion('urn:uuid:mine-e', 1)).toBeNull();
            expect(await store.listEntries(SUBJECT, { limit: 10 })).toEqual([]);
            expect(await store.listVersions(SUBJECT)).toEqual([]);
            for (const status of ['active', 'revoked', 'expired'] as const)
                expect(await store.listGrants(SUBJECT, status)).toEqual([]);
            expect(await store.getGrant('urn:uuid:mine-g')).toBeNull();
            expect(await store.resolveRef('urn:uuid:mine-g', 'mine-ref')).toBeNull();
            expect(await store.resolveRef('urn:uuid:mine-g2', 'mine-ref2')).toBeNull();
            expect(await store.listEvents(SUBJECT, {}, { limit: 100 })).toEqual([]);

            expect((await store.getEntry(OTHER_SUBJECT, 'urn:uuid:theirs-e'))?.header.version).toBe(
                2
            );
            expect(await store.listVersions(OTHER_SUBJECT)).toHaveLength(2);
            expect(await store.listGrants(OTHER_SUBJECT, 'active')).toHaveLength(1);
            expect(await store.listGrants(OTHER_SUBJECT, 'revoked')).toHaveLength(1);
            expect(await store.resolveRef('urn:uuid:theirs-g', 'theirs-ref')).toBe(
                'urn:uuid:theirs-e'
            );
            expect(await store.listEvents(OTHER_SUBJECT, {}, { limit: 100 })).toHaveLength(6);
        });
    });
};
