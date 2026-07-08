import { describe, it, expect } from 'vitest';

import { detectSource } from './detectSource';

const CTID = 'ce-a1b2c3d4-1111-2222-3333-444455556666';

describe('detectSource', () => {
    it('returns empty for blank input', () => {
        expect(detectSource('   ').kind).toBe('empty');
    });

    it('recognizes a bare CTID and lowercases it', () => {
        const result = detectSource(`  ${CTID.toUpperCase()}  `);
        expect(result.kind).toBe('ctid');
        expect(result.extracted).toBe(CTID);
    });

    it('recognizes parseable JSON with full confidence', () => {
        const result = detectSource('{"@context":[],"type":[]}');
        expect(result.kind).toBe('json');
        expect(result.confidence).toBe(1);
    });

    it('treats a leading brace as a weak JSON signal while typing', () => {
        const result = detectSource('{"name": ');
        expect(result.kind).toBe('json');
        expect(result.confidence).toBeLessThan(1);
    });

    it('extracts a CTID from a credentialfinder URL', () => {
        const result = detectSource(`https://credentialfinder.org/credential/${CTID}`);
        expect(result.kind).toBe('credentialEngineUrl');
        expect(result.extracted).toBe(CTID);
    });

    it('detects a CASE / OpenSALT framework URL', () => {
        const result = detectSource('https://opensalt.net/ims/case/v1p0/CFDocuments/abc');
        expect(result.kind).toBe('caseFramework');
    });

    it('falls back to a generic hosted credential URL', () => {
        const result = detectSource('https://example.org/badges/123.json');
        expect(result.kind).toBe('url');
    });

    it('returns unknown for unrecognized free text', () => {
        expect(detectSource('just some words').kind).toBe('unknown');
    });
});
