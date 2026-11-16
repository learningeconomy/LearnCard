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
            await store.insertEntry(record);

            expect(await store.getEntry(SUBJECT, 'urn:uuid:e1')).toEqual(record);
            expect(await store.getEntry(OTHER_SUBJECT, 'urn:uuid:e1')).toBeNull();
            expect(await store.getEntry(SUBJECT, 'urn:uuid:missing')).toBeNull();
        });

        it('lists newest first, filtering by status and category before the limit', async () => {
            await store.insertEntry(entry('urn:uuid:a', { minute: 1 }));
            await store.insertEntry(
                entry('urn:uuid:b', { minute: 2, categories: ['health_context'] })
            );
            await store.insertEntry(entry('urn:uuid:c', { minute: 3, status: 'deleted' }));
            await store.insertEntry(entry('urn:uuid:d', { minute: 4, subjectDid: OTHER_SUBJECT }));
            await store.insertEntry(
                entry('urn:uuid:e', {
                    minute: 5,
                    categories: ['work_context', 'general_preferences'],
                })
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

        it('appends a version only from the expected version, keeping prior versions', async () => {
            await store.insertEntry(entry('urn:uuid:v'));

            expect(
                await store.appendVersion(
                    'urn:uuid:v',
                    1,
                    version('urn:uuid:v', 2),
                    'active',
                    at(9)
                )
            ).toBe(true);
            expect(
                await store.appendVersion(
                    'urn:uuid:v',
                    1,
                    version('urn:uuid:v', 2),
                    'active',
                    at(9)
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
            await store.insertEntry(entry('urn:uuid:race'));
            const results = await Promise.all(
                [0, 1, 2, 3].map(() =>
                    store.appendVersion(
                        'urn:uuid:race',
                        1,
                        version('urn:uuid:race', 2),
                        'active',
                        at(9)
                    )
                )
            );
            expect(results.filter(Boolean)).toHaveLength(1);
            expect((await store.listVersions(SUBJECT)).length).toBe(2);
        });

        it('transitions status only from an allowed status', async () => {
            await store.insertEntry(entry('urn:uuid:s'));
            expect(
                await store.transitionEntryStatus('urn:uuid:s', ['active'], 'deleted', at(3))
            ).toBe(true);
            expect(
                await store.transitionEntryStatus('urn:uuid:s', ['active'], 'deleted', at(4))
            ).toBe(false);
            expect(
                await store.transitionEntryStatus('urn:uuid:missing', ['active'], 'deleted', at(4))
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
            await store.insertGrant(grant('urn:uuid:g1', { issuedAt: at(1) }));
            await store.insertGrant(
                grant('urn:uuid:g2', { issuedAt: at(2), expiresAt: null, grantType: 'persistent' })
            );
            await store.insertGrant(grant('urn:uuid:g3', { subjectDid: OTHER_SUBJECT }));

            expect(await store.getGrant('urn:uuid:g2')).toEqual(
                grant('urn:uuid:g2', { issuedAt: at(2), expiresAt: null, grantType: 'persistent' })
            );
            expect(await store.getGrant('urn:uuid:none')).toBeNull();
            expect((await store.listGrants(SUBJECT, 'active')).map(g => g.grantId)).toEqual([
                'urn:uuid:g2',
                'urn:uuid:g1',
            ]);

            expect(await store.transitionGrantStatus('urn:uuid:g1', 'revoked', at(5))).toBe(true);
            expect(await store.transitionGrantStatus('urn:uuid:g1', 'expired', at(6))).toBe(false);
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
    });
};
