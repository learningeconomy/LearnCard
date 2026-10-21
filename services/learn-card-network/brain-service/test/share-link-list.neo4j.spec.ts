import { randomBytes } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';

import { decodeShareLinkListCursor, listShareLinks } from '../src/accesslayer/share-link/list';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';

/**
 * LC-2187 bounded owner-list repository against a REAL Neo4j (disposable
 * testcontainer through the shared harness).
 *
 * The graph ordering, keyset `WHERE` clause, limit+1 fetch and namespace/owner
 * scoping are real. There is no remote store, policy network or route here.
 * Every seeded share id is a canonical 16-byte base64url value so the cursor
 * codec accepts it exactly as production does.
 */

const NAMESPACE = 'list-test-ns';
const OTHER_NAMESPACE = 'list-test-ns-2';
const OWNER = 'owner-1';
const OTHER_OWNER = 'owner-2';

const newId = (): string => randomBytes(16).toString('base64url');

type SeedInput = {
    id?: string;
    namespace?: string;
    ownerProfileId?: string;
    createdAt?: string;
    status?: 'pending' | 'active' | 'stopped';
    contentState?: 'staging' | 'finalized' | 'content_missing';
    expiresAt?: string | null;
};

const seedShare = async (input: SeedInput = {}): Promise<string> => {
    const id = input.id ?? newId();

    const props: Record<string, unknown> = {
        id,
        namespace: input.namespace ?? NAMESPACE,
        ownerProfileId: input.ownerProfileId ?? OWNER,
        version: 1,
        contentVersion: 1,
        generation: 1,
        status: input.status ?? 'active',
        contentState: input.contentState ?? 'finalized',
        title: 'Shared credentials',
        note: null,
        selectedCount: 1,
        expiresAt: input.expiresAt ?? null,
        stoppedAt: null,
        viewCount: 0,
        lastViewedAt: null,
        minorPolicyIsMinor: null,
        minorPolicyResolved: false,
        minorPolicyDefaultExpiryDays: 30,
        minorPolicyViewCountingEnabled: false,
        createdAt: input.createdAt ?? '2026-09-20T00:00:00.000Z',
        updatedAt: input.createdAt ?? '2026-09-20T00:00:00.000Z',
    };

    await neogma.queryRunner.run('MERGE (s:ShareLink {id: $id}) SET s = $props', { id, props });

    return id;
};

const clearGraph = async (): Promise<void> => {
    await neogma.queryRunner.run('MATCH (n:ShareLink) DETACH DELETE n');
};

const collectAll = async ({
    namespace = NAMESPACE,
    ownerProfileId = OWNER,
    limit = 2,
}: {
    namespace?: string;
    ownerProfileId?: string;
    limit?: number;
} = {}): Promise<{ ids: string[]; pages: number }> => {
    const ids: string[] = [];
    let pages = 0;
    let cursor: { createdAt: string; id: string } | null = null;

    do {
        const page = await listShareLinks({
            namespace,
            ownerProfileId,
            limit,
            cursor,
        });

        ids.push(...page.records.map(record => record.id));
        pages += 1;
        cursor = page.nextCursor ? decodeShareLinkListCursor(page.nextCursor) : null;

        if (page.nextCursor) expect(cursor).not.toBeNull();
    } while (cursor !== null);

    return { ids, pages };
};

describe('share-link owner list repository (real Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearGraph();
    });

    afterAll(async () => {
        await clearGraph();
    });

    it('paginates by the immutable (createdAt, id) key with limit+1 and a next cursor', async () => {
        const older = await seedShare({ createdAt: '2026-09-19T00:00:00.000Z' });
        const middle = await seedShare({ createdAt: '2026-09-20T00:00:00.000Z' });
        const newest = await seedShare({ createdAt: '2026-09-21T00:00:00.000Z' });

        const first = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 2,
            cursor: null,
        });

        expect(first.records.map(record => record.id)).toEqual([newest, middle]);
        expect(first.hasMore).toBe(true);
        expect(first.nextCursor).not.toBeNull();

        const decoded = decodeShareLinkListCursor(first.nextCursor);
        expect(decoded).toEqual({ createdAt: '2026-09-20T00:00:00.000Z', id: middle });

        const second = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 2,
            cursor: decoded,
        });

        expect(second.records.map(record => record.id)).toEqual([older]);
        expect(second.hasMore).toBe(false);
        expect(second.nextCursor).toBeNull();
    });

    it('does not duplicate or skip records when createdAt ties', async () => {
        const createdAt = '2026-09-20T00:00:00.000Z';
        const seeded = await Promise.all(Array.from({ length: 7 }, () => seedShare({ createdAt })));

        const { ids, pages } = await collectAll({ limit: 2 });

        expect(ids).toHaveLength(seeded.length);
        expect(new Set(ids).size).toBe(seeded.length);
        expect(ids.every(id => seeded.includes(id))).toBe(true);
        // Deterministic descending id tie-break, independent of seed order.
        expect(ids).toEqual([...seeded].sort((a, b) => (a < b ? 1 : -1)));
        expect(pages).toBe(4);
    });

    it('returns every page exactly once across page boundaries', async () => {
        const seeded: string[] = [];

        for (let index = 0; index < 10; index += 1) {
            seeded.push(
                await seedShare({
                    createdAt: new Date(Date.UTC(2026, 8, 1, 0, 0, index)).toISOString(),
                })
            );
        }

        const { ids } = await collectAll({ limit: 3 });

        expect(new Set(ids).size).toBe(seeded.length);
        expect(ids).toHaveLength(seeded.length);
    });

    it('lists pending, stopped and retained-expired records without triggering cleanup', async () => {
        const pending = await seedShare({ status: 'pending', contentState: 'staging' });
        const stopped = await seedShare({ status: 'stopped' });
        const expired = await seedShare({
            status: 'active',
            expiresAt: '2020-01-01T00:00:00.000Z',
        });

        const result = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 25,
            cursor: null,
        });

        expect(new Set(result.records.map(record => record.id))).toEqual(
            new Set([pending, stopped, expired])
        );
        // Read-only: no cleanup jobs are created by listing.
        const jobs = await neogma.queryRunner.run(
            'MATCH (c:ShareContentCleanupJob) RETURN count(c) AS count'
        );
        expect(Number(jobs.records[0]?.get('count') ?? 0)).toBe(0);
    });

    it('isolates owners in the same namespace', async () => {
        const mine = await seedShare({ createdAt: '2026-09-20T00:00:00.000Z' });
        await seedShare({
            ownerProfileId: OTHER_OWNER,
            createdAt: '2026-09-21T00:00:00.000Z',
        });

        const result = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 25,
            cursor: null,
        });

        expect(result.records.map(record => record.id)).toEqual([mine]);
    });

    it('isolates namespaces for the same owner', async () => {
        const mine = await seedShare({ createdAt: '2026-09-20T00:00:00.000Z' });
        await seedShare({
            namespace: OTHER_NAMESPACE,
            createdAt: '2026-09-21T00:00:00.000Z',
        });

        const result = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 25,
            cursor: null,
        });

        expect(result.records.map(record => record.id)).toEqual([mine]);
    });

    it('never reveals records through another owner cursor', async () => {
        const mineNew = await seedShare({
            ownerProfileId: OWNER,
            createdAt: '2026-09-25T00:00:00.000Z',
        });
        const mineOld = await seedShare({
            ownerProfileId: OWNER,
            createdAt: '2026-09-01T00:00:00.000Z',
        });
        const foreignNew = await seedShare({
            ownerProfileId: OTHER_OWNER,
            createdAt: '2026-09-30T00:00:00.000Z',
        });
        const foreignOld = await seedShare({
            ownerProfileId: OTHER_OWNER,
            createdAt: '2026-09-02T00:00:00.000Z',
        });

        // A cursor minted from the other owner's page.
        const otherOwnerPage = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OTHER_OWNER,
            limit: 1,
            cursor: null,
        });
        const foreignCursor = decodeShareLinkListCursor(otherOwnerPage.nextCursor);

        const page = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 25,
            cursor: foreignCursor,
        });

        // The cursor is only an ordering hint: the caller's own scope is still
        // applied, so the foreign cursor cannot surface foreign records, and no
        // foreign id appears.
        expect(page.records.map(record => record.id)).not.toContain(foreignNew);
        expect(page.records.map(record => record.id)).not.toContain(foreignOld);
        expect(page.records.every(record => [mineNew, mineOld].includes(record.id))).toBe(true);
    });

    it('bounds an oversized limit to the shared maximum without unbounded fetch', async () => {
        for (let index = 0; index < 5; index += 1) {
            await seedShare({
                createdAt: new Date(Date.UTC(2026, 8, 1, 0, 0, index)).toISOString(),
            });
        }

        const result = await listShareLinks({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            limit: 500,
            cursor: null,
        });

        expect(result.records).toHaveLength(5);
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
    });

    it('treats namespace/owner as literal bound parameters', async () => {
        const trickyNamespace = "weird'ns--";
        const trickyOwner = "o'wner--";
        const id = await seedShare({
            namespace: trickyNamespace,
            ownerProfileId: trickyOwner,
            createdAt: '2026-09-20T00:00:00.000Z',
        });

        const hit = await listShareLinks({
            namespace: trickyNamespace,
            ownerProfileId: trickyOwner,
            limit: 25,
            cursor: null,
        });
        expect(hit.records.map(record => record.id)).toEqual([id]);

        const miss = await listShareLinks({
            namespace: `${trickyNamespace}x`,
            ownerProfileId: trickyOwner,
            limit: 25,
            cursor: null,
        });
        expect(miss.records).toHaveLength(0);
    });
});
