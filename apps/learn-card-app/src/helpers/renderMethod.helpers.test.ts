import { describe, expect, it, vi, beforeEach } from 'vitest';

import { VC, TemplateRenderMethod } from '@learncard/types';

import { renderSvgMustache } from './renderMethod.helpers';

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

describe('renderSvgMustache — data URI loading', () => {
    it('decodes a URI-encoded data URI and renders the Mustache template', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).toContain('Ada Lovelace');
    });

    it('decodes a base64 data URI', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg, true));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).toContain('Ada Lovelace');
    });
});

describe('renderSvgMustache — DOMPurify sanitization', () => {
    it('strips <script> tags from the rendered SVG', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><text>safe</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toContain('<script>');
        expect(result).toContain('safe');
    });

    it('strips <script> injected via Mustache interpolation', async () => {
        const evilVc = {
            ...minimalVc,
            credentialSubject: {
                id: 'did:example:subject',
                name: '</text><script>alert(1)</script><text>',
            },
        } as unknown as VC;
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(evilVc, rm);
        expect(result).not.toContain('<script>');
    });

    it('strips javascript: href attributes', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>click</text></a></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toMatch(/href\s*=\s*["']javascript:/i);
    });

    it('strips inline event handlers (onload)', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text onload="alert(1)">hi</text></svg>';
        const rm = makeRenderMethod(dataUri(svg));
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toContain('onload');
    });
});

describe('renderSvgMustache — renderProperty JSON Pointer escapes', () => {
    it('resolves ~1 (slash escape) in renderProperty pointers', async () => {
        const vcWithSlashKey = {
            ...minimalVc,
            credentialSubject: { id: 'did:example:s', 'skills/programming': 'TypeScript' },
        } as unknown as VC;
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.skills/programming}}</text></svg>';
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
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.level~advanced}}</text></svg>';
        const rm: TemplateRenderMethod = {
            ...makeRenderMethod(dataUri(svg)),
            renderProperty: ['/credentialSubject/level~0advanced'],
        };
        const result = await renderSvgMustache(vcWithTildeKey, rm);
        expect(result).toContain('true');
    });

    it('skips missing pointer values without crashing', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.missing}}</text></svg>';
        const rm: TemplateRenderMethod = {
            ...makeRenderMethod(dataUri(svg)),
            renderProperty: ['/credentialSubject/missing'],
        };
        const result = await renderSvgMustache(minimalVc, rm);
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('null');
    });
});

describe('renderSvgMustache — network fetch', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches a template from a URL and renders it', async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';
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
