import { describe, it, expect, vi } from 'vitest';

vi.mock('@accesslayer/boost/read', () => ({ getBoostByUri: vi.fn() }));
vi.mock('@accesslayer/consentflowcontract/read', () => ({ getContractByUri: vi.fn() }));
vi.mock('@accesslayer/consentflowcontract/relationships/read', () => ({ getContractTermsByUri: vi.fn() }));
vi.mock('@accesslayer/credential/read', () => ({ getCredentialByUri: vi.fn() }));
vi.mock('@accesslayer/presentation/read', () => ({ getPresentationByUri: vi.fn() }));
vi.mock('@accesslayer/skill-framework/read', () => ({ getSkillFrameworkById: vi.fn() }));
vi.mock('@accesslayer/skill/read', () => ({ getSkillByFrameworkAndId: vi.fn() }));
vi.mock('@helpers/learnCard.helpers', () => ({ getLearnCard: vi.fn() }));

import {
    escapeColonsInDomain,
    constructUri,
    getUriParts,
    getIdFromUri,
    getDomainFromUri,
    getSkillCompoundFromUri,
} from '@helpers/uri.helpers';

// ─── Domain permutations ────────────────────────────────────────────────────
// Production:  network.learncard.com          (no colon)
// Preview:     pr-99.preview.learncard.ai:brain  (colon = path prefix)
// Localhost:   localhost:4000                  (colon = port)

const PROD_DOMAIN = 'network.learncard.com';
const PREVIEW_DOMAIN = 'pr-99.preview.learncard.ai:brain';
const LOCALHOST_DOMAIN = 'localhost:4000';

// ─── escapeColonsInDomain ───────────────────────────────────────────────────

describe('escapeColonsInDomain', () => {
    it('encodes colons in preview domain before /trpc:', () => {
        const uri = 'lc:network:pr-99.preview.learncard.ai:brain/trpc:boost:abc123';
        expect(escapeColonsInDomain(uri)).toBe(
            'lc:network:pr-99.preview.learncard.ai%3Abrain/trpc:boost:abc123'
        );
    });

    it('encodes localhost colon when no /trpc: present', () => {
        const uri = 'lc:network:localhost:4000:boost:abc123';
        expect(escapeColonsInDomain(uri)).toBe(
            'lc:network:localhost%3A4000:boost:abc123'
        );
    });

    it('leaves production domain unchanged (no colon in domain)', () => {
        const uri = 'lc:network:network.learncard.com/trpc:boost:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });

    it('handles URIs with / path separators in domain (new format)', () => {
        const uri = 'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });

    it('handles cloud URIs with preview domain', () => {
        const uri = 'lc:cloud:pr-99.preview.learncard.ai:cloud/trpc:credential:xyz';
        expect(escapeColonsInDomain(uri)).toBe(
            'lc:cloud:pr-99.preview.learncard.ai%3Acloud/trpc:credential:xyz'
        );
    });

    it('handles URIs with already-encoded %3A (no double encoding)', () => {
        const uri = 'lc:network:pr-99.preview.learncard.ai%3Abrain/trpc:boost:abc123';
        expect(escapeColonsInDomain(uri)).toBe(uri);
    });
});

// ─── constructUri ───────────────────────────────────────────────────────────

describe('constructUri', () => {
    describe('production domain', () => {
        it('constructs URI with no encoding needed', () => {
            expect(constructUri('boost', 'abc123', PROD_DOMAIN)).toBe(
                'lc:network:network.learncard.com/trpc:boost:abc123'
            );
        });
    });

    describe('preview domain', () => {
        it('encodes colon as / (path prefix, not port)', () => {
            expect(constructUri('boost', 'abc123', PREVIEW_DOMAIN)).toBe(
                'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123'
            );
        });

        it('works for credentials', () => {
            expect(constructUri('credential', 'cred789', PREVIEW_DOMAIN)).toBe(
                'lc:network:pr-99.preview.learncard.ai/brain/trpc:credential:cred789'
            );
        });
    });

    describe('localhost domain', () => {
        it('encodes colon as %3A (port)', () => {
            expect(constructUri('boost', 'abc123', LOCALHOST_DOMAIN)).toBe(
                'lc:network:localhost%3A4000/trpc:boost:abc123'
            );
        });
    });

    describe('skill URIs', () => {
        it('constructs skill URI with compound ID', () => {
            expect(constructUri('skill', 'framework1:skill2', PROD_DOMAIN)).toBe(
                'lc:network:network.learncard.com/trpc:skill:framework1:skill2'
            );
        });
    });
});

// ─── getUriParts ────────────────────────────────────────────────────────────

describe('getUriParts', () => {
    describe('production URIs', () => {
        it('parses standard production URI', () => {
            const uri = 'lc:network:network.learncard.com/trpc:boost:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'network.learncard.com/trpc',
                type: 'boost',
                id: 'abc123',
                method: 'network',
            });
        });
    });

    describe('preview URIs (new / format)', () => {
        it('parses preview URI with / path prefix', () => {
            const uri = 'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai/brain/trpc',
                type: 'boost',
                id: 'abc123',
                method: 'network',
            });
        });
    });

    describe('preview URIs (legacy %3A format)', () => {
        it('parses legacy preview URI with %3A', () => {
            const uri = 'lc:network:pr-99.preview.learncard.ai%3Abrain/trpc:boost:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai%3Abrain/trpc',
                type: 'boost',
                id: 'abc123',
                method: 'network',
            });
        });
    });

    describe('preview URIs (raw colon — needs escaping)', () => {
        it('escapes colon in domain and parses correctly', () => {
            const uri = 'lc:network:pr-99.preview.learncard.ai:brain/trpc:boost:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'pr-99.preview.learncard.ai%3Abrain/trpc',
                type: 'boost',
                id: 'abc123',
                method: 'network',
            });
        });
    });

    describe('localhost URIs', () => {
        it('parses localhost URI with %3A port', () => {
            const uri = 'lc:network:localhost%3A4000/trpc:boost:abc123';
            expect(getUriParts(uri)).toEqual({
                domain: 'localhost%3A4000/trpc',
                type: 'boost',
                id: 'abc123',
                method: 'network',
            });
        });
    });

    describe('skill URIs (compound ID with extra colons)', () => {
        it('parses skill URI preserving compound ID', () => {
            const uri = 'lc:network:network.learncard.com/trpc:skill:framework1:skill2';
            expect(getUriParts(uri)).toEqual({
                domain: 'network.learncard.com/trpc',
                type: 'skill',
                id: 'framework1:skill2',
                method: 'network',
            });
        });
    });

    describe('outside URIs', () => {
        it('allows cloud URIs with allowOutsideUris=true', () => {
            const uri = 'lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:credential:xyz';
            expect(getUriParts(uri, true)).toEqual({
                domain: 'pr-99.preview.learncard.ai/cloud/trpc',
                type: 'credential',
                id: 'xyz',
                method: 'cloud',
            });
        });

        it('rejects cloud URIs without allowOutsideUris', () => {
            const uri = 'lc:cloud:cloud.learncard.com/trpc:credential:xyz';
            expect(() => getUriParts(uri)).toThrow('URI is not an lc:network URI');
        });
    });

    describe('error cases', () => {
        it('throws on URI with too few parts', () => {
            expect(() => getUriParts('lc:network:domain')).toThrow('Invalid URI');
        });

        it('throws on unknown URI type', () => {
            expect(() => getUriParts('lc:network:domain/trpc:unknown:id')).toThrow(
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

    const types = ['boost', 'credential', 'presentation', 'contract', 'terms', 'framework'] as const;

    for (const { name, domain } of domains) {
        for (const type of types) {
            it(`roundtrips ${type} on ${name} domain`, () => {
                const id = 'test-id-123';
                const uri = constructUri(type, id, domain);
                const parts = getUriParts(uri);

                expect(parts.type).toBe(type);
                expect(parts.id).toBe(id);
                expect(parts.method).toBe('network');
            });
        }
    }

    it('roundtrips skill URI with compound ID on production', () => {
        const uri = constructUri('skill', 'fw1:sk2', PROD_DOMAIN);
        const parts = getUriParts(uri);

        expect(parts.type).toBe('skill');
        expect(parts.id).toBe('fw1:sk2');
    });

    it('roundtrips skill URI with compound ID on preview', () => {
        const uri = constructUri('skill', 'fw1:sk2', PREVIEW_DOMAIN);
        const parts = getUriParts(uri);

        expect(parts.type).toBe('skill');
        expect(parts.id).toBe('fw1:sk2');
    });
});

// ─── getIdFromUri ───────────────────────────────────────────────────────────

describe('getIdFromUri', () => {
    it('extracts ID from production URI', () => {
        expect(getIdFromUri('lc:network:network.learncard.com/trpc:boost:abc123')).toBe('abc123');
    });

    it('extracts ID from preview URI', () => {
        expect(getIdFromUri('lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123')).toBe('abc123');
    });

    it('extracts compound ID from skill URI', () => {
        expect(getIdFromUri('lc:network:network.learncard.com/trpc:skill:fw1:sk2')).toBe('fw1:sk2');
    });
});

// ─── getDomainFromUri ───────────────────────────────────────────────────────

describe('getDomainFromUri', () => {
    it('strips /trpc suffix from production domain', () => {
        expect(getDomainFromUri('lc:network:network.learncard.com/trpc:boost:abc123')).toBe(
            'network.learncard.com'
        );
    });

    it('strips /trpc suffix from preview domain', () => {
        expect(getDomainFromUri('lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123')).toBe(
            'pr-99.preview.learncard.ai/brain'
        );
    });

    it('strips /trpc suffix from localhost domain', () => {
        expect(getDomainFromUri('lc:network:localhost%3A4000/trpc:boost:abc123')).toBe(
            'localhost%3A4000'
        );
    });
});

// ─── getSkillCompoundFromUri ────────────────────────────────────────────────

describe('getSkillCompoundFromUri', () => {
    it('extracts frameworkId and id from skill URI', () => {
        const uri = 'lc:network:network.learncard.com/trpc:skill:framework1:skill2';
        expect(getSkillCompoundFromUri(uri)).toEqual({
            frameworkId: 'framework1',
            id: 'skill2',
        });
    });

    it('extracts from preview skill URI', () => {
        const uri = 'lc:network:pr-99.preview.learncard.ai/brain/trpc:skill:fw1:sk2';
        expect(getSkillCompoundFromUri(uri)).toEqual({
            frameworkId: 'fw1',
            id: 'sk2',
        });
    });

    it('throws on non-skill URI', () => {
        const uri = 'lc:network:network.learncard.com/trpc:boost:abc123';
        expect(() => getSkillCompoundFromUri(uri)).toThrow('Not a skill URI');
    });

    it('throws on skill URI with missing skillId', () => {
        const uri = 'lc:network:network.learncard.com/trpc:skill:onlyFramework';
        expect(() => getSkillCompoundFromUri(uri)).toThrow('Invalid skill URI');
    });

    it('throws on skill URI with too many segments', () => {
        const uri = 'lc:network:network.learncard.com/trpc:skill:fw:sk:extra';
        expect(() => getSkillCompoundFromUri(uri)).toThrow('Invalid skill URI');
    });
});
