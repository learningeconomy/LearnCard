import { describe, expect, it } from 'vitest';

import { ListAuditInputSchema } from '../schemas';
import { createEntry, reviseEntry, withdrawEntry } from './entries';
import { exportContext, listAudit, listOwnEntries } from './governance';
import { createGrant, getGrant, listGrants, revokeGrant } from './grants';
import { hcpV1Meta } from './meta';
import {
    CLIENT_DID,
    SUBJECT_DID,
    client,
    entryInput,
    grantInput,
    issueGrant,
    makeHarness,
    otherClient,
    subject,
} from './test-harness';

const DENIED = { type: 'scope-denied' };
const HOUR = 60 * 60 * 1000;

describe('HCP v1 grants', () => {
    it('issues a temporary grant by default with derived scopes and a grant.issued event', async () => {
        const h = makeHarness();
        const grant = await createGrant(
            h.deps,
            subject,
            grantInput({
                actions: ['write', 'read'],
                categories: ['work_context', 'general_preferences'],
            })
        );

        expect(grant).toMatchObject({
            subject: { id: SUBJECT_DID },
            authorizingPrincipal: { id: SUBJECT_DID },
            client: { id: CLIENT_DID, name: 'Study Buddy Agent' },
            grantType: 'temporary',
            issuedAt: '2026-11-16T20:00:00.000Z',
            expiresAt: '2026-11-17T00:00:00.000Z',
            status: 'active',
            source: { type: 'direct' },
        });
        expect(grant.access[0]?.actions).toEqual(['write', 'read']);
        expect(grant.access[0]?.categories).toEqual(['general_preferences', 'work_context']);
        expect(grant.scopes).toEqual([
            'hcp:general_preferences:read',
            'hcp:general_preferences:write',
            'hcp:work_context:read',
            'hcp:work_context:write',
        ]);

        const [issued] = await h.store.listEvents(SUBJECT_DID, {}, { limit: 10 });
        expect(issued).toMatchObject({
            eventType: 'grant.issued',
            grantId: grant.grantId,
            data: { grantType: 'temporary', expiresAt: grant.expiresAt, modality: 'api' },
        });
    });

    it('bounds temporary expiry to 24 hours and gives persistent grants none', async () => {
        const h = makeHarness();
        await expect(
            createGrant(h.deps, subject, grantInput({ expiresAt: '2026-11-17T20:00:01.000Z' }))
        ).rejects.toMatchObject({ type: 'malformed-request' });
        await expect(
            createGrant(h.deps, subject, grantInput({ expiresAt: '2026-11-16T19:00:00.000Z' }))
        ).rejects.toMatchObject({ type: 'malformed-request' });
        await expect(
            createGrant(
                h.deps,
                subject,
                grantInput({ grantType: 'persistent', expiresAt: '2026-11-16T21:00:00.000Z' })
            )
        ).rejects.toMatchObject({ type: 'malformed-request' });
        await expect(
            createGrant(h.deps, subject, grantInput({ grantType: 'persistent' }))
        ).resolves.toMatchObject({ expiresAt: null, grantType: 'persistent' });
    });

    it('rejects repeated actions or categories in a detail', () => {
        expect(() => grantInput({ actions: ['read', 'read'] })).toThrow();
        expect(() => grantInput({ categories: ['work_context', 'work_context'] })).toThrow();
    });

    it('is governance: a caller without a profile cannot issue or list grants', async () => {
        const h = makeHarness();
        await expect(createGrant(h.deps, client, grantInput())).rejects.toMatchObject(DENIED);
        await expect(listGrants(h.deps, client, 'active')).rejects.toMatchObject(DENIED);
    });

    it('lets a client read and relinquish only its own grant', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);

        await expect(getGrant(h.deps, client, grantId)).resolves.toMatchObject({ grantId });
        await expect(getGrant(h.deps, otherClient, grantId)).rejects.toMatchObject(DENIED);
        await expect(getGrant(h.deps, client, 'urn:uuid:nope')).rejects.toMatchObject(DENIED);
        await expect(revokeGrant(h.deps, otherClient, grantId)).rejects.toMatchObject(DENIED);

        const relinquished = await revokeGrant(h.deps, client, grantId);
        expect(relinquished.status).toBe('revoked');
        const [revoked] = await h.store.listEvents(
            SUBJECT_DID,
            { eventTypes: ['grant.revoked'] },
            { limit: 10 }
        );
        expect(revoked?.initiator).toEqual({ role: 'context-client', id: CLIENT_DID });
    });

    it('revokes idempotently and lists by status', async () => {
        const h = makeHarness();
        const kept = await issueGrant(h.deps);
        const revokedId = await issueGrant(h.deps);

        await revokeGrant(h.deps, subject, revokedId);
        const again = await revokeGrant(h.deps, subject, revokedId);
        expect(again.status).toBe('revoked');
        expect(
            await h.store.listEvents(SUBJECT_DID, { eventTypes: ['grant.revoked'] }, { limit: 10 })
        ).toHaveLength(1);

        expect((await listGrants(h.deps, subject, 'active')).map(g => g.grantId)).toEqual([kept]);
        expect((await listGrants(h.deps, subject, 'revoked')).map(g => g.grantId)).toEqual([
            revokedId,
        ]);
    });

    it('settles lapsed grants as expired when listed', async () => {
        const h = makeHarness();
        const grantId = await issueGrant(h.deps);
        h.advance(5 * HOUR);

        expect(await listGrants(h.deps, subject, 'active')).toEqual([]);
        expect((await listGrants(h.deps, subject, 'expired')).map(g => g.grantId)).toEqual([
            grantId,
        ]);
    });
});

describe('HCP v1 audit log', () => {
    it('is subject-only, filtered before paging, with an opaque cursor', async () => {
        const h = makeHarness();
        const created = await createEntry(h.deps, subject, entryInput());
        const entryId = (created as { id: string }).id;
        for (let i = 0; i < 3; i += 1) {
            h.advance(1000);
            await issueGrant(h.deps);
        }
        h.advance(1000);
        await reviseEntry(h.deps, subject, {
            entryId,
            expectedVersion: 1,
            content: created.content,
            reason: 'tweak',
            record: { provenance: { source: 'person-input' } },
        });

        await expect(
            listAudit(h.deps, client, ListAuditInputSchema.parse({}))
        ).rejects.toMatchObject(DENIED);

        const byEntry = await listAudit(
            h.deps,
            subject,
            ListAuditInputSchema.parse({ entryId, limit: 1 })
        );
        expect(byEntry.events.map(e => e.eventType)).toEqual(['context.revised']);
        expect(byEntry.nextCursor).not.toBeNull();
        expect(byEntry.nextCursor).not.toMatch(/^\d+$/);

        const rest = await listAudit(
            h.deps,
            subject,
            ListAuditInputSchema.parse({ entryId, limit: 1, cursor: byEntry.nextCursor })
        );
        expect(rest.events.map(e => e.eventType)).toEqual(['context.created']);
        expect(rest.nextCursor).toBeNull();
        expect(rest.events[0]).toMatchObject({
            entryId,
            participants: {
                initiator: { role: 'management-client', id: SUBJECT_DID },
                authorizingPrincipal: { id: SUBJECT_DID },
                provider: { id: 'did:web:brain.test' },
            },
        });

        const grants = await listAudit(
            h.deps,
            subject,
            ListAuditInputSchema.parse({ eventTypes: ['grant.issued'], limit: 2 })
        );
        expect(grants.events).toHaveLength(2);
        expect(grants.nextCursor).not.toBeNull();

        await expect(
            listAudit(h.deps, subject, ListAuditInputSchema.parse({ cursor: 'not-a-cursor' }))
        ).rejects.toMatchObject({ type: 'malformed-request' });
    });
});

describe('HCP v1 export', () => {
    it('exports every held entry for the subject only, with options, and records it', async () => {
        const h = makeHarness();
        const kept = (await createEntry(h.deps, subject, entryInput())) as { id: string };
        const gone = (await createEntry(h.deps, subject, entryInput({ value: 'old' }))) as {
            id: string;
        };
        await reviseEntry(h.deps, subject, {
            entryId: kept.id,
            expectedVersion: 1,
            content: {
                profile: 'https://hcp.example/spec/profiles/general-context/2.0',
                value: 'v2',
            },
            reason: 'update',
            record: { provenance: { source: 'person-input' } },
        });
        await withdrawEntry(h.deps, subject, { entryId: gone.id, reason: 'old' });

        await expect(
            exportContext(h.deps, client, { excludeDeleted: false, includeVersions: false })
        ).rejects.toMatchObject(DENIED);

        const all = await exportContext(h.deps, subject, {
            excludeDeleted: false,
            includeVersions: true,
        });
        expect(all).toMatchObject({
            type: 'ContextExport',
            subject: { id: SUBJECT_DID },
            exportedBy: 'did:web:brain.test',
            options: { excludeDeleted: false, includeVersions: true, includeAudit: false },
        });
        expect(all.entries.map(e => [e.id, e.record.status]).sort()).toEqual(
            [
                [kept.id, 'active'],
                [gone.id, 'deleted'],
            ].sort()
        );
        expect(all.versions.map(v => [v.id, v.record.version])).toEqual([[kept.id, 1]]);

        const portable = await exportContext(h.deps, subject, {
            excludeDeleted: true,
            includeVersions: false,
        });
        expect(portable.entries.map(e => e.id)).toEqual([kept.id]);
        expect(portable.versions).toEqual([]);

        const exported = await h.store.listEvents(
            SUBJECT_DID,
            { eventTypes: ['context.exported'] },
            { limit: 10 }
        );
        expect(exported.map(e => e.data)).toEqual([
            { options: { excludeDeleted: true, includeVersions: false, includeAudit: false } },
            { options: { excludeDeleted: false, includeVersions: true, includeAudit: false } },
        ]);
    });
});

describe('HCP v1 grants: custom categories', () => {
    it('keeps a custom category in access and leaves it out of scope strings (§6.1.1)', async () => {
        const h = makeHarness();
        const badges = 'https://learncard.com/hcp/categories/badges';
        const grant = await createGrant(
            h.deps,
            subject,
            grantInput({ actions: ['read'], categories: [badges, 'general_preferences'] })
        );
        expect(grant.access[0]?.categories).toEqual(['general_preferences', badges]);
        expect(grant.scopes).toEqual(['hcp:general_preferences:read']);
        await expect(getGrant(h.deps, client, grant.grantId)).resolves.toMatchObject({
            access: [{ categories: ['general_preferences', badges] }],
        });
    });

    it('rejects a malformed custom category in a grant', () => {
        expect(() => grantInput({ categories: ['urn:learncard:badges'] })).toThrow();
        expect(() => grantInput({ categories: ['https://hcp.example/badges'] })).toThrow();
    });
});

describe('HCP v1 meta', () => {
    it('pins the spec and lists operations', () => {
        const meta = hcpV1Meta();
        expect(meta.spec.commit).toMatch(/^[0-9a-f]{40}$/);
        expect(meta.api_version).toBe('v1');
        expect(meta.operations).toContain('entries.query');
        expect(meta.supported_categories.map(c => c.id)).toContain('health_context');
        expect(meta.custom_categories).toEqual({
            accepted: 'uri',
            schemes: ['https', 'http'],
            sensitivity: 'high',
        });
    });
});

describe('HCP management entry list', () => {
    it('lists only the signed-in profile, excludes withdrawn entries, and does not create events', async () => {
        const h = makeHarness();
        await createEntry(h.deps, subject, entryInput());
        const removed = await createEntry(h.deps, subject, entryInput());
        if (!('id' in removed)) throw new Error('Expected subject entry');
        await withdrawEntry(h.deps, subject, { entryId: removed.id, reason: 'Remove' });
        const before = await h.snapshot();
        const listed = await listOwnEntries(h.deps, subject, {});
        expect(listed.subject).toEqual({ id: SUBJECT_DID });
        expect(listed.entries).toHaveLength(1);
        expect(
            (await listOwnEntries(h.deps, subject, { statuses: ['deleted'] })).entries
        ).toHaveLength(1);
        expect(
            await listOwnEntries(h.deps, { did: 'did:key:other', subjectDid: 'did:key:other' }, {})
        ).toEqual({ subject: { id: 'did:key:other' }, entries: [], truncated: false });
        await expect(listOwnEntries(h.deps, client, {})).rejects.toMatchObject(DENIED);
        expect(await h.snapshot()).toEqual(before);
    });
});
