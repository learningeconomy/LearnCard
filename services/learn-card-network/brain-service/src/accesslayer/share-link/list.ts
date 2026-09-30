import { SHARE_LINK_ID_BYTES, isCanonicalBase64Url } from '@learncard/types';

import { neogma } from '@instance';

import { readNodeProperties, toShareLinkRecord } from './helpers';
import type { ListShareLinksInput, ListShareLinksResult, ShareLinkListCursor } from './types';
import type { ShareLinkRecord } from '../../models/ShareLink';

/**
 * LC-2187 bounded owner-list repository.
 *
 * Contract:
 * - Every query is scoped by the trusted `namespace` AND `ownerProfileId`; the
 *   caller can never widen either through the cursor or any other field.
 * - Keyset pagination over the immutable `(createdAt, id)` key. `createdAt` is
 *   never mutated for a share and `id` is globally unique, so the total order is
 *   stable and equal-timestamp records neither duplicate nor skip across pages.
 *   There is no OFFSET and no unbounded fetch/sort in memory.
 * - The cursor is a canonical, versioned encoding of exactly the two ordering
 *   fields. It is an ORDERING HINT only: it never carries namespace, owner,
 *   status or a query clause, and the current authenticated scope is always
 *   applied independently. A cursor minted for another owner therefore cannot
 *   reveal that owner's records; it can only advance the caller's own page.
 * - `limit + 1` rows are fetched so `hasMore`/`nextCursor` are decided without a
 *   count query. Limits are defensively bounded again here.
 * - Pending (`staging`), active, retained-expired and stopped records are all
 *   listed by owner. Listing is read-only: it never triggers cleanup, never
 *   contacts public content, and never mutates a share.
 *
 * Concurrent insert/delete is deliberately not a snapshot: a page reflects the
 * graph at read time, so a new share may appear and a deleted share may vanish
 * between pages. Only the immutable ordering key is guaranteed stable.
 */

const CURSOR_VERSION = 1;
const CURSOR_PREFIX = `v${CURSOR_VERSION}.`;
const MAX_CURSOR_LENGTH = 512;
const MAX_LIST_LIMIT = 50;
const DEFAULT_LIST_LIMIT = 25;

const isCanonicalIsoInstant = (value: string): boolean => {
    const parsed = Date.parse(value);

    if (!Number.isFinite(parsed)) return false;

    try {
        return new Date(parsed).toISOString() === value;
    } catch {
        return false;
    }
};

/**
 * Canonical, versioned cursor over exactly `(createdAt, id)`.
 *
 * Encoding: `v1.` + base64url(UTF-8 JSON array `[createdAt, id]`). The version
 * prefix lets a future encoding be rejected rather than mis-parsed, and the
 * ordered-fields-only shape guarantees no database node, extra clause or private
 * field can be smuggled through the cursor.
 */
export const encodeShareLinkListCursor = (cursor: ShareLinkListCursor): string =>
    `${CURSOR_PREFIX}${Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString(
        'base64url'
    )}`;

/**
 * Strictly decodes a caller cursor. Returns `null` for anything malformed,
 * oversized, non-canonical or impossible so the route can answer a fixed safe
 * BAD_REQUEST without touching the graph.
 */
export const decodeShareLinkListCursor = (raw: unknown): ShareLinkListCursor | null => {
    if (typeof raw !== 'string') return null;
    if (raw.length === 0 || raw.length > MAX_CURSOR_LENGTH) return null;
    if (!raw.startsWith(CURSOR_PREFIX)) return null;

    const encoded = raw.slice(CURSOR_PREFIX.length);

    if (encoded.length === 0) return null;

    let json: string;
    try {
        const bytes = Buffer.from(encoded, 'base64url');

        // Reject non-canonical base64url (padding/unused-bit variants) so one
        // logical cursor has exactly one spelling.
        if (bytes.toString('base64url') !== encoded) return null;

        json = bytes.toString('utf8');
    } catch {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }

    if (!Array.isArray(parsed) || parsed.length !== 2) return null;

    const [createdAt, id] = parsed;

    if (typeof createdAt !== 'string' || !isCanonicalIsoInstant(createdAt)) return null;
    if (!isCanonicalBase64Url(id, SHARE_LINK_ID_BYTES)) return null;

    return { createdAt, id };
};

const boundLimit = (limit: number): number => {
    if (!Number.isFinite(limit)) return DEFAULT_LIST_LIMIT;

    return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIST_LIMIT);
};

/**
 * Reads one bounded page of the caller's own shares, newest first. A decoded
 * cursor is the only accepted cursor form; the route decodes/validates the raw
 * caller string before this point.
 */
export const listShareLinks = async (input: ListShareLinksInput): Promise<ListShareLinksResult> => {
    const limit = boundLimit(input.limit);
    const cursor = input.cursor ?? null;

    const result = await neogma.queryRunner.run(
        `MATCH (s:ShareLink {namespace: $namespace, ownerProfileId: $ownerProfileId})
         WHERE $cursorCreatedAt IS NULL
            OR s.createdAt < $cursorCreatedAt
            OR (s.createdAt = $cursorCreatedAt AND s.id < $cursorId)
         RETURN s
         ORDER BY s.createdAt DESC, s.id DESC
         LIMIT toInteger($limit)`,
        {
            namespace: input.namespace,
            ownerProfileId: input.ownerProfileId,
            cursorCreatedAt: cursor?.createdAt ?? null,
            cursorId: cursor?.id ?? null,
            limit: limit + 1,
        }
    );

    const fetched: ShareLinkRecord[] = [];

    for (let index = 0; index < result.records.length; index += 1) {
        const props = readNodeProperties(result, 's', index);

        if (props) fetched.push(toShareLinkRecord(props));
    }

    const hasMore = fetched.length > limit;
    const records = hasMore ? fetched.slice(0, limit) : fetched;
    const last = records[records.length - 1];

    return {
        records,
        hasMore,
        nextCursor:
            hasMore && last
                ? encodeShareLinkListCursor({ createdAt: last.createdAt, id: last.id })
                : null,
    };
};
