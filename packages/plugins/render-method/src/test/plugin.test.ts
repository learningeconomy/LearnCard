import type { UnsignedVC, VC, TemplateRenderMethod } from '@learncard/types';

import {
    attachRenderMethod,
    buildTemplateRenderMethod,
    DEFAULT_TEMPLATE_ID,
    getRenderMethodPlugin,
} from '../plugin';
import {
    buildRenderData,
    findRenderMethod,
    findRenderMethods,
    findTemplateRenderMethod,
    findTemplateRenderMethods,
    getRenderMethods,
    getSvgMustacheRenderMethod,
    isSvgMustacheRenderMethod,
    isTemplateRenderMethod,
} from '../read';
import { AttachRenderMethodConfig, RENDER_METHOD_CONTEXT } from '../types';

const minimalVc: UnsignedVC = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
} as UnsignedVC;

describe('buildTemplateRenderMethod', () => {
    it('builds a TemplateRenderMethod from a templateId', () => {
        const rm = buildTemplateRenderMethod({ templateId: 'https://example.com/t.svg' });

        expect(rm.type).toBe('TemplateRenderMethod');
        expect(rm.renderSuite).toBe('svg-mustache');
        expect(rm.template).toBe('https://example.com/t.svg');
        expect(rm.outputPreference).toEqual({ mediaType: 'image/svg+xml' });
        expect((rm as TemplateRenderMethod).renderProperty).toBeUndefined();
    });

    it('builds a TemplateRenderMethod from a templateValue as a URL-encoded data URI', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{name}}</text></svg>';
        const rm = buildTemplateRenderMethod({ templateValue: svg });

        expect(rm.template.startsWith('data:image/svg+xml,')).toBe(true);
        const payload = rm.template.slice('data:image/svg+xml,'.length);
        expect(decodeURIComponent(payload)).toBe(svg);
    });

    it('round-trips multi-byte and special characters in templateValue', () => {
        const svg = '<svg>{{ name }}<text>åé→#?&</text></svg>';
        const rm = buildTemplateRenderMethod({ templateValue: svg });

        const payload = rm.template.slice('data:image/svg+xml,'.length);
        expect(decodeURIComponent(payload)).toBe(svg);
    });

    it('includes renderProperty only when explicitly provided', () => {
        const withProps = buildTemplateRenderMethod({
            templateId: 'https://example.com/t.svg',
            renderProperty: ['/credentialSubject/name'],
        });
        const withoutProps = buildTemplateRenderMethod({
            templateId: 'https://example.com/t.svg',
        });

        expect(withProps.renderProperty).toEqual(['/credentialSubject/name']);
        expect(withoutProps.renderProperty).toBeUndefined();
    });

    it('accepts http and https schemes for templateId', () => {
        expect(
            buildTemplateRenderMethod({ templateId: 'http://example.com/t.svg' }).template
        ).toBe('http://example.com/t.svg');
        expect(
            buildTemplateRenderMethod({ templateId: 'https://example.com/t.svg' }).template
        ).toBe('https://example.com/t.svg');
    });

    it('rejects non-http(s) templateId schemes', () => {
        expect(() =>
            buildTemplateRenderMethod({
                templateId: 'javascript:alert(1)',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);

        expect(() =>
            buildTemplateRenderMethod({
                templateId: 'file:///etc/passwd',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);

        expect(() =>
            buildTemplateRenderMethod({ templateId: 'data:text/html,evil' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('rejects empty or whitespace-only templateId', () => {
        expect(() =>
            buildTemplateRenderMethod({ templateId: '' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
        expect(() =>
            buildTemplateRenderMethod({ templateId: '   ' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('rejects empty templateValue', () => {
        expect(() =>
            buildTemplateRenderMethod({ templateValue: '' } as AttachRenderMethodConfig)
        ).toThrow(/must be a non-empty SVG/i);
        expect(() =>
            buildTemplateRenderMethod({ templateValue: '   \n  ' } as AttachRenderMethodConfig)
        ).toThrow(/must be a non-empty SVG/i);
    });

    it('rejects a config with neither templateId nor templateValue', () => {
        expect(() =>
            buildTemplateRenderMethod({} as AttachRenderMethodConfig)
        ).toThrow(/must provide either `templateId` or `templateValue`/i);
    });
});

describe('attachRenderMethod (opt-in)', () => {
    it('returns the VC unchanged when no config is provided', () => {
        const result = attachRenderMethod(minimalVc);

        expect(result).toBe(minimalVc);
        expect(result.renderMethod).toBeUndefined();
        expect(result['@context']).not.toContain(RENDER_METHOD_CONTEXT);
    });

    it('attaches a renderMethod and the render-method JSON-LD context when config is provided', () => {
        const result = attachRenderMethod(minimalVc, {
            templateId: 'https://example.com/t.svg',
        });

        expect(result).not.toBe(minimalVc);
        expect(Array.isArray(result.renderMethod)).toBe(false);
        expect((result.renderMethod as TemplateRenderMethod).template).toBe(
            'https://example.com/t.svg'
        );
        expect(result['@context']).toContain(RENDER_METHOD_CONTEXT);
    });

    it('normalizes a string @context into an array before appending', () => {
        const vcWithStringContext = {
            ...minimalVc,
            '@context': 'https://www.w3.org/ns/credentials/v2',
        } as unknown as UnsignedVC;

        const result = attachRenderMethod(vcWithStringContext, {
            templateId: 'https://example.com/t.svg',
        });

        expect(Array.isArray(result['@context'])).toBe(true);
        expect(result['@context']).toContain('https://www.w3.org/ns/credentials/v2');
        expect(result['@context']).toContain(RENDER_METHOD_CONTEXT);
    });

    it('is idempotent on @context: does not duplicate the render-method context', () => {
        const once = attachRenderMethod(minimalVc, {
            templateId: 'https://example.com/t.svg',
        });
        const twice = attachRenderMethod(once, {
            templateId: 'https://example.com/t2.svg',
        });

        const occurrences = (twice['@context'] as string[]).filter(
            c => c === RENDER_METHOD_CONTEXT
        );
        expect(occurrences.length).toBe(1);
    });

    it('wraps a pre-existing single renderMethod object into an array', () => {
        const existing: TemplateRenderMethod = {
            type: 'TemplateRenderMethod',
            renderSuite: 'svg-mustache',
            template: 'https://example.com/existing.svg',
            outputPreference: { mediaType: 'image/svg+xml' },
        };
        const vcWithExisting = { ...minimalVc, renderMethod: existing } as UnsignedVC;

        const result = attachRenderMethod(vcWithExisting, {
            templateId: 'https://example.com/new.svg',
        });

        const renderMethods = result.renderMethod as TemplateRenderMethod[];
        expect(Array.isArray(renderMethods)).toBe(true);
        expect(renderMethods).toHaveLength(2);
        expect(renderMethods[0].template).toBe('https://example.com/existing.svg');
        expect(renderMethods[1].template).toBe('https://example.com/new.svg');
    });

    it('appends to a pre-existing renderMethod array', () => {
        const existing: TemplateRenderMethod[] = [
            {
                type: 'TemplateRenderMethod',
                renderSuite: 'svg-mustache',
                template: 'https://example.com/a.svg',
                outputPreference: { mediaType: 'image/svg+xml' },
            },
            {
                type: 'TemplateRenderMethod',
                renderSuite: 'svg-mustache',
                template: 'https://example.com/b.svg',
                outputPreference: { mediaType: 'image/svg+xml' },
            },
        ];
        const vcWithArray = { ...minimalVc, renderMethod: existing } as UnsignedVC;

        const result = attachRenderMethod(vcWithArray, {
            templateId: 'https://example.com/c.svg',
        });

        const renderMethods = result.renderMethod as TemplateRenderMethod[];
        expect(renderMethods).toHaveLength(3);
        expect(renderMethods[2].template).toBe('https://example.com/c.svg');
    });

    it('propagates buildTemplateRenderMethod throws on invalid templateId', () => {
        expect(() =>
            attachRenderMethod(minimalVc, {
                templateId: 'javascript:bad',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('does not mutate the input VC when attaching', () => {
        const originalContext = [...(minimalVc['@context'] as string[])];
        const originalRenderMethod = minimalVc.renderMethod;

        attachRenderMethod(minimalVc, { templateId: 'https://example.com/t.svg' });

        expect(minimalVc['@context']).toEqual(originalContext);
        expect(minimalVc.renderMethod).toBe(originalRenderMethod);
    });
});

describe('getRenderMethodPlugin', () => {
    it('returns a plugin descriptor with the expected shape', () => {
        const plugin = getRenderMethodPlugin({} as never);

        expect(plugin.name).toBe('Render Method');
        expect(plugin.displayName).toBe('Render Method Plugin');
        expect(typeof plugin.methods.attachRenderMethod).toBe('function');
        expect(typeof plugin.methods.buildTemplateRenderMethod).toBe('function');
    });

    it('exposes attachRenderMethod with opt-in semantics via the plugin', () => {
        const plugin = getRenderMethodPlugin({} as never);

        const unchanged = plugin.methods.attachRenderMethod({} as never, minimalVc);
        expect(unchanged).toBe(minimalVc);

        const attached = plugin.methods.attachRenderMethod({} as never, minimalVc, {
            templateId: DEFAULT_TEMPLATE_ID,
        });
        expect(attached).not.toBe(minimalVc);
        expect(attached.renderMethod).toBeDefined();
    });

    it('exposes buildTemplateRenderMethod via the plugin', () => {
        const plugin = getRenderMethodPlugin({} as never);

        const rm = plugin.methods.buildTemplateRenderMethod({} as never, {
            templateId: 'https://example.com/t.svg',
        });
        expect(rm.type).toBe('TemplateRenderMethod');
        expect(rm.template).toBe('https://example.com/t.svg');
    });
});

describe('DEFAULT_TEMPLATE_ID', () => {
    it('points to the LearnCard template host over https', () => {
        expect(DEFAULT_TEMPLATE_ID.startsWith('https://templates.learncard.com/')).toBe(true);
    });

    it('is accepted as a valid templateId', () => {
        const rm = buildTemplateRenderMethod({ templateId: DEFAULT_TEMPLATE_ID });
        expect(rm.template).toBe(DEFAULT_TEMPLATE_ID);
    });
});

const validSvgMustacheRm: TemplateRenderMethod = {
    type: 'TemplateRenderMethod',
    renderSuite: 'svg-mustache',
    template: 'https://example.com/t.svg',
    outputPreference: { mediaType: 'image/svg+xml' },
};

describe('type guards', () => {
    it('isTemplateRenderMethod accepts a valid TemplateRenderMethod', () => {
        expect(isTemplateRenderMethod(validSvgMustacheRm)).toBe(true);
    });

    it('isTemplateRenderMethod rejects shapes missing required fields', () => {
        expect(isTemplateRenderMethod({})).toBe(false);
        expect(isTemplateRenderMethod({ type: 'TemplateRenderMethod' })).toBe(false);
        expect(isTemplateRenderMethod(null)).toBe(false);
        expect(isTemplateRenderMethod('not-an-object')).toBe(false);
    });

    it('isSvgMustacheRenderMethod accepts only svg-mustache TemplateRenderMethods', () => {
        expect(isSvgMustacheRenderMethod(validSvgMustacheRm)).toBe(true);
        expect(
            isSvgMustacheRenderMethod({ ...validSvgMustacheRm, renderSuite: 'html-mustache' })
        ).toBe(false);
        expect(
            isSvgMustacheRenderMethod({ ...validSvgMustacheRm, type: 'OtherRenderMethod' })
        ).toBe(false);
        expect(isSvgMustacheRenderMethod(null)).toBe(false);
    });
});

describe('getRenderMethods', () => {
    it('returns [] when the VC has no renderMethod', () => {
        const vc = { '@context': [], type: ['VerifiableCredential'] } as unknown as VC;
        expect(getRenderMethods(vc)).toEqual([]);
    });

    it('normalizes a single-object renderMethod to a one-element array', () => {
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        expect(getRenderMethods(vc)).toEqual([validSvgMustacheRm]);
    });

    it('returns the renderMethod array as-is for array-form VCs', () => {
        const rmArr = [validSvgMustacheRm, { ...validSvgMustacheRm, template: 'https://b.svg' }];
        const vc = { renderMethod: rmArr } as unknown as VC;
        expect(getRenderMethods(vc)).toEqual(rmArr);
    });

    it('unwraps CertifiedBoostCredential to read renderMethod from inner boostCredential', () => {
        const boostInner = { renderMethod: validSvgMustacheRm };
        const wrapped = {
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: boostInner,
        } as unknown as VC;
        expect(getRenderMethods(wrapped)).toEqual([validSvgMustacheRm]);
    });

    it('does NOT validate entries — passes through raw shapes', () => {
        const junk = { type: 'UnknownRenderMethod', foo: 'bar' };
        const vc = { renderMethod: junk } as unknown as VC;
        expect(getRenderMethods(vc)).toEqual([junk]);
    });
});

describe('findRenderMethod / findRenderMethods', () => {
    it('findRenderMethod returns the first match by predicate', () => {
        const other = { type: 'OtherRenderMethod', renderSuite: 'png' };
        const vc = {
            renderMethod: [other, validSvgMustacheRm],
        } as unknown as VC;
        expect(findRenderMethod(vc, isSvgMustacheRenderMethod)).toEqual(validSvgMustacheRm);
    });

    it('findRenderMethod returns null when no entry matches', () => {
        const vc = {
            renderMethod: [{ type: 'OtherRenderMethod', renderSuite: 'png' }],
        } as unknown as VC;
        expect(findRenderMethod(vc, isSvgMustacheRenderMethod)).toBeNull();
    });

    it('findRenderMethods returns every match', () => {
        const a = { ...validSvgMustacheRm, template: 'https://a.svg' };
        const b = { ...validSvgMustacheRm, template: 'https://b.svg' };
        const other = { type: 'OtherRenderMethod', renderSuite: 'png' };
        const vc = { renderMethod: [a, other, b] } as unknown as VC;
        expect(findRenderMethods(vc, isSvgMustacheRenderMethod)).toEqual([a, b]);
    });

    it('supports custom predicates for future render suites', () => {
        const htmlMustache = {
            type: 'TemplateRenderMethod',
            renderSuite: 'html-mustache',
            template: 'https://example.com/t.html',
        };
        const vc = { renderMethod: [validSvgMustacheRm, htmlMustache] } as unknown as VC;

        const isHtmlMustache = (rm: unknown): rm is TemplateRenderMethod =>
            typeof rm === 'object' &&
            rm !== null &&
            (rm as { renderSuite?: unknown }).renderSuite === 'html-mustache';

        expect(findRenderMethod(vc, isHtmlMustache)).toEqual(htmlMustache);
    });
});

describe('getSvgMustacheRenderMethod', () => {
    it('returns the first svg-mustache entry', () => {
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)).toEqual(validSvgMustacheRm);
    });

    it('returns null when no svg-mustache entry exists', () => {
        const vc = {
            renderMethod: [{ type: 'OtherRenderMethod', renderSuite: 'png' }],
        } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)).toBeNull();
    });

    it('returns null when renderMethod is missing entirely', () => {
        expect(getSvgMustacheRenderMethod({} as VC)).toBeNull();
    });

    it('skips invalid entries and finds the first VALID svg-mustache entry', () => {
        const invalid = { type: 'TemplateRenderMethod', renderSuite: 'svg-mustache' };
        const vc = { renderMethod: [invalid, validSvgMustacheRm] } as unknown as VC;
        expect(getSvgMustacheRenderMethod(vc)).toEqual(validSvgMustacheRm);
    });

    it('unwraps CertifiedBoostCredential', () => {
        const wrapped = {
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: { renderMethod: validSvgMustacheRm },
        } as unknown as VC;
        expect(getSvgMustacheRenderMethod(wrapped)).toEqual(validSvgMustacheRm);
    });
});

describe('buildRenderData', () => {
    const vc = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential'],
        issuer: { id: 'did:example:issuer', name: 'Example College' },
        validFrom: '2026-01-15T00:00:00Z',
        credentialSubject: { id: 'did:example:subject', name: 'Ada Lovelace' },
    } as unknown as VC;

    it('spreads credential fields at the top level', () => {
        const data = buildRenderData(vc);
        expect(data.issuer).toEqual(vc.issuer);
        expect(data.credentialSubject).toEqual(vc.credentialSubject);
    });

    it('adds vc and credential aliases pointing at the credential', () => {
        const data = buildRenderData(vc);
        expect(data.vc).toBe(data.credential);
    });

    it('wraps a single credentialSubject in credentialSubjects array', () => {
        const data = buildRenderData(vc);
        expect(Array.isArray(data.credentialSubjects)).toBe(true);
        expect((data.credentialSubjects as unknown[])).toHaveLength(1);
    });

    it('keeps credentialSubjects as-is when already an array', () => {
        const multi = {
            ...vc,
            credentialSubject: [{ name: 'A' }, { name: 'B' }],
        } as unknown as VC;
        const data = buildRenderData(multi);
        expect((data.credentialSubjects as unknown[])).toHaveLength(2);
    });

    it('overlays renderProperty (RFC 6901 pointers) at their pointer paths', () => {
        const data = buildRenderData(vc, ['/issuer/name', '/credentialSubject/name']);
        expect((data.issuer as { name: string }).name).toBe('Example College');
        expect((data.credentialSubject as { name: string }).name).toBe('Ada Lovelace');
    });

    it('handles RFC 6901 escapes (~1 -> /, ~0 -> ~)', () => {
        const escaped = {
            ...vc,
            credentialSubject: {
                'a/b': 'slash-value',
                'a~b': 'tilde-value',
            },
        } as unknown as VC;
        const data = buildRenderData(escaped, [
            '/credentialSubject/a~1b',
            '/credentialSubject/a~0b',
        ]);
        expect((data.credentialSubject as Record<string, string>)['a/b']).toBe('slash-value');
        expect((data.credentialSubject as Record<string, string>)['a~b']).toBe('tilde-value');
    });

    it('skips pointers that resolve to undefined', () => {
        const data = buildRenderData(vc, ['/credentialSubject/missing']);
        expect((data.credentialSubject as Record<string, unknown>).missing).toBeUndefined();
    });

    it('does NOT unwrap CertifiedBoostCredential (caller chooses the layer)', () => {
        const wrapped = {
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            issuer: { name: 'Wrapper Issuer' },
            boostCredential: { issuer: { name: 'Inner Issuer' } },
        } as unknown as VC;
        const data = buildRenderData(wrapped);
        expect((data.issuer as { name: string }).name).toBe('Wrapper Issuer');
    });
});

describe('buildRenderData — prototype-pollution defense', () => {
    const proto = Object.prototype as Record<string, unknown>;

    afterEach(() => {
        delete proto.polluted;
        delete proto.polluted2;
        delete proto.polluted3;
    });

    it('rejects /__proto__/<key> pointers (does not pollute Object.prototype)', () => {
        const maliciousVc = {
            __proto__: { polluted: 'pwned' },
            credentialSubject: { id: 'did:example:s' },
        } as unknown as VC;

        buildRenderData(maliciousVc, ['/__proto__/polluted']);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(proto.polluted).toBeUndefined();
    });

    it('rejects /constructor/prototype/<key> pointers', () => {
        buildRenderData({ credentialSubject: {} } as unknown as VC, [
            '/constructor/prototype/polluted2',
        ]);
        expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
        expect(proto.polluted2).toBeUndefined();
    });

    it('rejects pointers containing /prototype/ segments', () => {
        buildRenderData({ credentialSubject: {} } as unknown as VC, [
            '/credentialSubject/prototype/polluted3',
        ]);
        expect(({} as Record<string, unknown>).polluted3).toBeUndefined();
        expect(proto.polluted3).toBeUndefined();
    });

    it('still processes safe pointers in the same call as a rejected one', () => {
        const vc = {
            credentialSubject: { id: 'did:example:s', name: 'Ada' },
        } as unknown as VC;
        const data = buildRenderData(vc, [
            '/__proto__/polluted',
            '/credentialSubject/name',
        ]);
        expect((data.credentialSubject as { name: string }).name).toBe('Ada');
        expect(proto.polluted).toBeUndefined();
    });
});

describe('findTemplateRenderMethod / findTemplateRenderMethods (string-based sugar)', () => {
    const htmlMustacheRm: TemplateRenderMethod = {
        type: 'TemplateRenderMethod',
        renderSuite: 'html-mustache',
        template: 'https://example.com/t.html',
    };

    it('finds by a single suite string', () => {
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        expect(findTemplateRenderMethod(vc, 'svg-mustache')).toEqual(validSvgMustacheRm);
    });

    it('returns null when no entry matches the single suite', () => {
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        expect(findTemplateRenderMethod(vc, 'html-mustache')).toBeNull();
    });

    it('finds the first match across an array of suites (capability negotiation)', () => {
        const vc = {
            renderMethod: [
                { type: 'OtherRenderMethod', renderSuite: 'png' },
                htmlMustacheRm,
                validSvgMustacheRm,
            ],
        } as unknown as VC;
        expect(
            findTemplateRenderMethod(vc, ['svg-mustache', 'html-mustache'])
        ).toEqual(htmlMustacheRm);
    });

    it('returns null when none of the listed suites match', () => {
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        expect(findTemplateRenderMethod(vc, ['html-mustache', 'pdf'])).toBeNull();
    });

    it('findTemplateRenderMethods returns every entry matching a single suite', () => {
        const second = { ...validSvgMustacheRm, template: 'https://b.svg' };
        const vc = { renderMethod: [validSvgMustacheRm, second] } as unknown as VC;
        expect(findTemplateRenderMethods(vc, 'svg-mustache')).toEqual([
            validSvgMustacheRm,
            second,
        ]);
    });

    it('findTemplateRenderMethods returns every entry matching any of an array of suites', () => {
        const vc = {
            renderMethod: [validSvgMustacheRm, htmlMustacheRm],
        } as unknown as VC;
        expect(
            findTemplateRenderMethods(vc, ['svg-mustache', 'html-mustache'])
        ).toHaveLength(2);
    });

    it('returns the Zod-parsed shape (unknown keys stripped)', () => {
        const withExtra = { ...validSvgMustacheRm, extraField: 'should-strip' };
        const vc = { renderMethod: withExtra } as unknown as VC;
        const found = findTemplateRenderMethod(vc, 'svg-mustache');
        expect(found).toBeDefined();
        expect((found as Record<string, unknown>).extraField).toBeUndefined();
    });

    it('unwraps CertifiedBoostCredential', () => {
        const wrapped = {
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: { renderMethod: htmlMustacheRm },
        } as unknown as VC;
        expect(findTemplateRenderMethod(wrapped, 'html-mustache')).toEqual(htmlMustacheRm);
    });
});

describe('plugin read-side methods', () => {
    it('exposes the read-side API via wallet.invoke surface', () => {
        const plugin = getRenderMethodPlugin({} as never);
        expect(typeof plugin.methods.getRenderMethods).toBe('function');
        expect(typeof plugin.methods.findRenderMethod).toBe('function');
        expect(typeof plugin.methods.findRenderMethods).toBe('function');
        expect(typeof plugin.methods.findTemplateRenderMethod).toBe('function');
        expect(typeof plugin.methods.findTemplateRenderMethods).toBe('function');
        expect(typeof plugin.methods.getSvgMustacheRenderMethod).toBe('function');
        expect(typeof plugin.methods.buildRenderData).toBe('function');
    });

    it('plugin.methods.findRenderMethod accepts a predicate and narrows', () => {
        const plugin = getRenderMethodPlugin({} as never);
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        const found = plugin.methods.findRenderMethod(
            {} as never,
            vc,
            isSvgMustacheRenderMethod
        );
        expect(found).toEqual(validSvgMustacheRm);
    });

    it('plugin.methods.findTemplateRenderMethod accepts a single suite string', () => {
        const plugin = getRenderMethodPlugin({} as never);
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        const found = plugin.methods.findTemplateRenderMethod({} as never, vc, 'svg-mustache');
        expect(found).toEqual(validSvgMustacheRm);
    });

    it('plugin.methods.findTemplateRenderMethod accepts an array of suites', () => {
        const plugin = getRenderMethodPlugin({} as never);
        const vc = { renderMethod: validSvgMustacheRm } as unknown as VC;
        const found = plugin.methods.findTemplateRenderMethod({} as never, vc, [
            'html-mustache',
            'svg-mustache',
        ]);
        expect(found).toEqual(validSvgMustacheRm);
    });
});
