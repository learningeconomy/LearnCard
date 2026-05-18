import { describe, expect, it, vi, beforeEach } from 'vitest';

import { VC, TemplateRenderMethod } from '@learncard/types';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: unknown) => vc,
}));

import { buildRenderData, getSvgMustacheRenderMethod, renderSvgMustache } from './renderMethod.helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dataUri(svg: string, base64 = false): string {
    if (base64) return `data:image/svg+xml;base64,${btoa(svg)}`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function makeRenderMethod(template: string): TemplateRenderMethod {
    return {
        type: 'TemplateRenderMethod',
        renderSuite: 'svg-mustache',
        template,
    };
}

const minimalVc: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: { id: 'did:example:issuer' },
    credentialSubject: { id: 'did:example:subject', name: 'Ada Lovelace' },
    issuanceDate: '2026-01-01T00:00:00Z',
} as unknown as VC;

// ---------------------------------------------------------------------------
// buildRenderData
// ---------------------------------------------------------------------------

describe('buildRenderData', () => {
    it('spreads credential fields at the top level', () => {
        const data = buildRenderData(minimalVc);
        expect(data.issuer).toEqual(minimalVc.issuer);
        expect(data.credentialSubject).toEqual(minimalVc.credentialSubject);
    });

    it('adds vc and credential aliases', () => {
        const data = buildRenderData(minimalVc);
        expect(data.vc).toBe(data.credential);
    });

    it('wraps single credentialSubject in credentialSubjects array', () => {
        const data = buildRenderData(minimalVc);
        expect(Array.isArray(data.credentialSubjects)).toBe(true);
        expect((data.credentialSubjects as unknown[]).length).toBe(1);
    });

    it('keeps credentialSubjects as array when already an array', () => {
        const vcWithArray = {
            ...minimalVc,
            credentialSubject: [
                { id: 'did:example:a', name: 'A' },
                { id: 'did:example:b', name: 'B' },
            ],
        } as unknown as VC;
        const data = buildRenderData(vcWithArray);
        expect((data.credentialSubjects as unknown[]).length).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// getSvgMustacheRenderMethod — array vs object renderMethod
// ---------------------------------------------------------------------------

describe('getSvgMustacheRenderMethod', () => {
    const templateRm: TemplateRenderMethod = {
        type: 'TemplateRenderMethod',
        renderSuite: 'svg-mustache',
        template: dataUri('<svg></svg>'),
    };

    it('returns null when renderMethod is absent', () => {
        expect(getSvgMustacheRenderMethod(minimalVc)).toBeNull();
    });

    it('returns null for unsupported type', () => {
        const vc = { ...minimalVc, renderMethod: { type: 'OtherMethod', renderSuite: 'png' } } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)).toBeNull();
    });

    it('returns null when type is TemplateRenderMethod but renderSuite is not svg-mustache', () => {
        const vc = {
            ...minimalVc,
            renderMethod: { type: 'TemplateRenderMethod', renderSuite: 'png', template: 'http://example.com' },
        } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)).toBeNull();
    });

    it('finds renderMethod from a plain object (not array)', () => {
        const vc = { ...minimalVc, renderMethod: templateRm } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)?.renderSuite).toBe('svg-mustache');
    });

    it('finds the first svg-mustache entry from an array', () => {
        const vc = {
            ...minimalVc,
            renderMethod: [
                { type: 'OtherRenderMethod', renderSuite: 'png' },
                templateRm,
            ],
        } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)?.renderSuite).toBe('svg-mustache');
    });

    it('skips non-TemplateRenderMethod entries before returning the right one', () => {
        const second: TemplateRenderMethod = { ...templateRm, template: dataUri('<svg><text>second</text></svg>') };
        const vc = {
            ...minimalVc,
            renderMethod: [
                { type: 'OtherRenderMethod', renderSuite: 'png' },
                templateRm,
                second,
            ],
        } as unknown as VC;
        const result = getSvgMustacheRenderMethod(vc);
        expect(result?.template).toBe(templateRm.template);
    });
});

// ---------------------------------------------------------------------------
// renderSvgMustache — data: URI loading
// ---------------------------------------------------------------------------

describe('renderSvgMustache — data URI loading', () => {
    it('decodes a URI-encoded data URI and renders Mustache template', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).toContain('Ada Lovelace');
    });

    it('decodes a base64 data URI', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg, true));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).toContain('Ada Lovelace');
    });
});

// ---------------------------------------------------------------------------
// renderSvgMustache — DOMPurify sanitization
// ---------------------------------------------------------------------------

describe('renderSvgMustache — DOMPurify sanitization', () => {
    it('strips <script> tags from the rendered SVG', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><text>safe</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toContain('<script>');
        expect(result).toContain('safe');
    });

    it('strips <script> injected via Mustache interpolation', async () => {
        const evilVc = {
            ...minimalVc,
            credentialSubject: { id: 'did:example:subject', name: '</text><script>alert(1)</script><text>' },
        } as unknown as VC;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(evilVc, rm);
        expect(result).not.toContain('<script>');
    });

    it('strips javascript: href attributes', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>click</text></a></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toMatch(/href\s*=\s*["']javascript:/i);
    });

    it('strips inline event handlers (onload)', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text onload="alert(1)">hi</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toContain('onload');
    });
});

// ---------------------------------------------------------------------------
// renderSvgMustache — JSON Pointer ~0/~1 escape resolution
// ---------------------------------------------------------------------------

describe('renderSvgMustache — renderProperty JSON Pointer escapes', () => {
    it('resolves ~1 (slash escape) in renderProperty pointers', async () => {
        const vcWithSlashKey = {
            ...minimalVc,
            credentialSubject: { id: 'did:example:s', 'skills/programming': 'TypeScript' },
        } as unknown as VC;
        // Template uses the decoded key under credentialSubject
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.skills/programming}}</text></svg>';
        const rm: TemplateRenderMethod = {
            ...makeRenderMethod(dataUri(svg)),
            renderProperty: ['/credentialSubject/skills~1programming'],
        };
        const result = await renderSvgMustache(vcWithSlashKey, rm);
        expect(result).toContain('TypeScript');
    });

    it('resolves ~0 (tilde escape) in renderProperty pointers', async () => {
        const vcWithTildeKey = {
            ...minimalVc,
            credentialSubject: { id: 'did:example:s', 'level~advanced': true },
        } as unknown as VC;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.level~advanced}}</text></svg>';
        const rm: TemplateRenderMethod = {
            ...makeRenderMethod(dataUri(svg)),
            renderProperty: ['/credentialSubject/level~0advanced'],
        };
        const result = await renderSvgMustache(vcWithTildeKey, rm);
        expect(result).toContain('true');
    });

    it('skips missing pointer values without crashing', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.missing}}</text></svg>';
        const rm: TemplateRenderMethod = {
            ...makeRenderMethod(dataUri(svg)),
            renderProperty: ['/credentialSubject/missing'],
        };
        const result = await renderSvgMustache(minimalVc, rm);
        // Mustache renders missing values as empty string
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('null');
    });
});

// ---------------------------------------------------------------------------
// renderSvgMustache — network fetch
// ---------------------------------------------------------------------------

describe('renderSvgMustache — network fetch', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches a template from a URL and renders it', async () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => svg,
        } as Response);

        const rm = makeRenderMethod('https://example.com/template.svg');
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).toContain('Ada Lovelace');
    });

    it('throws when the fetch response is not ok', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        } as Response);

        const rm = makeRenderMethod('https://example.com/missing.svg');
        await expect(renderSvgMustache(minimalVc, rm)).rejects.toThrow('404');
    });
});
