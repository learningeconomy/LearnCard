import { describe, it, expect } from 'vitest';

import {
    escapeColonsInDomain,
    constructUri,
    getUriParts,
    getIdFromUri,
} from '@helpers/uri.helpers';

// ─── Domain permutations ────────────────────────────────────────────────────
// Production:  cloud.learncard.com                     (no colon)
// Preview:     pr-99.preview.learncard.ai:cloud        (colon = path prefix)
// Localhost:   localhost:4100                           (colon = port)

const PROD_DOMAIN = 'cloud.learncard.com';
const PREVIEW_DOMAIN = 'pr-99.preview.learncard.ai:cloud';
const LOCALHOST_DOMAIN = 'localhost:4100';

// ─── escapeColonsInDomain ───────────────────────────────────────────────────

describe('escapeColonsInDomain', () => {
    it('encodes colons in preview domain before /trpc:', () => {
        const uri = 'lc:cloud:pr-99.preview.learncard.ai:cloud/trpc:credential:abc123';
        expect(escapeColonsInDomain(uri)).toBe(
            'lc:cloud:pr-99.preview.learncard.ai%3Acloud/trpc:credential:abc123'
        );
    });

    it('leaves production domain unchanged (no colon in domain)', () => {
        const uri = 'lc:cloud:cloud.learncard.com/trpc:credential:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });

    it('handles URIs with / path separators in domain (new format)', () => {
        const uri = 'lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:credential:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });

    it('handles URIs with already-encoded %3A (no double encoding)', () => {
        const uri = 'lc:cloud:pr-99.preview.learncard.ai%3Acloud/trpc:credential:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });

    it('returns URI unchanged when no /trpc: present', () => {
        const uri = 'lc:cloud:cloud.learncard.com:credential:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });
});

// ─── constructUri ───────────────────────────────────────────────────────────

describe('constructUri', () => {
    describe('production domain', () => {
        it('constructs URI with no encoding needed', () => {
            expect(constructUri('credential', 'abc123', PROD_DOMAIN)).toBe(
                'lc:cloud:cloud.learncard.com/trpc:credential:abc123'
            );
        });

        it('works for presentations', () => {
            expect(constructUri('presentation', 'pres1', PROD_DOMAIN)).toBe(
                'lc:cloud:cloud.learncard.com/trpc:presentation:pres1'
            );
        });

        it('works for boosts', () => {
            expect(constructUri('boost', 'boost1', PROD_DOMAIN)).toBe(
                'lc:cloud:cloud.learncard.com/trpc:boost:boost1'
            );
        });
    });

    describe('preview domain', () => {
        it('encodes colon as / (path prefix, not port)', () => {
            expect(constructUri('credential', 'abc123', PREVIEW_DOMAIN)).toBe(
                'lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:credential:abc123'
            );
        });
    });

    describe('localhost domain', () => {
        it('encodes colon as %3A (port)', () => {
            expect(constructUri('credential', 'abc123', LOCALHOST_DOMAIN)).toBe(
                'lc:cloud:localhost%3A4100/trpc:credential:abc123'
            );
        });
    });
});

// ─── getUriParts ────────────────────────────────────────────────────────────

describe('getUriParts', () => {
    describe('production URIs', () => {
        it('parses standard production URI', () => {
            const uri = 'lc:cloud:cloud.learncard.com/trpc:credential:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'cloud.learncard.com/trpc',
                type: 'credential',
                id: 'abc123',
            });
        });
    });

    describe('preview URIs (new / format)', () => {
        it('parses preview URI with / path prefix', () => {
            const uri = 'lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:credential:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai/cloud/trpc',
                type: 'credential',
                id: 'abc123',
            });
        });
    });

    describe('preview URIs (legacy %3A format)', () => {
        it('parses legacy preview URI with %3A', () => {
            const uri = 'lc:cloud:pr-99.preview.learncard.ai%3Acloud/trpc:credential:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai%3Acloud/trpc',
                type: 'credential',
                id: 'abc123',
            });
        });
    });

    describe('preview URIs (raw colon — needs escaping)', () => {
        it('escapes colon in domain and parses correctly', () => {
            const uri = 'lc:cloud:pr-99.preview.learncard.ai:cloud/trpc:credential:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai%3Acloud/trpc',
                type: 'credential',
                id: 'abc123',
            });
        });
    });

    describe('localhost URIs', () => {
        it('parses localhost URI with %3A port', () => {
            const uri = 'lc:cloud:localhost%3A4100/trpc:credential:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'localhost%3A4100/trpc',
                type: 'credential',
                id: 'abc123',
            });
        });
    });

    describe('error cases', () => {
        it('throws on URI with wrong part count', () => {
            expect(() => getUriParts('lc:cloud:domain')).toThrow('Invalid URI');
        });

        it('throws on non-cloud URI', () => {
            expect(() => getUriParts('lc:network:domain/trpc:credential:id')).toThrow(
                'URI is not an lc:cloud URI'
            );
        });

        it('throws on unknown URI type', () => {
            expect(() => getUriParts('lc:cloud:domain/trpc:unknown:id')).toThrow(
                'Unknown URI type'
            );
        });
    });
});

// ─── constructUri → getUriParts roundtrip ───────────────────────────────────

describe('constructUri → getUriParts roundtrip', () => {
    const domains = [
        { name: 'production', domain: PROD_DOMAIN },
        { name: 'preview', domain: PREVIEW_DOMAIN },
        { name: 'localhost', domain: LOCALHOST_DOMAIN },
    ];

    const types = ['credential', 'presentation', 'boost'] as const;

    for (const { name, domain } of domains) {
        for (const type of types) {
            it(`roundtrips ${type} on ${name} domain`, () => {
                const id = 'test-id-456';
                const uri = constructUri(type, id, domain);
                const parts = getUriParts(uri);

                expect(parts.type).toBe(type);
                expect(parts.id).toBe(id);
            });
        }
    }
});

// ─── getIdFromUri ───────────────────────────────────────────────────────────

describe('getIdFromUri', () => {
    it('extracts ID from production URI', () => {
        expect(getIdFromUri('lc:cloud:cloud.learncard.com/trpc:credential:abc123')).toBe('abc123');
    });

    it('extracts ID from preview URI', () => {
        expect(getIdFromUri('lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:credential:abc123')).toBe('abc123');
    });

    it('extracts ID from localhost URI', () => {
        expect(getIdFromUri('lc:cloud:localhost%3A4100/trpc:credential:abc123')).toBe('abc123');
    });
});
