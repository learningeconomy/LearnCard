import { describe, expect, it } from 'vitest';

import { SHARE_LINK_ID_BYTES } from '@learncard/types';

import {
    decodeShareLinkListCursor,
    encodeShareLinkListCursor,
} from '../src/accesslayer/share-link/list';

/**
 * Canonical, versioned owner-list cursor codec (DB-free).
 *
 * The cursor is an ordering hint over exactly `(createdAt, id)`; it must reject
 * everything malformed, non-canonical, oversized or from another version without
 * throwing.
 */

const ID = Buffer.alloc(SHARE_LINK_ID_BYTES, 7).toString('base64url');

describe('share-link list cursor codec', () => {
    it('round-trips exactly the two ordering fields', () => {
        const cursor = { createdAt: '2026-09-20T00:00:00.000Z', id: ID };
        const encoded = encodeShareLinkListCursor(cursor);

        expect(encoded.startsWith('v1.')).toBe(true);
        expect(decodeShareLinkListCursor(encoded)).toEqual(cursor);
    });

    it('rejects non-string, empty and oversized input', () => {
        expect(decodeShareLinkListCursor(undefined)).toBeNull();
        expect(decodeShareLinkListCursor(123)).toBeNull();
        expect(decodeShareLinkListCursor('')).toBeNull();
        expect(decodeShareLinkListCursor(`v1.${'A'.repeat(600)}`)).toBeNull();
    });

    it('rejects an unknown version prefix', () => {
        expect(
            decodeShareLinkListCursor(`v2.${Buffer.from('["a","b"]').toString('base64url')}`)
        ).toBeNull();
        expect(decodeShareLinkListCursor('list.abc')).toBeNull();
    });

    it('rejects non-canonical base64url and non-JSON payloads', () => {
        expect(decodeShareLinkListCursor('v1.@@@@')).toBeNull();
        expect(decodeShareLinkListCursor('v1.====')).toBeNull();
        expect(
            decodeShareLinkListCursor(`v1.${Buffer.from('not json', 'utf8').toString('base64url')}`)
        ).toBeNull();
    });

    it('rejects wrong arity or non-string fields', () => {
        const payload = (value: unknown) =>
            `v1.${Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')}`;

        expect(decodeShareLinkListCursor(payload(['2026-09-20T00:00:00.000Z']))).toBeNull();
        expect(
            decodeShareLinkListCursor(payload(['2026-09-20T00:00:00.000Z', ID, 'extra']))
        ).toBeNull();
        expect(decodeShareLinkListCursor(payload([1, ID]))).toBeNull();
        expect(decodeShareLinkListCursor(payload(['2026-09-20T00:00:00.000Z', 1]))).toBeNull();
        expect(decodeShareLinkListCursor(payload({ createdAt: 'x', id: ID }))).toBeNull();
    });

    it('rejects impossible timestamps and non-canonical ISO spellings', () => {
        const payload = (value: unknown) =>
            `v1.${Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')}`;

        expect(decodeShareLinkListCursor(payload(['not-a-date', ID]))).toBeNull();
        expect(decodeShareLinkListCursor(payload(['2026-13-40T00:00:00.000Z', ID]))).toBeNull();
        // Valid instant but not the exact canonical `toISOString` spelling.
        expect(decodeShareLinkListCursor(payload(['2026-09-20T00:00:00Z', ID]))).toBeNull();
    });

    it('rejects an id that is not canonical base64url for exactly 16 bytes', () => {
        const payload = (createdAt: string, id: string) =>
            `v1.${Buffer.from(JSON.stringify([createdAt, id]), 'utf8').toString('base64url')}`;

        expect(decodeShareLinkListCursor(payload('2026-09-20T00:00:00.000Z', 'short'))).toBeNull();
        expect(decodeShareLinkListCursor(payload('2026-09-20T00:00:00.000Z', `${ID}=`))).toBeNull();
        expect(
            decodeShareLinkListCursor(
                payload('2026-09-20T00:00:00.000Z', Buffer.alloc(8, 1).toString('base64url'))
            )
        ).toBeNull();
    });
});
